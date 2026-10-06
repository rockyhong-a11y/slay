// Championship trophies are cosmetic, separate from the finite match equipment.
// They never change a saved deck, combat balance, or the active-run storage slot.
export const BELT_COLLECTION_KEY = "slay-championship-belts-v1";
export const CHAMPIONSHIP_BELTS = [
  {
    id: "rookie-champion",
    wave: 1,
    name: "루키 챔피언 벨트",
    nameEn: "ROOKIE CHAMPION",
    tier: "브론즈",
    boss: "IRON REGENT",
    color: "#d89660",
    artKey: "belts/rookie-champion.svg",
    description: "루키 서킷의 최종 보스 IRON REGENT를 꺾은 증표.",
  },
  {
    id: "contender-champion",
    wave: 2,
    name: "컨텐더 챔피언 벨트",
    nameEn: "CONTENDER CHAMPION",
    tier: "실버",
    boss: "SABLE QUEEN",
    color: "#bad4ed",
    artKey: "belts/contender-champion.svg",
    description: "컨텐더 서킷의 최종 보스 SABLE QUEEN을 꺾은 증표.",
  },
  {
    id: "world-champion",
    wave: 3,
    name: "월드 챔피언 벨트",
    nameEn: "WORLD CHAMPION",
    tier: "골드",
    boss: "EMPRESS",
    color: "#f4cb78",
    artKey: "belts/world-champion.svg",
    description: "세 웨이브를 제패하고 EMPRESS의 왕좌를 차지한 증표.",
  },
];

export const getChampionshipBelt = (wave) =>
  CHAMPIONSHIP_BELTS.find((belt) => belt.wave === wave) || null;

function validAward(record) {
  const belt = getChampionshipBelt(record?.wave);
  if (!belt || (record.id != null && record.id !== belt.id)) return null;
  if (record.boss !== belt.boss) return null;
  return {
    id: belt.id,
    wave: belt.wave,
    boss: belt.boss,
    actorId:
      typeof record.actorId === "string" &&
      /^[a-z][a-z0-9-]{0,30}$/.test(record.actorId)
        ? record.actorId
        : null,
  };
}

// Existing three-wave saves already contain authoritative boss-clear records.
// Migrate those records without awarding unseen earlier waves or changing RNG.
export function normalizeBeltAwards(run) {
  const records = [
    ...(Array.isArray(run?.championshipBelts) ? run.championshipBelts : []),
    ...(Array.isArray(run?.waveClears)
      ? run.waveClears.map((entry) => ({ ...entry, actorId: run.player?.id }))
      : []),
  ];
  // A pre-three-wave victory can recover the one title it actually defeated.
  if (
    run?.phase === "victory" &&
    run.player?.hp > 0 &&
    run.enemy?.type === "boss" &&
    run.enemy.hp <= 0 &&
    !records.length
  ) {
    const belt = CHAMPIONSHIP_BELTS.find(
      (entry) => entry.boss === run.enemy.name,
    );
    if (belt) records.push({ ...belt, actorId: run.player.id });
  }
  const unique = new Map();
  for (const candidate of records) {
    const record = validAward(candidate);
    if (record && !unique.has(record.id)) unique.set(record.id, record);
  }
  return [...unique.values()].sort((left, right) => left.wave - right.wave);
}

export const getEarnedBelts = (run) =>
  normalizeBeltAwards(run).map((award) => ({
    ...getChampionshipBelt(award.wave),
    ...award,
  }));

export function getLatestBeltAward(run) {
  if (!["wave-clear", "victory"].includes(run?.phase)) return null;
  return getEarnedBelts(run).find((belt) => belt.wave === run.wave) || null;
}

const emptyCollection = () => ({ version: 1, belts: [] });
const failed = (error, message, collection = emptyCollection()) => ({
  ok: false,
  error,
  message,
  collection,
});
const storageFor = (storage) =>
  storage === undefined ? globalThis.localStorage : storage;

function validDate(value) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function loadBeltCollection(storage) {
  let raw;
  try {
    const target = storageFor(storage);
    if (typeof target?.getItem !== "function") throw new Error("No storage");
    raw = target.getItem(BELT_COLLECTION_KEY);
  } catch {
    return failed("storage-unavailable", "벨트 보관함을 열지 못했습니다.");
  }
  if (raw == null)
    return { ok: true, collection: emptyCollection(), recovered: false };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: true, collection: emptyCollection(), recovered: true };
  }
  if (parsed?.version != null && parsed.version !== 1)
    return failed("unsupported-version", "벨트 보관함의 버전을 확인해 주세요.");
  const collection = emptyCollection();
  let recovered = !Array.isArray(parsed?.belts);
  for (const candidate of Array.isArray(parsed?.belts) ? parsed.belts : []) {
    const award = validAward(candidate);
    const earnedAt = validDate(candidate?.earnedAt);
    if (
      !award ||
      !earnedAt ||
      collection.belts.some((entry) => entry.id === award.id)
    ) {
      recovered = true;
      continue;
    }
    collection.belts.push({ ...award, earnedAt });
  }
  collection.belts.sort((left, right) => left.wave - right.wave);
  return { ok: true, collection, recovered };
}

/** Repeated React effects, reloads and future wins can never duplicate a title. */
export function collectRunBelts(run, { storage, now = Date.now() } = {}) {
  const loaded = loadBeltCollection(storage);
  if (!loaded.ok) return loaded;
  const incoming = normalizeBeltAwards(run).filter(
    (award) => !loaded.collection.belts.some((entry) => entry.id === award.id),
  );
  if (!incoming.length) return { ...loaded, newBelts: [] };
  const date = new Date(now);
  if (!Number.isFinite(date.getTime()))
    return failed(
      "invalid-date",
      "벨트 획득 시간을 확인하지 못했습니다.",
      loaded.collection,
    );
  const newBelts = incoming.map((award) => ({
    ...award,
    earnedAt: date.toISOString(),
  }));
  const collection = {
    version: 1,
    belts: [...loaded.collection.belts, ...newBelts].sort(
      (a, b) => a.wave - b.wave,
    ),
  };
  try {
    const target = storageFor(storage);
    if (typeof target?.setItem !== "function") throw new Error("No storage");
    target.setItem(BELT_COLLECTION_KEY, JSON.stringify(collection));
  } catch {
    return failed(
      "storage-write-failed",
      "벨트 저장을 완료하지 못했습니다. 이 경기 기록에서 다시 시도할 수 있습니다.",
      loaded.collection,
    );
  }
  return { ok: true, collection, newBelts, recovered: loaded.recovered };
}
