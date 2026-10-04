import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CARDS, WRESTLERS, newRun, getCard, playCard } from "../src/game.js";
import { CARD_DETAILS } from "../src/card-library.js";
import {
  FIGHTER_STATES,
  selectFighterState,
  fighterPoseArt,
  createCardCue,
} from "../src/presentation.js";

// Only the piles and encounter are arranged. Effects are resolved by playCard.
function combatWith(ids, wrestler = "raven", drawIds = ["guard", "strike"]) {
  const state = newRun(wrestler, 12345);
  const instances = (list, prefix) =>
    list.map((id, index) => ({
      uid: `${prefix}-${index}`,
      id,
      upgraded: false,
    }));
  state.hand = instances(ids, "hand");
  state.draw = instances(drawIds, "draw");
  state.deck = structuredClone([...state.hand, ...state.draw]);
  state.discard = [];
  state.exhaust = [];
  state.enemy.hp = state.enemy.maxHp = 500;
  return state;
}

function cast(before, uid = before.hand[0].uid) {
  const instance = before.hand.find((card) => card.uid === uid);
  const after = playCard(before, uid);
  assert.notEqual(after, before, instance?.id);
  return { after, cue: createCardCue(before, after, instance) };
}

const resultOf = (cue, kind) =>
  cue.results.find((result) => result.kind === kind);

test("fighter conditions include exact 25% and 50% health boundaries for every wrestler", () => {
  for (const id of Object.keys(WRESTLERS)) {
    const { player } = newRun(id);
    for (const [ratio, expected] of [
      [0, "groggy"],
      [0.25, "groggy"],
      [0.2501, "tired"],
      [0.5, "tired"],
      [0.5001, "normal"],
      [1, "normal"],
    ]) {
      assert.equal(
        selectFighterState({ ...player, hp: player.maxHp * ratio }).id,
        expected,
        `${id} at ${ratio * 100}%`,
      );
    }
  }
});

test("health takes priority over pressure, and pressure takes priority over hype", () => {
  const { player } = newRun();
  for (const [hype, expected] of [
    [2, "normal"],
    [3, "excited"],
    [5, "excited"],
    [6, "fiery"],
    [9, "fiery"],
  ]) {
    assert.equal(
      selectFighterState({ ...player, hype, stress: 59 }).id,
      expected,
    );
  }
  assert.equal(
    selectFighterState({ ...player, hype: 9, stress: 60 }).id,
    "frustrated",
  );
  assert.equal(
    selectFighterState({
      ...player,
      hp: player.maxHp / 2,
      hype: 9,
      stress: 100,
    }).id,
    "tired",
  );
  assert.equal(
    selectFighterState({
      ...player,
      hp: player.maxHp / 4,
      hype: 9,
      stress: 100,
    }).id,
    "groggy",
  );
  assert.equal(selectFighterState({ ...player, weak: 2 }).id, "normal");
  assert.equal(
    selectFighterState({ ...player, weak: 1 }, { enemy: true }).id,
    "normal",
  );
  assert.equal(
    selectFighterState({ ...player, weak: 2 }, { enemy: true }).id,
    "frustrated",
  );
});

test("conditions return naturally after real healing, calming and finisher heat spending", () => {
  for (const [healthRatio, beforeCondition, afterCondition] of [
    [0.25, "groggy", "tired"],
    [0.5, "tired", "normal"],
  ]) {
    const before = combatWith(["championship"]);
    before.player.hp = before.player.maxHp * healthRatio;
    before.player.hype = 3;
    assert.equal(selectFighterState(before.player).id, beforeCondition);
    const { after, cue } = cast(before);
    assert.equal(
      after.player.hp - before.player.hp,
      getCard("championship").effects.heal,
    );
    assert.equal(after.player.hype, 0);
    assert.equal(selectFighterState(after.player).id, afterCondition);
    assert.equal(resultOf(cue, "hype").value, -3);
  }
  const fiery = combatWith(["finisher"]);
  fiery.player.hype = 6;
  assert.equal(selectFighterState(fiery.player).id, "fiery");
  const spent = cast(fiery).after;
  assert.equal(spent.player.hype, 3);
  assert.equal(selectFighterState(spent.player).id, "excited");

  const pressured = combatWith(["steelwill"]);
  pressured.player.stress = 60;
  assert.equal(selectFighterState(pressured.player).id, "frustrated");
  const calmed = cast(pressured).after;
  assert.equal(calmed.player.stress, 48);
  assert.equal(selectFighterState(calmed.player).id, "normal");
});

