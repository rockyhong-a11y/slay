import test from "node:test";
import assert from "node:assert/strict";
import { getCard } from "../src/game.js";
import { createJourneyQA } from "../src/journey-qa.js";
import {
  canArchiveRun,
  saveCompletedDeck,
  loadDeckArchive,
  startRunFromSavedDeck,
} from "../src/deck-archive.js";

const memory = () => {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
};
test("all three upgrade branches survive champion archive, JSON reload and a fresh three-wave run", () => {
  const victory = createJourneyQA("victory");
  const storage = memory();
  victory.deck = [
    ...["force", "control", "flow"].map((upgradePath, i) => ({
      uid: `old-${i}`,
      id: "powerbomb",
      upgraded: true,
      upgradePath,
    })),
    { uid: "old-3", id: "strike", upgraded: true },
    { uid: "old-4", id: "guard", upgraded: false },
    { uid: "old-5", id: "powerbomb", upgraded: true, upgradePath: "flow" },
  ];
  const saved = saveCompletedDeck(victory, { storage });
  assert.equal(saved.ok, true);
  const loaded = loadDeckArchive(storage).archive.decks[0];
  const replay = startRunFromSavedDeck(loaded, "raven", 613);
  assert.equal(replay.wave, 1);
  assert.equal(replay.waveCount, 3);
  assert.equal(replay.floor, 1);
  assert.equal(replay.stats.enemiesDefeated, 0);
  assert.deepEqual(
    replay.deck.map(({ uid, ...card }) => card),
    loaded.cards,
  );
  assert.deepEqual(
    replay.deck.slice(0, 3).map((card) => getCard(card).effects),
    victory.deck.slice(0, 3).map((card) => getCard(card).effects),
  );
  assert.equal(
    new Set(replay.deck.slice(0, 3).map((card) => getCard(card).upgradeLabel))
      .size,
    3,
  );
  assert.equal(
    replay.deck.filter((card) => card.upgradePath === "flow").length,
    2,
  );
  assert.ok(replay.deck.every((card) => !card.uid.startsWith("old-")));
});
test("intermediate crowns and corrupt branch metadata cannot become final champion decks", () => {
  const victory = createJourneyQA("victory");
  for (const wave of [1, 2])
    assert.equal(canArchiveRun({ ...victory, wave }), false);
  assert.equal(canArchiveRun({ ...victory, phase: "wave-clear" }), false);
  for (const bad of [
    { id: "powerbomb", upgraded: true, upgradePath: "made-up" },
    { id: "powerbomb", upgraded: false, upgradePath: "flow" },
  ]) {
    const run = { ...victory, deck: [bad, ...victory.deck.slice(1)] };
    assert.equal(saveCompletedDeck(run, { storage: memory() }).ok, false);
  }
});
