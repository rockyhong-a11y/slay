import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/game.js";
import { createJourneyQA } from "../src/journey-qa.js";

// These focused fixtures isolate transition boundaries; end-to-end policies in
// game/run-mechanics and journey QA exercise the complete public-action route.
function atBoss(wave) {
  const state = g.newRun("raven", 20261006);
  state.wave = wave;
  state.phase = "map";
  state.floor = 7;
  state.route.currentNodeId = "f7-0";
  state.waveCombatWins = 4;
  return g.advanceToNode(state, "f8-0");
}
function winBoss(current) {
  const state = structuredClone(current);
  state.enemy.hp = 1;
  state.enemy.block = 0;
  state.hand = [{ uid: "last-hit", id: "strike", upgraded: false }];
  state.energy = 3;
  return g.playCard(state, "last-hit");
}

test("three waves have increasing boss stats and distinct action patterns and route previews", () => {
  assert.equal(g.WAVES.length, 3);
  const bosses = [1, 2, 3].map(atBoss);
  assert.equal(new Set(bosses.map((state) => state.enemy.name)).size, 3);
  assert.equal(
    new Set(bosses.map((state) => state.enemy.pattern.join())).size,
    3,
  );
  assert.deepEqual(
    bosses.map((state) => state.enemy.intent.type),
    ["guard", "taunt", "attack"],
  );
  for (let index = 0; index < bosses.length; index++) {
    const state = bosses[index];
    const info = g.getWaveInfo(state);
    assert.equal(info.wave, index + 1);
    assert.equal(info.totalStages, 24);
    assert.equal(info.stage, (index + 1) * 8);
    assert.equal(info.bossName, state.enemy.name);
    const node = g
      .getRouteView(state)
      .nodes.find((entry) => entry.type === "boss");
    assert.ok(node.description.includes(state.enemy.name));
    assert.equal(node.reward.coins, info.coins);
    if (index) {
      assert.ok(state.enemy.maxHp > bosses[index - 1].enemy.maxHp);
      assert.ok(state.enemy.attack > bosses[index - 1].enemy.attack);
    }
  }
});

test("every wave retains a minimum four-match route with preparation branches", () => {
  for (const wave of [1, 2, 3]) {
    const state = g.newRun();
    state.wave = wave;
    const route = g.getRouteView(state);
    const totals = [];
    function walk(id, fights) {
      const node = route.nodes.find((entry) => entry.id === id);
      if (node.type === "boss") return totals.push(fights);
      for (const edge of route.edges.filter((entry) => entry.from === id))
        walk(
          edge.to,
          fights + Number(["fight", "elite", "risk"].includes(node.type)),
        );
    }
    walk("f1-0", 0);
    assert.equal(Math.min(...totals), 4);
    assert.equal(Math.max(...totals), 7);
    assert.equal(route.completedCombats, 0);
  }
});

test("boss clears award each wave once; only the third clear completes the arena", () => {
  for (const wave of [1, 2, 3]) {
    const before = atBoss(wave);
    const cleared = winBoss(before);
    assert.equal(cleared.phase, wave === 3 ? "victory" : "wave-clear");
    assert.equal(
      cleared.player.coins - before.player.coins,
      g.WAVES[wave - 1].coins,
    );
    assert.equal(cleared.waveClears.at(-1).wave, wave);
    assert.equal(g.getRouteView(cleared).completedCombats, 4);
    assert.equal(g.getRunProgress(cleared), Math.round((wave / 3) * 100));
    assert.equal(g.playCard(cleared, "last-hit"), cleared);
    assert.equal(g.endTurn(cleared), cleared);
    if (wave === 3) assert.equal(g.continueToNextWave(cleared), cleared);
  }
});

