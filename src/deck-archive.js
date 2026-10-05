import { CARDS, WRESTLERS, newRun } from "./game.js";

// Kept apart from the active-run slot: starting over never erases a champion deck.
export const DECK_ARCHIVE_KEY = "slay-deck-archive-v1";
export const MAX_SAVED_DECKS = 20;
export const MIN_ARCHIVED_DECK_SIZE = 5;
export const MAX_ARCHIVED_DECK_SIZE = 80;

const VERSION = 1;
const STAT_KEYS = [
  "cardsPlayed",
  "damageDealt",
  "enemiesDefeated",
  "finishers",
];
const emptyArchive = () => ({ version: VERSION, decks: [] });
const knownActor = (id) =>
  typeof id === "string" && Object.hasOwn(WRESTLERS, id);
const failure = (error, message, archive = emptyArchive()) => ({
  ok: false,
  error,
  message,
  archive,
});

function blueprint(cards, allowLegacyUpgrade = false) {
  if (
    !Array.isArray(cards) ||
    cards.length < MIN_ARCHIVED_DECK_SIZE ||
    cards.length > MAX_ARCHIVED_DECK_SIZE
  )
    return null;
  const result = [];
  for (const card of cards) {
    if (
      !card ||
      typeof card.id !== "string" ||
      !Object.hasOwn(CARDS, card.id) ||
      (typeof card.upgraded !== "boolean" &&
        !(allowLegacyUpgrade && card.upgraded === undefined))
    )
      return null;
    // No UIDs, temporary effects, or run resources are carried into the archive.
    result.push({ id: card.id, upgraded: card.upgraded === true });
  }
  return result;
}

function normalizedStats(stats) {
  return Object.fromEntries(
    STAT_KEYS.map((key) => [
      key,
      Number.isSafeInteger(stats?.[key]) && stats[key] >= 0 ? stats[key] : 0,
    ]),
  );
}

function timestamp(value) {
  if (value == null) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizedName(name, actorId) {
  const fallback = `${WRESTLERS[actorId].nameKo} 챔피언 덱`;
  return typeof name === "string"
    ? name
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 48) || fallback
    : fallback;
}

