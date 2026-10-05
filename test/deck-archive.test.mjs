import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, WRESTLERS, newRun, playCard } from "../src/game.js";
import { createJourneyQA } from "../src/journey-qa.js";
import {
  DECK_ARCHIVE_KEY,
  MAX_SAVED_DECKS,
  canArchiveRun,
  loadDeckArchive,
  saveCompletedDeck,
  deleteSavedDeck,
  getDecksForWrestler,
  startRunFromSavedDeck,
} from "../src/deck-archive.js";

const NOW = "2026-10-05T03:00:00.000Z";

test("the public-action victory fixture archives a genuinely cleared, upgraded deck", () => {
  const run = createJourneyQA("victory");
  assert.equal(run.player.id, "raven");
  assert.equal(run.phase, "victory");
  assert.equal(run.enemy.type, "boss");
  assert.equal(run.enemy.hp, 0);
  assert.ok(run.stats.enemiesDefeated >= 5);
  assert.ok(run.stats.cardsPlayed > 0);
  assert.ok(run.deck.some((card) => card.upgraded));
  assert.ok(canArchiveRun(run));
  assert.deepEqual(run, createJourneyQA("victory"));
  const saved = saveCompletedDeck(run, { storage: memoryStorage(), now: NOW });
  const fresh = startRunFromSavedDeck(saved.deck, "raven", 42);
  assert.equal(fresh.phase, "combat");
  assert.equal(fresh.floor, 1);
  assert.equal(fresh.stats.enemiesDefeated, 0);
  assert.deepEqual(
    fresh.deck.map(({ id, upgraded }) => ({ id, upgraded })),
    saved.deck.cards,
  );
});

function memoryStorage() {
  const values = new Map();
  return {
    writes: 0,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      this.writes++;
      values.set(key, String(value));
    },
  };
}

function completedRun(actorId = "atlas", seed = 1823) {
  let run = newRun(actorId, seed);
  run.floor = run.maxFloor;
  run.wave = run.waveCount;
  run.enemy.type = "boss";
  run.enemy.hp = 1;
  run.hand = [{ uid: "winning-strike", id: "strike", upgraded: false }];
  run = playCard(run, "winning-strike");
  assert.equal(run.phase, "victory");
  return run;
}

test("only a living final-boss victory can enter the completed-deck archive", () => {
  const victory = completedRun();
  assert.equal(canArchiveRun(victory), true);
  for (const phase of [
    "combat",
    "reward",
    "map",
    "rest",
    "shop",
    "event",
    "defeat",
  ]) {
    const run = { ...victory, phase };
    assert.equal(canArchiveRun(run), false, phase);
    assert.equal(
      saveCompletedDeck(run, { storage: memoryStorage() }).error,
      "not-completed",
    );
  }
  for (const change of [
    { floor: victory.maxFloor - 1 },
    { player: { ...victory.player, hp: 0 } },
    { enemy: { ...victory.enemy, hp: 1 } },
    { enemy: { ...victory.enemy, type: "fight" } },
    { player: { ...victory.player, id: "constructor" } },
    { deck: victory.deck.slice(0, 4) },
    { deck: Array.from({ length: 81 }, () => victory.deck[0]) },
  ])
    assert.equal(canArchiveRun({ ...victory, ...change }), false);
  assert.equal(canArchiveRun(null), false);
});

test("archive stores an immutable blueprint including exact duplicates and upgrades", () => {
  const storage = memoryStorage();
  const run = completedRun();
  run.deck = [
    { uid: "old-17", id: "strike", upgraded: true },
    { uid: "old-18", id: "strike", upgraded: false },
    { uid: "old-19", id: "strike", upgraded: true },
    { uid: "old-20", id: "armbar", upgraded: true },
    { uid: "old-21", id: "guard", upgraded: false },
    { uid: "old-22", id: "nightmare", upgraded: false },
  ];
  const before = structuredClone(run);
  const saved = saveCompletedDeck(run, {
    name: "  피니시 루프  ",
    storage,
    now: NOW,
  });
  assert.equal(saved.ok, true);
  assert.equal(saved.deck.name, "피니시 루프");
  assert.equal(saved.deck.actorId, "atlas");
  assert.equal(saved.deck.savedAt, NOW);
  assert.equal(saved.deck.floor, run.maxFloor);
  assert.deepEqual(saved.deck.stats, run.stats);
  assert.deepEqual(
    saved.deck.cards,
    run.deck.map(({ id, upgraded }) => ({ id, upgraded })),
  );
  assert.ok(saved.deck.cards.every((card) => !Object.hasOwn(card, "uid")));
  assert.deepEqual(run, before);
  run.deck[0].upgraded = false;
  assert.equal(saved.deck.cards[0].upgraded, true);
  saved.deck.cards[1].upgraded = true;
  assert.equal(
    loadDeckArchive(storage).archive.decks[0].cards[1].upgraded,
    false,
  );
});