test("every card cue uses its unique technique artwork and actual engine outcome", () => {
  assert.equal(Object.keys(CARDS).length, 25);
  const artPaths = new Set();
  for (const id of Object.keys(CARDS)) {
    const before = combatWith([id]);
    before.energy = 10;
    before.player.hype = 9;
    before.player.hp -= 9;
    before.player.stress = 20;
    const original = structuredClone(before);
    const definition = getCard(before.hand[0]);
    const { after, cue } = cast(before);
    assert.equal(cue.cardId, id);
    assert.equal(cue.name, definition.name);
    assert.equal(cue.art, `cards/${id}.webp`);
    assert.equal(cue.art, CARD_DETAILS[id].art);
    assert.equal(cue.disciplineSlug, CARD_DETAILS[id].disciplineSlug);
    assert.equal(cue.finisher, definition.type === "finisher");
    assert.equal(cue.attacking, !!definition.effects.damage);
    assert.equal(cue.damage, before.enemy.hp - after.enemy.hp);
    assert.equal(cue.absorbed, before.enemy.block - after.enemy.block);
    assert.ok(
      cue.duration > 0 && cue.announcement.includes(definition.name),
      id,
    );
    artPaths.add(cue.art);
    assert.deepEqual(
      before,
      original,
      `${id} presentation must not mutate engine state`,
    );
  }
  assert.equal(artPaths.size, 25);
});

test("invalid public card actions do not create presentation cues", () => {
  const cases = [
    [combatWith(["strike"]), "missing"],
    [Object.assign(combatWith(["strike"]), { energy: 0 }), "hand-0"],
    [combatWith(["finisher"]), "hand-0"],
    [Object.assign(combatWith(["strike"]), { phase: "reward" }), "hand-0"],
  ];
  for (const [before, uid] of cases) {
    const after = playCard(before, uid);
    assert.equal(after, before);
    assert.equal(createCardCue(before, after, before.hand[0]), null);
  }
});

test("fully guarded and partially guarded attacks distinguish health damage from block consumption", () => {
  for (const [block, damage, absorbed] of [
    [20, 0, 8],
    [5, 3, 5],
  ]) {
    const before = combatWith(["strike"]);
    before.enemy.block = block;
    const { after, cue } = cast(before);
    // Raven's first attack adds 2 to Elbow Strike's 6.
    assert.equal(after.enemy.hp, 500 - damage);
    assert.equal(after.enemy.block, block - absorbed);
    assert.equal(cue.damage, damage);
    assert.equal(cue.absorbed, absorbed);
    assert.equal(resultOf(cue, "damage").value, damage);
    assert.equal(resultOf(cue, "blocked").value, absorbed);
    if (damage === 0) assert.equal(resultOf(cue, "damage").text, "공격 방어됨");
  }
});

test("multi-hit cues aggregate real damage and combo heat after block", () => {
  const before = combatWith(["doubletap"]);
  before.enemy.block = 9;
  const { after, cue } = cast(before);
  // Both hits receive Raven's first-card bonus: 7 + 7, of which 9 is blocked.
  assert.equal(after.enemy.hp, 495);
  assert.equal(after.enemy.block, 0);
  assert.equal(after.combo, 2);
  assert.equal(after.player.hype, 1);
  assert.equal(cue.damage, 5);
  assert.equal(cue.absorbed, 9);
  assert.equal(resultOf(cue, "hype").value, 1);
});

test("healing and calm cues show actual capped amounts rather than card definitions", () => {
  const hurt = combatWith(["championship"]);
  hurt.player.hp -= 2;
  hurt.player.hype = 3;
  const healed = cast(hurt);
  assert.equal(healed.after.player.hp, hurt.player.maxHp);
  assert.equal(resultOf(healed.cue, "heal").value, 2);
  assert.equal(resultOf(healed.cue, "hype").value, -3);
  assert.ok(resultOf(healed.cue, "exhaust"));

  const anxious = combatWith(["focus"]);
  anxious.player.stress = 3;
  const calmed = cast(anxious);
  assert.equal(calmed.after.player.stress, 0);
  assert.equal(resultOf(calmed.cue, "calm").value, 3);
  assert.equal(resultOf(calmed.cue, "draw").value, 1);
});

test("draw and pressure cues include Nova's passive and on-draw nightmare effects", () => {
  const before = combatWith(["flashstep"], "nova", ["nightmare", "strike"]);
  before.player.stress = 10;
  const { after, cue } = cast(before);
  assert.equal(getCard("flashstep").effects.draw, 1);
  assert.equal(after.hand.length, 2);
  assert.equal(after.player.stress, 13);
  assert.equal(after.enemy.hp, 496);
  assert.equal(resultOf(cue, "draw").value, 2);
  assert.equal(resultOf(cue, "pressure").value, 3);
  assert.ok(resultOf(cue, "exhaust"));

  const redline = combatWith(["redline"]);
  const pressured = cast(redline);
  assert.equal(pressured.after.player.stress, 3);
  assert.equal(resultOf(pressured.cue, "pressure").value, 3);
  assert.equal(resultOf(pressured.cue, "draw").value, 1);
});

