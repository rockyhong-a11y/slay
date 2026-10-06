import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  newRun,
  normalizeRun,
  continueToNextWave,
  playCard,
  endTurn,
  ITEMS,
  GIMMICKS,
  useItem,
} from "../src/game.js";
import { createJourneyQA } from "../src/journey-qa.js";
import {
  BELT_COLLECTION_KEY,
  CHAMPIONSHIP_BELTS,
  getEarnedBelts,
  getLatestBeltAward,
  collectRunBelts,
  loadBeltCollection,
} from "../src/championship-belts.js";

function memoryStorage() {
  const values = new Map();
  return {
    values,
    writes: 0,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      this.writes++;
      values.set(key, value);
    },
  };
}

test("all three real wave bosses award their own cosmetic championship once", () => {
  const first = createJourneyQA("wave-clear");
  assert.deepEqual(
    first.championshipBelts.map((entry) => entry.id),
    ["rookie-champion"],
  );
  assert.equal(getLatestBeltAward(first).tier, "브론즈");
  assert.equal(playCard(first, first.hand[0]?.uid), first);
  assert.equal(endTurn(first), first);
  const next = continueToNextWave(first);
  assert.equal(getLatestBeltAward(next), null);
  assert.deepEqual(next.championshipBelts, first.championshipBelts);
  assert.equal(getEarnedBelts(newRun()).length, 0);
  const final = createJourneyQA("victory");
  assert.deepEqual(
    final.championshipBelts.map((entry) => entry.id),
    CHAMPIONSHIP_BELTS.map((belt) => belt.id),
  );
  assert.equal(getLatestBeltAward(final).id, "world-champion");
  assert.deepEqual(
    normalizeRun(JSON.parse(JSON.stringify(final))).championshipBelts,
    final.championshipBelts,
  );
});

test("old three-wave clear saves recover only the belts they earned without modifying gameplay", () => {
  const saved = createJourneyQA("victory");
  delete saved.championshipBelts;
  const normalized = normalizeRun(saved);
  assert.equal(normalized.championshipBelts.length, 3);
  for (const key of [
    "player",
    "enemy",
    "deck",
    "hand",
    "draw",
    "discard",
    "seed",
    "energy",
    "maxEnergy",
    "inventory",
    "gimmicks",
  ])
    assert.deepEqual(normalized[key], saved[key], key);
  assert.deepEqual(normalizeRun(normalized), normalized);
  const legacy = structuredClone(saved);
  delete legacy.wave;
  delete legacy.waveCount;
  delete legacy.waveClears;
  const single = normalizeRun(legacy);
  assert.deepEqual(
    single.championshipBelts.map((entry) => entry.id),
    ["world-champion"],
  );
  const active = newRun();
  delete active.championshipBelts;
  assert.deepEqual(normalizeRun(active).championshipBelts, []);
});

test("collection survives new runs and repeated clear effects never duplicate or rewrite titles", () => {
  const storage = memoryStorage();
  const first = createJourneyQA("wave-clear");
  const collected = collectRunBelts(first, {
    storage,
    now: "2026-10-06T00:00:00Z",
  });
  assert.equal(collected.ok, true);
  assert.equal(collected.newBelts.length, 1);
  assert.equal(storage.writes, 1);
  const repeated = collectRunBelts(normalizeRun(first), {
    storage,
    now: "2026-10-07T00:00:00Z",
  });
  assert.deepEqual(repeated.newBelts, []);
  assert.equal(storage.writes, 1);
  assert.equal(
    repeated.collection.belts[0].earnedAt,
    "2026-10-06T00:00:00.000Z",
  );
  assert.equal(
    collectRunBelts(newRun(), { storage }).collection.belts.length,
    1,
  );
  const all = collectRunBelts(createJourneyQA("victory"), { storage });
  assert.equal(all.newBelts.length, 2);
  assert.equal(all.collection.belts.length, 3);
  assert.deepEqual(loadBeltCollection(storage).collection, all.collection);
  assert.deepEqual([...storage.values.keys()], [BELT_COLLECTION_KEY]);
});

test("invalid collection entries recover safely and blocked storage does not claim persistence", () => {
  const storage = memoryStorage();
  storage.values.set(
    BELT_COLLECTION_KEY,
    JSON.stringify({
      version: 1,
      belts: [
        {
          id: "world-champion",
          wave: 1,
          boss: "IRON REGENT",
          actorId: "raven",
          earnedAt: "2026-10-06T00:00:00Z",
        },
        {
          id: "rookie-champion",
          wave: 1,
          boss: "EMPRESS",
          actorId: "raven",
          earnedAt: "2026-10-06T00:00:00Z",
        },
      ],
    }),
  );
  assert.deepEqual(loadBeltCollection(storage).collection.belts, []);
  assert.equal(loadBeltCollection(storage).recovered, true);
  const bad = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota");
    },
  };
  const failed = collectRunBelts(createJourneyQA("wave-clear"), {
    storage: bad,
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.error, "storage-write-failed");
  assert.equal(failed.collection.belts.length, 0);
  storage.values.set(
    BELT_COLLECTION_KEY,
    JSON.stringify({ version: 99, belts: [] }),
  );
  const future = collectRunBelts(createJourneyQA("wave-clear"), { storage });
  assert.equal(future.error, "unsupported-version");
  assert.equal(storage.writes, 0);
});

test("wrestling tools keep old inventory IDs and live shop offers compatible", () => {
  const state = newRun();
  state.inventory = [{ uid: "legacy-gel", id: "energygel" }];
  const used = useItem(state, "legacy-gel");
  assert.equal(used.inventory.length, 0);
  assert.equal(used.energy, state.energy + 2);
  assert.equal(used.player.stress, state.player.stress + 4);
  assert.equal(used.lastImpact.crowdReaction, "cheer");
  assert.equal(ITEMS.energygel.name, "링벨");
  assert.equal(ITEMS.resin.name, "폴딩 체어");
  assert.equal(GIMMICKS.grappleclinic.name, "브레이크어웨이 테이블");
  const savedShop = createJourneyQA("shop");
  savedShop.shopItems.push({
    id: "item-energygel",
    itemId: "energygel",
    kind: "item",
    name: "러시 에너지 젤",
    artKey: "items/energygel.webp",
    description: "old",
    cost: 7,
    sold: true,
  });
  const restored = normalizeRun(savedShop).shopItems.at(-1);
  assert.equal(restored.name, "링벨");
  assert.equal(restored.artKey, "equipment/ringbell.svg");
  assert.equal(restored.cost, 7, "existing offer prices are never rerolled");
  assert.equal(restored.sold, true);
});

test("every physical prop and championship trophy has its own self-contained scalable artwork", async () => {
  const definitions = [
    ...Object.values(ITEMS),
    ...Object.values(GIMMICKS),
    ...CHAMPIONSHIP_BELTS,
  ];
  assert.equal(new Set(definitions.map((entry) => entry.artKey)).size, 15);
  for (const entry of definitions) {
    const svg = await readFile(
      new URL(`../public/assets/${entry.artKey}`, import.meta.url),
      "utf8",
    );
    assert.match(svg, /<svg[^>]+viewBox=/);
    assert.match(svg, /<title>/);
    assert.doesNotMatch(svg, /<(script|foreignObject|image)\b|href="https?:/);
  }
});