test("reloading and saving a victory twice is idempotent even under a new title", () => {
  const storage = memoryStorage();
  const run = completedRun();
  const first = saveCompletedDeck(run, { name: "첫 이름", storage, now: NOW });
  const writes = storage.writes;
  const second = saveCompletedDeck(JSON.parse(JSON.stringify(run)), {
    name: "중복 이름",
    storage,
    now: "2026-10-06T00:00:00Z",
  });
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.deepEqual(second.deck, first.deck);
  assert.equal(second.archive.decks.length, 1);
  assert.equal(storage.writes, writes);
});

test("a legacy v1 victory with no archive/run ID and missing upgrade flags is eligible", () => {
  const run = completedRun("raven");
  delete run.runId;
  delete run.route;
  delete run.mechanicsVersion;
  run.deck.forEach((card) => delete card.upgraded);
  assert.equal(run.version, 1);
  const saved = saveCompletedDeck(run, { storage: memoryStorage(), now: NOW });
  assert.equal(saved.ok, true);
  assert.ok(saved.deck.cards.every((card) => card.upgraded === false));
});

test("archived decks are character-bound, detached, and exclude forged card IDs", () => {
  const storage = memoryStorage();
  const atlas = saveCompletedDeck(completedRun("atlas"), {
    storage,
    now: NOW,
  }).deck;
  const lynx = saveCompletedDeck(completedRun("lynx"), {
    storage,
    now: NOW,
  }).deck;
  const archive = loadDeckArchive(storage).archive;
  assert.deepEqual(
    getDecksForWrestler(archive, "atlas").map((deck) => deck.id),
    [atlas.id],
  );
  assert.deepEqual(
    getDecksForWrestler(archive, "lynx").map((deck) => deck.id),
    [lynx.id],
  );
  assert.deepEqual(getDecksForWrestler(archive, "constructor"), []);
  assert.equal(startRunFromSavedDeck(atlas, "lynx", 42), null);
  const selected = getDecksForWrestler(archive, "atlas")[0];
  selected.cards[0].upgraded = !selected.cards[0].upgraded;
  assert.notEqual(
    selected.cards[0].upgraded,
    archive.decks.find((deck) => deck.id === atlas.id).cards[0].upgraded,
  );
  for (const id of ["not-a-card", "constructor", "__proto__"]) {
    const forged = structuredClone(atlas);
    forged.cards[0].id = id;
    assert.equal(startRunFromSavedDeck(forged, "atlas", 42), null);
  }
  const badUpgrade = structuredClone(atlas);
  badUpgrade.cards[0].upgraded = "false";
  assert.equal(startRunFromSavedDeck(badUpgrade, "atlas", 42), null);
});

