import test from "node:test";
import assert from "node:assert/strict";
import {
  newRun,
  playCard,
  getCardCost,
  getCardUpgradeOptions,
} from "../src/game.js";
import { createCardCue, createArenaImpact } from "../src/presentation.js";
import { sdCombatFrame } from "../src/sd-combat.js";
import {
  techniqueEffectProfile,
  techniqueEffectLayers,
} from "../src/technique-effects.js";

const utilityIds = [
  "headlock",
  "armbar",
  "kimura",
  "americana",
  "anklelock",
  "heelhook",
  "collartie",
  "waistlock",
];
const resultOf = (cue, kind) =>
  cue.results.find((entry) => entry.kind === kind);

function encounter(ids, wrestler = "raven") {
  const state = newRun(wrestler, 428);
  state.activeGimmick = null;
  state.hand = ids.map((id, index) => ({
    uid: `hand-${index}`,
    id,
    upgraded: false,
  }));
  state.draw = ["strike", "guard", "powerbomb"].map((id, index) => ({
    uid: `draw-${index}`,
    id,
    upgraded: false,
  }));
  state.deck = structuredClone([...state.hand, ...state.draw]);
  state.discard = [];
  state.exhaust = [];
  state.energy = 5;
  state.enemy.hp = state.enemy.maxHp = 500;
  state.enemy.block = 12;
  return state;
}

function cast(before, index = 0) {
  const instance = before.hand[index];
  const after = playCard(before, instance.uid);
  assert.notEqual(after, before, `${instance.id} must resolve`);
  return { after, cue: createCardCue(before, after, instance) };
}

test("a free tie-up grants a discount and a following powerbomb reports no invented energy refund", () => {
  const before = encounter(["collartie", "powerbomb"]);
  const setup = cast(before);
  assert.equal(resultOf(setup.cue, "discount").value, 1);
  assert.match(
    resultOf(setup.cue, "discount").text,
    /이번 턴 다음 1코스트 이상 카드 비용 −1/,
  );
  assert.equal(resultOf(setup.cue, "energy"), undefined);
  assert.equal(getCardCost(setup.after, setup.after.hand[0]), 1);
  const followup = cast(setup.after);
  assert.equal(followup.after.energy, before.energy - 1);
  assert.equal(followup.after.status.nextCardDiscount, 0);
  assert.equal(resultOf(followup.cue, "energy"), undefined);
  assert.equal(resultOf(followup.cue, "discount"), undefined);
  assert.ok(resultOf(followup.cue, "damage").value > 0);
});

test("free cards retain the strongest offer while a paid utility displays its renewed discount", () => {
  for (const pending of [1, 3]) {
    const before = encounter(["heelhook", "kimura"]);
    before.status.nextCardDiscount = pending;
    const free = cast(before);
    assert.equal(free.after.status.nextCardDiscount, pending);
    assert.equal(resultOf(free.cue, "discount"), undefined);
    const renewed = cast(free.after);
    assert.equal(renewed.after.energy, before.energy);
    assert.equal(renewed.after.status.nextCardDiscount, 1);
    assert.equal(resultOf(renewed.cue, "discount").value, 1);
    assert.equal(resultOf(renewed.cue, "energy"), undefined);
  }
});

test("discounted energy utilities show only actual action points restored, including the cap", () => {
  for (const [energy, expectedGain] of [
    [5, 2],
    [9, 1],
    [10, 0],
  ]) {
    const before = encounter(["waistlock"]);
    before.energy = energy;
    before.status.nextCardDiscount = 1;
    const resolved = cast(before);
    assert.equal(resolved.after.energy, Math.min(10, energy + 2));
    assert.equal(resultOf(resolved.cue, "energy")?.value || 0, expectedGain);
    if (expectedGain)
      assert.match(resultOf(resolved.cue, "energy").text, /행동력/);
    assert.equal(resultOf(resolved.cue, "discount"), undefined);
  }
});

