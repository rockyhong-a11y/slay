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
  techniqueShot,
} from "../src/presentation.js";

// Only the piles and encounter are arranged. Effects are resolved by playCard.
function combatWith(ids, wrestler = "raven", drawIds = ["guard", "strike"]) {
  const state = newRun(wrestler, 12345);
  state.activeGimmick = null;
  state.player.block = 0;
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
  assert.equal(Object.keys(CARDS).length, 50);
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
  assert.equal(artPaths.size, 50);
});

test("all 50 technique cameras are finite, serializable and leave time to read the full scene", () => {
  for (const [id, definition] of Object.entries(CARDS)) {
    const shot = techniqueShot(
      id,
      CARD_DETAILS[id].disciplineSlug,
      definition.type === "finisher",
    );
    assert.ok(shot.duration >= 2000 && shot.duration <= 3300, id);
    if (definition.type === "finisher") assert.ok(shot.duration >= 3100, id);
    assert.equal(shot.times[0], 0, id);
    assert.equal(shot.times.at(-1), 1, id);
    for (let index = 1; index < shot.times.length; index++)
      assert.ok(shot.times[index] > shot.times[index - 1], id);
    for (const channel of ["x", "y", "scale", "rotate"]) {
      assert.equal(shot[channel].length, shot.times.length, `${id} ${channel}`);
      assert.ok(shot[channel].every(Number.isFinite), `${id} ${channel}`);
    }
    assert.ok(
      shot.scale.every((scale) => scale >= 0.8 && scale <= 1.25),
      id,
    );
    assert.ok(
      shot.impacts.every((time) => time > 0 && time < 1),
      id,
    );
    assert.equal(shot.phases.length, 3, id);
    assert.match(shot.origin, /^\d+% \d+%$/, id);
    assert.ok(shot.portrait.field >= 0.6 && shot.portrait.field <= 0.9, id);
    assert.equal(shot.portrait.center.length, 2, id);
    assert.ok(
      shot.portrait.center.every((value) => value > 0 && value < 1),
      id,
    );
    assert.deepEqual(JSON.parse(JSON.stringify(shot)), shot, id);
  }
});

test("portrait fields enlarge close holds while retaining more of wide landing actions", () => {
  const headlock = techniqueShot("headlock", "submission");
  const slam = techniqueShot("sidewalkslam", "throw");
  const suplex = techniqueShot("suplex", "throw");
  const armbar = techniqueShot("armbar", "submission");
  assert.equal(headlock.portrait.field, 0.6);
  assert.deepEqual(headlock.portrait.center, [0.51, 0.36]);
  assert.ok(slam.portrait.field >= 0.8 && suplex.portrait.field >= 0.8);
  assert.deepEqual(slam.portrait.center, [0.44, 0.4]);
  assert.ok(armbar.portrait.field > slam.portrait.field);
  const portraitHeight = (viewportWidth, shot) =>
    (viewportWidth - 28) / (1.5 * shot.portrait.field);
  assert.ok(portraitHeight(393, headlock) >= 400);
  assert.ok(portraitHeight(320, headlock) >= 320);
  headlock.portrait.center[0] = 0;
  assert.deepEqual(
    techniqueShot("headlock", "submission").portrait.center,
    [0.51, 0.36],
    "a consumer cannot change the next cue's focal point",
  );
});

test("powerbomb cameras lift, hold visibly, then drive down before the landing impact", () => {
  for (const id of [
    "powerbomb",
    "sitoutpowerbomb",
    "jackknifepowerbomb",
    "popuppowerbomb",
    "gutwrenchpowerbomb",
    "foldingpowerbomb",
  ]) {
    const shot = techniqueShot(id, "throw");
    assert.equal(shot.kind, "powerbomb", id);
    assert.ok(shot.y[0] > shot.y[1] && shot.y[1] > shot.y[2], id);
    assert.equal(shot.y[2], shot.y[3], `${id} holds the lift`);
    assert.ok(
      (shot.times[3] - shot.times[2]) * shot.duration >= 300,
      `${id} lift pause remains visible`,
    );
    assert.ok(shot.y[4] > 0 && shot.y[4] > shot.y[3], id);
    assert.equal(shot.impacts[0], shot.times[4], id);
    assert.equal(shot.heavy, true, id);
    assert.deepEqual(shot.phases, ["LIFT", "DRIVE", "MAT IMPACT"], id);
  }
});