test("a saved deck starts fresh HP, money, gear, passives, piles and a deterministic opening draw", () => {
  const run = completedRun("seraph");
  run.deck = [
    "dropkick",
    "dropkick",
    "moonsault",
    "guard",
    "armbar",
    "focus",
    "suplex",
  ].map((id, i) => ({ uid: `previous-${i}`, id, upgraded: i % 2 === 0 }));
  run.player.hp = 1;
  run.player.coins = 999;
  run.player.hype = 9;
  run.player.stress = 90;
  run.combo = 6;
  run.maxEnergy = 9;
  run.status.firstAerial = false;
  run.nextUid = 799;
  run.inventory = [{ uid: "old-gear", id: "icepack" }];
  run.stats.cardsPlayed = 70;
  const entry = saveCompletedDeck(run, {
    storage: memoryStorage(),
    now: NOW,
  }).deck;
  const before = structuredClone(entry);
  const fresh = startRunFromSavedDeck(entry, "seraph", 39103);
  assert.ok(fresh);
  assert.deepEqual(fresh, startRunFromSavedDeck(entry, "seraph", 39103));
  assert.deepEqual(entry, before);
  assert.equal(fresh.player.hp, WRESTLERS.seraph.maxHp);
  assert.equal(fresh.player.maxHp, WRESTLERS.seraph.maxHp);
  assert.equal(fresh.player.coins, 80);
  assert.equal(fresh.player.stress, 0);
  assert.equal(fresh.player.hype, 0);
  assert.equal(fresh.energy, 3);
  assert.equal(fresh.maxEnergy, 3);
  assert.equal(fresh.combo, 0);
  assert.equal(fresh.floor, 1);
  assert.equal(fresh.turn, 1);
  assert.equal(fresh.phase, "combat");
  assert.deepEqual(fresh.stats, {
    cardsPlayed: 0,
    damageDealt: 0,
    enemiesDefeated: 0,
    finishers: 0,
  });
  assert.deepEqual(fresh.status, newRun("seraph").status);
  assert.equal(fresh.enemy.type, "fight");
  assert.equal(fresh.enemy.hp, fresh.enemy.maxHp);
  assert.deepEqual(fresh.discard, []);
  assert.deepEqual(fresh.exhaust, []);
  assert.equal(
    fresh.hand.length,
    4,
    "opening Iron Corner draw penalty still applies",
  );
  assert.equal(fresh.activeGimmick.id, "ironcorner");
  assert.equal(fresh.inventory[0].id, "icepack");
  assert.notEqual(fresh.inventory[0].uid, "old-gear");
  assert.equal(
    new Set(fresh.deck.map((card) => card.uid)).size,
    entry.cards.length,
  );
  assert.ok(fresh.deck.every((card) => !card.uid.startsWith("previous-")));
  assert.deepEqual(
    fresh.deck.map(({ id, upgraded }) => ({ id, upgraded })),
    entry.cards,
  );
  assert.deepEqual(
    [...fresh.hand, ...fresh.draw].map((card) => card.uid).sort(),
    fresh.deck.map((card) => card.uid).sort(),
  );
  assert.ok(
    fresh.nextUid >
      Math.max(...fresh.deck.map((card) => Number(card.uid.slice(1)))),
  );
  assert.deepEqual(fresh.route.visited, ["f1-0"]);
  fresh.deck[0].upgraded = !fresh.deck[0].upgraded;
  assert.deepEqual(entry, before);
});

test("new opening cards resolve their draw effects rather than bypassing nightmare pressure", () => {
  const run = completedRun();
  run.deck = Array.from({ length: 5 }, (_, i) => ({
    uid: `n-${i}`,
    id: "nightmare",
    upgraded: false,
  }));
  const entry = saveCompletedDeck(run, {
    storage: memoryStorage(),
    now: NOW,
  }).deck;
  const fresh = startRunFromSavedDeck(entry, "atlas", 10);
  assert.equal(fresh.hand.length, 4);
  assert.equal(fresh.player.stress, CARDS.nightmare.onDrawStress * 4);
});

test("corrupt JSON and malformed entries recover valid decks without touching the active run", () => {
  const storage = memoryStorage();
  storage.setItem("slay-run-v1", "active run stays here");
  storage.setItem(DECK_ARCHIVE_KEY, "{broken");
  let result = loadDeckArchive(storage);
  assert.equal(result.ok, true);
  assert.equal(result.recovered, true);
  assert.deepEqual(result.archive.decks, []);
  const saved = saveCompletedDeck(completedRun(), { storage, now: NOW });
  const bad = structuredClone(saved.deck);
  bad.cards[0].id = "unknown";
  storage.setItem(
    DECK_ARCHIVE_KEY,
    JSON.stringify({
      version: 1,
      decks: [
        null,
        bad,
        saved.deck,
        saved.deck,
        { ...saved.deck, actorId: "constructor" },
      ],
    }),
  );
  result = loadDeckArchive(storage);
  assert.equal(result.ok, true);
  assert.equal(result.recovered, true);
  assert.equal(result.archive.decks.length, 1);
  assert.equal(result.archive.decks[0].id, saved.deck.id);
  assert.equal(storage.getItem("slay-run-v1"), "active run stays here");
});