test("a stronger free utility reports the replacement discount, not its incremental increase", () => {
  const before = encounter(["heelhook", "powerbomb"]);
  const upgrade = getCardUpgradeOptions(before.hand[0]).find(
    (option) => option.effects.nextCardDiscount === 2,
  );
  assert.ok(upgrade);
  before.hand[0] = {
    ...before.hand[0],
    upgraded: true,
    upgradePath: upgrade.id,
  };
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.status.nextCardDiscount = 1;
  const { after, cue } = cast(before);
  assert.equal(after.status.nextCardDiscount, 2);
  assert.equal(resultOf(cue, "discount").value, 2);
  assert.match(resultOf(cue, "discount").text, /비용 −2/);
  assert.equal(resultOf(cue, "energy"), undefined);
  assert.equal(getCardCost(after, after.hand[0]), 0);
});

test("discounts do not inflate Seraph's aerial refund or invent one at the energy cap", () => {
  for (const [energy, expectedGain] of [
    [5, 1],
    [10, 0],
  ]) {
    const before = encounter(["dropkick"], "seraph");
    before.energy = energy;
    before.status.nextCardDiscount = 1;
    const resolved = cast(before);
    assert.equal(resultOf(resolved.cue, "energy")?.value || 0, expectedGain);
    assert.equal(resolved.after.energy, energy + expectedGain);
  }
});

test("utility draw reports actual drawn cards while enemy health and block stay untouched", () => {
  const before = encounter(["armbar"]);
  const { after, cue } = cast(before);
  assert.equal(resultOf(cue, "draw").value, 2);
  assert.equal(cue.effect.draw, true);
  assert.equal(after.enemy.hp, before.enemy.hp);
  assert.equal(after.enemy.block, before.enemy.block);
  assert.equal(cue.damage, 0);
  assert.equal(cue.absorbed, 0);
  assert.equal(resultOf(cue, "damage"), undefined);
  assert.equal(resultOf(cue, "blocked"), undefined);
  assert.equal(
    createArenaImpact(before, after, { instance: before.hand[0] }),
    null,
  );
});

test("every utility keeps its technique art with quiet setup feedback, no SD hurt pose or impact", () => {
  for (const id of utilityIds) {
    const before = encounter([id]);
    const originalState = structuredClone(before);
    const originalEffect = techniqueEffectProfile(id);
    const { cue } = cast(before);
    assert.equal(cue.utility, true, id);
    assert.equal(cue.attacking, false, id);
    assert.equal(cue.art, `cards/${id}.webp`, id);
    assert.equal(cue.effect.family, "tactics", id);
    assert.deepEqual(cue.effect.target, originalEffect.target, id);
    assert.deepEqual(cue.camera.impacts, [], id);
    assert.equal(cue.camera.hitstop, 0, id);
    assert.equal(cue.damage, 0, id);
    assert.equal(cue.absorbed, 0, id);
    assert.doesNotMatch(cue.announcement, /피해|공격 방어됨/, id);
    const layers = techniqueEffectLayers(cue.effect, cue.camera, cue);
    assert.ok(layers.length > 0, `${id} retains visible setup feedback`);
    assert.ok(
      layers.every((layer) =>
        ["breath", "rising-motes", "card-echo"].includes(layer.kind),
      ),
      id,
    );
    for (const progress of [0.15, 0.35, 0.55, 0.75, 0.9]) {
      const frame = sdCombatFrame(cue, progress);
      assert.equal(frame.enemy.pose, "idle", `${id} at ${progress}`);
      assert.equal(frame.enemy.x, 1.55, id);
      assert.equal(frame.enemy.rz, 0, id);
      assert.equal(frame.contact.visible, false, id);
      assert.equal(frame.contact.strength, 0, id);
    }
    assert.deepEqual(techniqueEffectProfile(id), originalEffect, id);
    assert.deepEqual(before, originalState, id);
  }
});