test("throws follow an arc, slams fall to the mat, and locks use pressure close-ups", () => {
  const thrown = techniqueShot("bellysuplex", "throw");
  assert.equal(thrown.kind, "throw");
  assert.ok(thrown.y[0] > 0 && thrown.y[3] < 0 && thrown.y[4] > 0);
  assert.notEqual(thrown.x[0], thrown.x[4]);
  const slammed = techniqueShot("spinebuster", "throw");
  assert.equal(slammed.kind, "slam");
  assert.ok(slammed.y[2] < 0 && slammed.y[4] > 0);
  assert.notDeepEqual(thrown.y, slammed.y);
  const locked = techniqueShot("crossface", "submission");
  assert.equal(locked.kind, "hold");
  assert.equal(locked.pressure, true);
  assert.ok(locked.scale.at(-1) > locked.scale[0] + 0.2);
  assert.ok(Math.max(...locked.y) - Math.min(...locked.y) < 10);
  assert.equal(locked.origin, "52% 48%");
  assert.notEqual(
    locked.origin,
    techniqueShot("heelhook", "submission").origin,
    "upper-body and leg locks focus on different regions",
  );
  assert.equal(techniqueShot("armdrag", "grapple").kind, "throw");
  assert.equal(techniqueShot("collartie", "grapple").kind, "clinch");
  assert.equal(techniqueShot("waistlock", "grapple").kind, "clinch");
});

test("combo cameras have two impacts and tactical recovery does not invent a hit", () => {
  assert.deepEqual(techniqueShot("doubletap", "strike").impacts, [0.34, 0.59]);
  assert.deepEqual(techniqueShot("focus", "tactics").impacts, []);
  const before = combatWith(["sitoutpowerbomb"]);
  before.energy = 10;
  const { after, cue } = cast(before);
  assert.equal(cue.camera.kind, "powerbomb");
  assert.equal(cue.duration, cue.camera.duration);
  assert.equal(cue.damage, before.enemy.hp - after.enemy.hp);
  assert.equal(cue.announcement.includes(`피해 ${cue.damage}`), true);
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

test("Seraph replay results include the actual aerial energy refund once after paying the card cost", () => {
  const before = combatWith(["moonsault", "moonsault"], "seraph");
  before.energy = 3;
  const snapshot = structuredClone(before);
  const first = cast(before);
  assert.equal(first.after.energy, 2);
  assert.deepEqual(resultOf(first.cue, "energy"), {
    kind: "energy",
    value: 1,
    text: "행동력(에너지) +1",
  });
  assert.ok(first.cue.announcement.includes("행동력(에너지) +1"));
  assert.deepEqual(before, snapshot);
  const second = cast(first.after, "hand-1");
  assert.equal(second.after.energy, 0);
  assert.equal(resultOf(second.cue, "energy"), undefined);

  const atCap = combatWith(["dropkick"], "seraph");
  atCap.energy = 10;
  const refunded = cast(atCap);
  assert.equal(refunded.after.energy, 10);
  assert.equal(
    resultOf(refunded.cue, "energy").value,
    1,
    "the refund restores a spent point even when the net energy delta is zero",
  );
});

test("Onyx replay results report new counter setup after consuming any previous attack bonus", () => {
  for (const oldBonus of [0, 3, 6, 9]) {
    const before = combatWith(["crossface", "crossface"], "onyx");
    before.enemy.intent = { type: "attack", value: 12 };
    before.status.nextAttack = oldBonus;
    const snapshot = structuredClone(before);
    const first = cast(before);
    assert.equal(first.after.status.nextAttack, 3);
    assert.equal(
      first.cue.damage,
      getCard("crossface").effects.damage + oldBonus,
    );
    assert.deepEqual(resultOf(first.cue, "setup"), {
      kind: "setup",
      value: 3,
      text: "다음 공격 +3",
    });
    assert.ok(first.cue.announcement.includes("다음 공격 +3"));
    assert.deepEqual(before, snapshot);
    const second = cast(first.after, "hand-1");
    assert.equal(second.after.status.nextAttack, 0);
    assert.equal(
      resultOf(second.cue, "setup"),
      undefined,
      "the consumed previous bonus is not a newly granted setup",
    );
  }
});

test("setup cues distinguish retained bonuses, printed additions and counters against nonattack intents", () => {
  const defending = combatWith(["guard"], "onyx");
  defending.status.nextAttack = 6;
  const retained = cast(defending);
  assert.equal(retained.after.status.nextAttack, 6);
  assert.equal(resultOf(retained.cue, "setup"), undefined);

  const ready = combatWith(["ringcraft"], "onyx");
  ready.status.nextAttack = 6;
  const prepared = cast(ready);
  assert.equal(prepared.after.status.nextAttack, 10);
  assert.equal(
    resultOf(prepared.cue, "setup").value,
    4,
    "only the actual new amount is announced, not the accumulated total",
  );

  const wrongIntent = combatWith(["crossface"], "onyx");
  wrongIntent.enemy.intent = { type: "guard", value: 7 };
  wrongIntent.status.nextAttack = 6;
  const consumed = cast(wrongIntent);
  assert.equal(consumed.after.status.nextAttack, 0);
  assert.equal(resultOf(consumed.cue, "setup"), undefined);
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

test("all ten fighters have six distinct complete state illustrations", () => {
  const paths = new Set();
  const hashes = new Set();
  assert.equal(Object.keys(WRESTLERS).length, 10);
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
  const stateCount =
    Object.keys(WRESTLERS).length * Object.keys(FIGHTER_STATES).length;
  assert.equal(paths.size, stateCount);
  assert.equal(
    hashes.size,
    stateCount,
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