// A stable local identity, not an authentication token. Reloading a victory and
// saving it again must find the same entry even when its display name changes.
function fingerprint(value) {
  const text = JSON.stringify(value);
  let first = 2166136261;
  let second = 3339675911;
  for (let i = 0; i < text.length; i++) {
    first = Math.imul(first ^ text.charCodeAt(i), 16777619);
    second = Math.imul(second ^ text.charCodeAt(i), 2246822519);
  }
  return [first, second]
    .map((part) => (part >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function normalizedEntry(entry) {
  if (!entry || !knownActor(entry.actorId)) return null;
  const cards = blueprint(entry.cards);
  const savedAt = timestamp(entry.savedAt);
  if (
    !cards ||
    !savedAt ||
    !Number.isSafeInteger(entry.floor) ||
    entry.floor < 1 ||
    typeof entry.sourceRun !== "string" ||
    !/^[a-f0-9]{16}$/.test(entry.sourceRun) ||
    entry.id !== `deck-${entry.sourceRun}`
  )
    return null;
  return {
    id: entry.id,
    actorId: entry.actorId,
    name: normalizedName(entry.name, entry.actorId),
    cards,
    floor: entry.floor,
    stats: normalizedStats(entry.stats),
    savedAt,
    sourceRun: entry.sourceRun,
  };
}

function normalizeArchive(raw) {
  const archive = emptyArchive();
  let recovered = !raw || !Array.isArray(raw.decks);
  const seen = new Set();
  for (const candidate of Array.isArray(raw?.decks) ? raw.decks : []) {
    const entry = normalizedEntry(candidate);
    if (
      !entry ||
      seen.has(entry.sourceRun) ||
      archive.decks.length >= MAX_SAVED_DECKS
    ) {
      recovered = true;
      continue;
    }
    archive.decks.push(entry);
    seen.add(entry.sourceRun);
  }
  return { archive, recovered };
}

function browserStorage(storage) {
  // Access itself may throw in private/restricted browsing, not only setItem().
  return storage === undefined ? globalThis.localStorage : storage;
}

export function loadDeckArchive(storage) {
  let raw;
  try {
    const target = browserStorage(storage);
    if (!target || typeof target.getItem !== "function")
      return failure(
        "storage-unavailable",
        "이 브라우저에서 덱 보관함을 열 수 없습니다.",
      );
    raw = target.getItem(DECK_ARCHIVE_KEY);
  } catch {
    return failure(
      "storage-unavailable",
      "덱 보관함을 읽지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
    );
  }
  if (raw == null)
    return { ok: true, archive: emptyArchive(), recovered: false };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: true,
      archive: emptyArchive(),
      recovered: true,
      message:
        "손상된 덱 보관함을 발견했습니다. 완성 덱을 다시 저장할 수 있습니다.",
    };
  }
  if (parsed?.version !== VERSION && parsed?.version != null)
    return failure(
      "unsupported-version",
      "새 버전의 덱 보관함입니다. 게임을 새로고침해 주세요.",
    );
  const result = normalizeArchive(parsed);
  return {
    ok: true,
    ...result,
    ...(result.recovered
      ? {
          message:
            "손상되거나 중복된 덱 기록을 제외하고 보관함을 복구했습니다.",
        }
      : {}),
  };
}

function writeArchive(archive, storage) {
  try {
    const target = browserStorage(storage);
    if (!target || typeof target.setItem !== "function")
      throw new Error("No storage");
    target.setItem(DECK_ARCHIVE_KEY, JSON.stringify(archive));
    return { ok: true, archive };
  } catch {
    return failure(
      "storage-write-failed",
      "덱을 저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.",
      archive,
    );
  }
}

export function canArchiveRun(run) {
  // Legacy v1 victories remain eligible; they do not need a newly-added run ID.
  return !!(
    run?.phase === "victory" &&
    knownActor(run.player?.id) &&
    run.player.hp > 0 &&
    Number.isSafeInteger(run.floor) &&
    run.floor >= 1 &&
    run.floor === run.maxFloor &&
    run.enemy?.type === "boss" &&
    run.enemy.hp <= 0 &&
    blueprint(run.deck, true)
  );
}

export function saveCompletedDeck(
  run,
  { name, storage, now = Date.now() } = {},
) {
  if (!canArchiveRun(run))
    return failure(
      "not-completed",
      "최종 보스를 이긴 뒤 완성 덱을 저장할 수 있습니다.",
    );
  const loaded = loadDeckArchive(storage);
  if (!loaded.ok) return loaded;
  const cards = blueprint(run.deck, true);
  const stats = normalizedStats(run.stats);
  const sourceRun = fingerprint({
    actorId: run.player.id,
    runId: run.runId ?? null,
    seed: run.seed,
    floor: run.floor,
    stats,
    cards,
    route: run.route?.visited || run.history || [],
  });
  const existing = loaded.archive.decks.find(
    (deck) => deck.sourceRun === sourceRun,
  );
  if (existing)
    return {
      ok: true,
      archive: loaded.archive,
      deck: existing,
      duplicate: true,
      message: "이 완성 덱은 이미 보관함에 저장되어 있습니다.",
    };
  if (loaded.archive.decks.length >= MAX_SAVED_DECKS)
    return failure(
      "archive-full",
      `덱 보관함이 가득 찼습니다. 보관 덱 ${MAX_SAVED_DECKS}개 중 하나를 삭제해 주세요.`,
      loaded.archive,
    );
  const savedAt = timestamp(now);
  if (!savedAt)
    return failure(
      "invalid-date",
      "저장 시간을 확인하지 못했습니다. 다시 시도해 주세요.",
      loaded.archive,
    );
  const deck = {
    id: `deck-${sourceRun}`,
    actorId: run.player.id,
    name: normalizedName(name, run.player.id),
    cards,
    floor: run.floor,
    stats,
    savedAt,
    sourceRun,
  };
  const archive = { version: VERSION, decks: [deck, ...loaded.archive.decks] };
  const written = writeArchive(archive, storage);
  if (!written.ok) return { ...written, archive: loaded.archive };
  return {
    ...written,
    deck,
    duplicate: false,
    message: "완성 덱을 보관함에 저장했습니다.",
  };
}

export function deleteSavedDeck(deckId, { storage } = {}) {
  const loaded = loadDeckArchive(storage);
  if (!loaded.ok) return loaded;
  if (!loaded.archive.decks.some((deck) => deck.id === deckId))
    return failure(
      "deck-not-found",
      "보관함에서 덱을 찾지 못했습니다.",
      loaded.archive,
    );
  const archive = {
    version: VERSION,
    decks: loaded.archive.decks.filter((deck) => deck.id !== deckId),
  };
  const written = writeArchive(archive, storage);
  return written.ok
    ? { ...written, message: "보관 덱을 삭제했습니다." }
    : {
        ...written,
        archive: loaded.archive,
        message:
          "덱을 삭제하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      };
}

export function getDecksForWrestler(archive, actorId) {
  if (!knownActor(actorId)) return [];
  return normalizeArchive(archive).archive.decks.filter(
    (deck) => deck.actorId === actorId,
  );
}

export function startRunFromSavedDeck(entry, actorId, seed = Date.now()) {
  const deck = normalizedEntry(entry);
  if (!deck || deck.actorId !== actorId || !knownActor(actorId)) return null;
  // The engine builds a clean run before its first draw. Carrying the old hand,
  // statuses or UID counter would contaminate the new match and its passives.
  return newRun(actorId, seed, deck.cards);
}