test("energy cues respect the engine cap, and winning overkill reports only actual health loss", () => {
  const ready = combatWith(["quickdraw"]);
  assert.equal(resultOf(cast(ready).cue, "energy").value, 1);
  const capped = combatWith(["quickdraw"]);
  capped.energy = 10;
  assert.equal(cast(capped).after.energy, 10);
  assert.equal(resultOf(cast(capped).cue, "energy"), undefined);

  const before = combatWith(["redline"]);
  before.enemy.hp = 1;
  before.player.stress = 10;
  const { after, cue } = cast(before);
  assert.equal(after.phase, "reward");
  assert.equal(after.enemy.hp, 0);
  assert.equal(cue.damage, 1);
  assert.equal(resultOf(cue, "damage").value, 1);
  // Victory skips Redline's draw and calms by 5 after its pressure gain of 3.
  assert.equal(after.player.stress, 8);
  assert.equal(resultOf(cue, "calm").value, 2);
  assert.equal(resultOf(cue, "draw"), undefined);
});

test("pressure breakdown cues report actual self damage and the reset pressure without a false calm cue", () => {
  for (const [hp, remainingHp, actualDamage, phase] of [
    [20, 12, 8, "combat"],
    [3, 0, 3, "defeat"],
  ]) {
    const before = combatWith(["redline"]);
    before.player.hp = hp;
    before.player.stress = 99;
    // The earlier nightmare thresholds have already been crossed in this fixture.
    before.nextNightmareAt = 110;
    const { after, cue } = cast(before);
    assert.equal(getCard("redline").effects.stress, 3);
    assert.equal(after.phase, phase);
    assert.equal(after.player.hp, remainingHp);
    assert.equal(after.player.stress, 65);
    assert.equal(resultOf(cue, "self-damage").value, actualDamage);
    assert.equal(
      resultOf(cue, "self-damage").text,
      `멘탈 붕괴 · 체력 −${actualDamage}`,
    );
    assert.equal(resultOf(cue, "calm"), undefined);
    const pressureResults = cue.results.filter(
      (result) => result.kind === "pressure",
    );
    assert.deepEqual(pressureResults, [
      { kind: "pressure", value: 65, text: "붕괴 후 압박 65" },
    ]);
    assert.ok(cue.announcement.includes("붕괴 후 압박 65"));
    // Redline still hits the opponent before its own pressure triggers the breakdown.
    assert.equal(cue.damage, 11);
    if (phase === "defeat") assert.equal(resultOf(cue, "draw"), undefined);
  }
});

test("all five fighters have six distinct complete state illustrations", () => {
  const paths = new Set();
  const hashes = new Set();
  assert.equal(Object.keys(WRESTLERS).length, 5);
  assert.deepEqual(Object.keys(FIGHTER_STATES).sort(), [
    "excited",
    "fiery",
    "frustrated",
    "groggy",
    "normal",
    "tired",
  ]);
  for (const id of Object.keys(WRESTLERS)) {
    assert.equal(fighterPoseArt(id), `fighters/states/${id}-normal.webp`);
    for (const state of Object.values(FIGHTER_STATES)) {
      const path = fighterPoseArt(id, state);
      assert.equal(path, `fighters/states/${id}-${state.id}.webp`);
      assert.equal(fighterPoseArt(id, state.id), path);
      const bytes = readFileSync(
        new URL(`../public/assets/${path}`, import.meta.url),
      );
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF", path);
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP", path);
      assert.ok(bytes.length > 1000, path);
      paths.add(path);
      hashes.add(createHash("sha256").update(bytes).digest("hex"));
    }
  }
  assert.equal(paths.size, 30);
  assert.equal(
    hashes.size,
    30,
    "each condition must have its own completed illustration, not an alias",
  );
  assert.equal(
    fighterPoseArt("unknown", "normal"),
    "fighters/states/nova-normal.webp",
  );
  assert.equal(
    fighterPoseArt("raven", "unknown"),
    "fighters/states/raven-normal.webp",
  );
  assert.equal(
    fighterPoseArt("unknown", { id: "groggy" }),
    "fighters/states/nova-groggy.webp",
  );
  assert.equal(
    fighterPoseArt("raven", null),
    "fighters/states/raven-normal.webp",
  );
});