test("storage denial, failed writes and a future schema report explicit errors without false success", () => {
  const victory = completedRun();
  const denied = {
    getItem() {
      throw new Error("SecurityError");
    },
  };
  assert.equal(loadDeckArchive(denied).error, "storage-unavailable");
  assert.equal(loadDeckArchive(null).error, "storage-unavailable");
  assert.equal(saveCompletedDeck(victory, { storage: denied }).ok, false);
  const full = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  const failure = saveCompletedDeck(victory, { storage: full, now: NOW });
  assert.equal(failure.ok, false);
  assert.equal(failure.error, "storage-write-failed");
  assert.deepEqual(
    failure.archive.decks,
    [],
    "failed writes must not appear saved in the UI",
  );
  const storage = memoryStorage();
  const future = JSON.stringify({ version: 100, decks: [] });
  storage.setItem(DECK_ARCHIVE_KEY, future);
  assert.equal(
    saveCompletedDeck(victory, { storage, now: NOW }).error,
    "unsupported-version",
  );
  assert.equal(storage.getItem(DECK_ARCHIVE_KEY), future);
});

test("the archive caps at 20, never silently evicts, and deletion frees a slot", () => {
  const storage = memoryStorage();
  for (let i = 0; i < MAX_SAVED_DECKS; i++)
    assert.equal(
      saveCompletedDeck(completedRun("atlas", 100 + i), { storage, now: NOW })
        .ok,
      true,
    );
  const before = storage.getItem(DECK_ARCHIVE_KEY);
  const overCapacity = saveCompletedDeck(completedRun("atlas", 999), {
    storage,
    now: NOW,
  });
  assert.equal(overCapacity.error, "archive-full");
  assert.equal(storage.getItem(DECK_ARCHIVE_KEY), before);
  const repeat = saveCompletedDeck(completedRun("atlas", 100), {
    storage,
    now: NOW,
  });
  assert.equal(repeat.ok, true);
  assert.equal(repeat.duplicate, true);
  const removedId = repeat.deck.id;
  assert.equal(
    deleteSavedDeck(removedId, { storage }).archive.decks.length,
    MAX_SAVED_DECKS - 1,
  );
  assert.equal(deleteSavedDeck(removedId, { storage }).error, "deck-not-found");
  assert.equal(
    saveCompletedDeck(completedRun("atlas", 999), { storage, now: NOW }).ok,
    true,
  );
});

test("a failed delete keeps the previous archive visible and persisted", () => {
  const storage = memoryStorage();
  const saved = saveCompletedDeck(completedRun(), { storage, now: NOW });
  const before = storage.getItem(DECK_ARCHIVE_KEY);
  storage.setItem = () => {
    throw new Error("read-only");
  };
  const deleted = deleteSavedDeck(saved.deck.id, { storage });
  assert.equal(deleted.ok, false);
  assert.equal(deleted.archive.decks.length, 1);
  assert.equal(storage.getItem(DECK_ARCHIVE_KEY), before);
});

test("names and metadata are canonicalized and every wrestler can reuse their own champion deck", () => {
  for (const actorId of Object.keys(WRESTLERS)) {
    const run = completedRun(actorId);
    const saved = saveCompletedDeck(run, {
      storage: memoryStorage(),
      name: "\n" + "덱".repeat(70),
      now: NOW,
    });
    assert.equal(saved.deck.name.length, 48);
    assert.ok(startRunFromSavedDeck(saved.deck, actorId, 72));
    const unnamed = saveCompletedDeck(run, {
      storage: memoryStorage(),
      name: "  ",
      now: NOW,
    });
    assert.equal(unnamed.deck.name, `${WRESTLERS[actorId].nameKo} 챔피언 덱`);
  }
});
