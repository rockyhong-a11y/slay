import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CARDS,
  newRun,
  canPlayCard,
  playCard,
  endTurn,
  continueToNextWave,
} from "../src/game.js";
import { createCardCue, createArenaImpact } from "../src/presentation.js";
import {
  ARENAS,
  getArenaEnvironment,
  crowdReaction,
  reactionForTechnique,
  reactionForOpponent,
} from "../src/arena-environments.js";
import { createJourneyQA, JOURNEY_QA_PROFILES } from "../src/journey-qa.js";

function combatWith(id) {
  const state = newRun("raven", 12345);
  state.activeGimmick = null;
  state.energy = 10;
  state.player.block = 0;
  state.player.hype = 6;
  state.player.stress = 20;
  state.hand = [{ uid: "crowd-card", id, upgraded: false }];
  state.deck = structuredClone(state.hand);
  state.draw = [{ uid: "next-card", id: "guard", upgraded: false }];
  state.discard = [];
  state.exhaust = [];
  state.enemy.hp = state.enemy.maxHp = 500;
  return state;
}

function cast(state) {
  const entry = state.hand[0];
  assert.ok(canPlayCard(state, entry));
  const after = playCard(state, entry.uid);
  assert.notEqual(after, state);
  const cue = createCardCue(state, after, entry);
  return { after, cue, reaction: reactionForTechnique(cue) };
}

test("four real arena images cover the run and do not change during card use or turns", () => {
  const encountered = new Set();
  const bosses = new Set();
  for (let wave = 1; wave <= 3; wave++) {
    for (let floor = 1; floor <= 8; floor++) {
      const before = combatWith("strike");
      before.wave = wave;
      before.floor = floor;
      const environment = getArenaEnvironment(before);
      encountered.add(environment.id);
      if (floor === 8) bosses.add(environment.id);
      const { after } = cast(before);
      assert.equal(getArenaEnvironment(after).id, environment.id);
      assert.equal(getArenaEnvironment(endTurn(after)).id, environment.id);
      assert.equal(
        getArenaEnvironment(JSON.parse(JSON.stringify(after))).id,
        environment.id,
      );
    }
  }
  assert.equal(encountered.size, 4);
  assert.equal(bosses.size, 3, "each boss has a different venue");
  for (const arena of Object.values(ARENAS)) {
    const buffer = readFileSync(
      new URL(`../public/assets/${arena.art}`, import.meta.url),
    );
    assert.equal(buffer.toString("ascii", 0, 4), "RIFF", arena.id);
    assert.equal(buffer.toString("ascii", 8, 12), "WEBP", arena.id);
    assert.ok(
      buffer.length > 100_000,
      `${arena.id} is an actual detailed raster`,
    );
  }
});

test("real strikes, throws, submissions, finishers and support actions produce distinct crowd responses", () => {
  for (const [id, expected] of [
    ["strike", "cheer"],
    ["powerbomb", "cheer"],
    ["armbar", "submission"],
    ["headlock", "submission"],
    ["finisher", "eruption"],
    ["guard", "applause"],
    ["spotlight", "cheer"],
    ["nightmare", "boo"],
  ]) {
    assert.equal(cast(combatWith(id)).reaction.kind, expected, id);
  }
});

test("a fully blocked technique gets a gasp and an actual knockout gets a standing ovation", () => {
  for (const id of ["strike", "armbar", "finisher"]) {
    const blocked = combatWith(id);
    blocked.enemy.block = 1000;
    const result = cast(blocked);
    assert.equal(result.cue.damage, 0);
    assert.equal(result.reaction.kind, "gasp", id);
  }
  const lethal = combatWith("strike");
  lethal.enemy.hp = 1;
  const result = cast(lethal);
  assert.equal(result.after.phase, "reward");
  assert.equal(result.cue.knockout, true);
  assert.equal(result.reaction.kind, "eruption");
});

