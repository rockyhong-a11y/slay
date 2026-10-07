import test from "node:test";
import assert from "node:assert/strict";
import { initializeGearWear, trackGearWear } from "../src/gear-progression.js";
import { newRun, normalizeRun, playCard, endTurn } from "../src/game.js";

function combat() {
  const state = newRun("raven", 20903);
  state.player = { ...state.player, hp: 100, maxHp: 100, hype: 0, stress: 0 };
  state.enemy = { ...state.enemy, hp: 100, maxHp: 100, weak: 0 };
  return state;
}

function changeFighter(state, actor, values) {
  return trackGearWear(state, {
    ...state,
    [actor]: { ...state[actor], ...values },
  });
}

function withoutWear(state) {
  const copy = structuredClone(state);
  for (const actor of ["player", "enemy"])
    if (copy[actor]) delete copy[actor].gearWearLevel;
  return copy;
}

test("initialization upgrades legacy saves without changing combat data", () => {
  const raw = combat();
  raw.player.hp = 40;
  raw.enemy.hp = 20;
  const before = structuredClone(raw);
  const state = initializeGearWear(raw);
  assert.equal(state.player.gearWearLevel, 3);
  assert.equal(state.enemy.gearWearLevel, 4);
  assert.deepEqual(withoutWear(state), before);
  assert.deepEqual(raw, before);
  assert.equal(initializeGearWear(state), state);
});

test("fiery, frustrated, tired, and groggy set increasing per-fighter battle peaks", () => {
  let state = initializeGearWear(combat());
  assert.equal(state.player.gearWearLevel, 0);
  for (const [values, expected] of [
    [{ hype: 6 }, 1],
    [{ hype: 0 }, 1],
    [{ stress: 60 }, 2],
    [{ stress: 0 }, 2],
    [{ hp: 50 }, 3],
    [{ hp: 100 }, 3],
    [{ hp: 25 }, 4],
    [{ hp: 100 }, 4],
  ]) {
    state = changeFighter(state, "player", values);
    assert.equal(state.player.gearWearLevel, expected);
    assert.equal(state.enemy.gearWearLevel, 0);
  }
});

test("enemy weakness selects frustrated gear damage without affecting player gear", () => {
  let state = initializeGearWear(combat());
  state = changeFighter(state, "player", { weak: 2 });
  state = changeFighter(state, "enemy", { weak: 2 });
  assert.equal(state.player.gearWearLevel, 0);
  assert.equal(state.enemy.gearWearLevel, 2);
  state = changeFighter(state, "enemy", { weak: 0 });
  assert.equal(state.enemy.gearWearLevel, 2);
});

test("reward, map, and rest preserve the previous battle peak after recovery", () => {
  let state = initializeGearWear(combat());
  state = changeFighter(state, "player", { hp: 20 });
  state = trackGearWear(state, {
    ...state,
    phase: "reward",
    player: { ...state.player, hp: 100 },
    enemy: { ...state.enemy, hp: 0 },
  });
  assert.equal(state.player.gearWearLevel, 4);
  assert.equal(state.enemy.gearWearLevel, 4);
  state = trackGearWear(state, { ...state, phase: "map" });
  assert.equal(state.player.gearWearLevel, 4);
  state = trackGearWear(state, { ...state, phase: "rest", enemy: null });
  assert.equal(state.player.gearWearLevel, 4);
  assert.equal(state.enemy, null);
});

test("entering another battle resets wear even when the enemy identity repeats", () => {
  let state = initializeGearWear(combat());
  state = changeFighter(state, "player", { hp: 20 });
  state = changeFighter(state, "enemy", { hp: 20 });
  const map = trackGearWear(state, { ...state, phase: "map" });
  const next = trackGearWear(map, {
    ...map,
    phase: "combat",
    player: { ...map.player, hp: 100 },
    enemy: { ...map.enemy, hp: 100 },
  });
  assert.equal(next.enemy.id, state.enemy.id);
  assert.equal(next.player.gearWearLevel, 0);
  assert.equal(next.enemy.gearWearLevel, 0);
});

test("battle reset starts from current condition, including unrecovered low HP", () => {
  let state = initializeGearWear(combat());
  state = changeFighter(state, "player", { hp: 20 });
  const map = { ...state, phase: "map" };
  const next = trackGearWear(map, {
    ...state,
    player: { ...state.player, hp: 40 },
  });
  assert.equal(next.player.gearWearLevel, 3);
  assert.equal(next.player.hp, 40);
});

test("wave, floor, or route changes mark a new encounter even without an intermediate snapshot", () => {
  let state = initializeGearWear(combat());
  state = changeFighter(state, "player", { hp: 20 });
  for (const boundary of [
    { wave: state.wave + 1 },
    { floor: state.floor + 1 },
    { route: { ...state.route, currentNodeId: "f2-1" } },
  ]) {
    const next = trackGearWear(state, {
      ...state,
      ...boundary,
      player: { ...state.player, hp: 100 },
    });
    assert.equal(next.player.gearWearLevel, 0);
  }
});

test("a same-character same-seed new game clears an opening battle's peak", () => {
  const seed = 20903;
  let state = initializeGearWear(newRun("raven", seed));
  state = changeFighter(state, "player", { hype: 6 });
  const fresh = newRun("raven", seed);
  assert.equal(fresh.seed, state.seed);
  assert.equal(fresh.turn, state.turn);
  assert.equal(fresh.enemy.id, state.enemy.id);
  const next = trackGearWear(state, fresh);
  assert.equal(next.player.gearWearLevel, 0);
  assert.equal(next.enemy.gearWearLevel, 0);
  assert.deepEqual(withoutWear(next), fresh);
});

test("saving and reloading preserves peak wear after HP and pressure recover", () => {
  let state = initializeGearWear(combat());
  state = changeFighter(state, "player", { hp: 20 });
  state = changeFighter(state, "enemy", { weak: 2 });
  state = changeFighter(state, "player", { hp: 100 });
  state = changeFighter(state, "enemy", { weak: 0 });
  const restored = initializeGearWear(
    normalizeRun(JSON.parse(JSON.stringify(state))),
  );
  assert.equal(restored.player.gearWearLevel, 4);
  assert.equal(restored.enemy.gearWearLevel, 2);
  assert.equal(restored.player.hp, 100);
  assert.equal(restored.enemy.weak, 0);
});

test("tracking card and turn actions leaves every gameplay field unchanged", () => {
  const raw = combat();
  raw.hand = [{ id: "strike", uid: "wear-strike", upgraded: false }];
  let state = initializeGearWear(raw);
  const previous = state;
  const before = structuredClone(state);
  const result = playCard(state, "wear-strike");
  const resultBefore = structuredClone(result);
  state = trackGearWear(state, result);
  assert.deepEqual(withoutWear(state), playCard(raw, "wear-strike"));
  assert.deepEqual(result, resultBefore);
  assert.deepEqual(previous, before);
  const ended = trackGearWear(state, endTurn(state));
  assert.deepEqual(withoutWear(ended), endTurn(withoutWear(state)));
  assert.equal(trackGearWear(ended, ended), ended);
});

test("missing state and enemy are harmless", () => {
  assert.equal(initializeGearWear(null), null);
  assert.equal(trackGearWear(null, undefined), undefined);
  const state = { ...combat(), phase: "rest", enemy: null };
  const initialized = initializeGearWear(state);
  assert.equal(initialized.enemy, null);
  assert.equal(initialized.player.gearWearLevel, 0);
});