test("wave continuation preserves the built deck, money, inventory and removal costs while resetting only the new circuit", () => {
  const clear = winBoss(atBoss(1));
  clear.player.hp = 10;
  clear.player.stress = 44;
  clear.deck[0] = {
    ...clear.deck[0],
    id: "armbar",
    upgraded: true,
    upgradePath: "control",
  };
  clear.deckRemoval = { shopPurchases: 2, usedNodeIds: ["1:f2-4", "f2-4"] };
  clear.gimmicks = [{ uid: "kept-gimmick", id: "mindcorner" }];
  clear.equippedGimmickUid = null;
  const snapshot = structuredClone(clear);
  const next = g.continueToNextWave(clear);
  assert.deepEqual(clear, snapshot, "the completed wave is immutable");
  assert.equal(next.wave, 2);
  assert.equal(next.floor, 1);
  assert.equal(next.phase, "combat");
  assert.equal(next.waveCombatWins, 0);
  assert.equal(next.player.hp, 10 + Math.ceil(next.player.maxHp * 0.35));
  assert.equal(next.player.stress, 19);
  assert.equal(next.player.coins, clear.player.coins);
  assert.deepEqual(next.deck, clear.deck);
  assert.deepEqual(next.inventory, clear.inventory);
  assert.deepEqual(next.gimmicks, clear.gimmicks);
  assert.deepEqual(next.deckRemoval, clear.deckRemoval);
  assert.deepEqual(next.route.visited, ["f1-0"]);
  assert.deepEqual(next.waveClears, clear.waveClears);
  assert.equal(next.history.at(-1).wave, 2);
  assert.equal(g.getRunProgress(next), 33);
  assert.equal(
    g.continueToNextWave(next),
    next,
    "double invocation cannot repeat recovery",
  );
  next.phase = "shop";
  next.route.currentNodeId = "f2-4";
  next.player.coins = 1000;
  const offer = g.getCardRemovalOffer(next);
  assert.equal(
    offer.available,
    true,
    "same local shop ID in a new wave is a new service",
  );
  assert.equal(offer.cost, 100);
  const removed = g.removeDeckCard(next, next.deck[0].uid);
  assert.equal(g.getCardRemovalOffer(removed).available, false);
  assert.ok(removed.deckRemoval.usedNodeIds.includes("2:f2-4"));
});

test("wave continuation rejects combat, incomplete/dead bosses, player defeat and terminal victory", () => {
  assert.equal(g.continueToNextWave(g.newRun()).wave, 1);
  const clear = winBoss(atBoss(1));
  for (const invalid of [
    { ...clear, phase: "combat" },
    { ...clear, phase: "victory" },
    { ...clear, player: { ...clear.player, hp: 0 } },
    { ...clear, enemy: { ...clear.enemy, hp: 1 } },
    { ...clear, enemy: { ...clear.enemy, type: "fight" } },
    { ...clear, wave: 3 },
  ])
    assert.equal(g.continueToNextWave(invalid), invalid);
});

test("legacy active saves resume wave one without rerolling and legacy winners remain terminal", () => {
  for (const phase of ["combat", "victory"]) {
    const legacy = phase === "combat" ? atBoss(1) : winBoss(atBoss(3));
    delete legacy.wave;
    delete legacy.waveCount;
    delete legacy.waveClears;
    delete legacy.waveCombatWins;
    const normalized = g.normalizeRun(legacy);
    assert.equal(normalized.wave, phase === "victory" ? 3 : 1);
    assert.equal(normalized.phase, phase);
    for (const key of ["enemy", "deck", "hand", "draw", "seed", "player"])
      assert.deepEqual(normalized[key], legacy[key], key);
    assert.deepEqual(g.normalizeRun(normalized), normalized);
  }
});

test("serialized intermission continues deterministically and the public-action fixture clears all three real bosses", () => {
  const intermission = createJourneyQA("wave-clear");
  assert.equal(intermission.wave, 1);
  assert.deepEqual(
    g.continueToNextWave(JSON.parse(JSON.stringify(intermission))),
    g.continueToNextWave(intermission),
  );
  const victory = createJourneyQA("victory");
  assert.equal(victory.wave, 3);
  assert.equal(victory.phase, "victory");
  assert.equal(victory.history.length, 24);
  assert.equal(victory.waveClears.length, 3);
  assert.equal(victory.stats.enemiesDefeated, 15);
  assert.ok(victory.waveClears.every((wave) => wave.combats >= 4));
  assert.equal(g.getRunProgress(victory), 100);
});

test("a cleared wave can stage one finite corner gimmick for the next opening match", () => {
  const clear = winBoss(atBoss(1));
  clear.gimmicks = [{ uid: "next-wave-corner", id: "ironcorner" }];
  const equipped = g.equipGimmick(clear, "next-wave-corner");
  assert.equal(clear.equippedGimmickUid, null);
  assert.equal(equipped.equippedGimmickUid, "next-wave-corner");
  const next = g.continueToNextWave(equipped);
  assert.equal(next.activeGimmick.id, "ironcorner");
  assert.equal(next.equippedGimmickUid, null);
  assert.equal(next.gimmicks.length, 0);
  assert.ok(next.player.block >= 7);
  assert.equal(next.hand.length, 4);
});