test("all 50 resolved techniques have bounded readable crowd feedback without mutating combat or cue", () => {
  for (const id of Object.keys(CARDS)) {
    const before = combatWith(id);
    const original = structuredClone(before);
    const { after, cue } = cast(before);
    const savedAfter = structuredClone(after);
    const savedCue = structuredClone(cue);
    const reaction = reactionForTechnique(cue);
    assert.ok(reaction.label && reaction.chant, id);
    assert.ok(reaction.duration >= 1000 && reaction.duration <= 3000, id);
    assert.ok(reaction.intensity > 0 && reaction.intensity <= 1, id);
    assert.deepEqual(before, original, id);
    assert.deepEqual(after, savedAfter, id);
    assert.deepEqual(cue, savedCue, id);
  }
  assert.equal(reactionForTechnique(null), null);
  assert.equal(crowdReaction("not-a-reaction"), null);
  const reaction = crowdReaction("cheer");
  reaction.label = "changed by consumer";
  assert.notEqual(crowdReaction("cheer").label, reaction.label);
});

test("opponent damage, player guards, taunts and a player knockout use actual resolved outcomes", () => {
  for (const [setup, expected] of [
    [
      (state) => {
        state.enemy.intent = { type: "attack", value: 8 };
      },
      "boo",
    ],
    [
      (state) => {
        state.enemy.intent = { type: "attack", value: 8 };
        state.player.block = 20;
      },
      "cheer",
    ],
    [
      (state) => {
        state.enemy.intent = { type: "taunt", value: 12 };
      },
      "boo",
    ],
    [
      (state) => {
        state.enemy.intent = { type: "attack", value: 8 };
        state.player.hp = 1;
      },
      "gasp",
    ],
    [
      (state) => {
        state.enemy.intent = { type: "guard", value: 8 };
      },
      null,
    ],
  ]) {
    const before = combatWith("guard");
    setup(before);
    const after = endTurn(before);
    const impact = createArenaImpact(before, after, { attacker: "enemy" });
    assert.equal(
      reactionForOpponent(before, after, impact)?.kind ?? null,
      expected,
    );
    assert.equal(reactionForOpponent(before, before, impact), null);
  }
});

test("the DEV boss fixture stops before a legal first-wave knockout and can continue after it", () => {
  assert.ok(JOURNEY_QA_PROFILES.includes("wave-boss"));
  const before = createJourneyQA("wave-boss");
  assert.equal(before.phase, "combat");
  assert.equal(before.wave, 1);
  assert.equal(before.floor, 8);
  assert.ok(before.waveCombatWins >= 4);
  assert.ok(before.enemy.hp > 0);
  assert.ok(before.deck.some((entry) => entry.upgraded));
  assert.deepEqual(
    before,
    createJourneyQA("wave-boss"),
    "fixture is reproducible",
  );
  const card = before.hand.find(
    (entry) =>
      canPlayCard(before, entry) &&
      playCard(before, entry.uid).phase === "wave-clear",
  );
  assert.ok(card, "an actual playable card ends the first boss fight");
  const after = playCard(before, card.uid);
  const cue = createCardCue(before, after, card);
  assert.equal(cue.knockout, true);
  assert.equal(reactionForTechnique(cue).kind, "eruption");
  assert.equal(after.phase, "wave-clear");
  const next = continueToNextWave(after);
  assert.equal(next.phase, "combat");
  assert.equal(next.wave, 2);
  assert.equal(next.floor, 1);
  assert.deepEqual(next.deck, after.deck);
});

test("a taunt that triggers mental collapse still gets boos after pressure resets downward", () => {
  const before = combatWith("guard");
  before.player.stress = 95;
  before.enemy.intent = { type: "taunt", value: 15 };
  const after = endTurn(before);
  assert.ok(after.player.stress < before.player.stress);
  assert.ok(after.player.hp < before.player.hp);
  const impact = createArenaImpact(before, after, { attacker: "enemy" });
  assert.equal(impact, null, "mental collapse is not a physical opponent hit");
  assert.equal(reactionForOpponent(before, after, impact).kind, "boo");
});
