import test from "node:test";
import assert from "node:assert/strict";
import {
  WRESTLERS,
  newRun,
  normalizeRun,
  getCardDamage,
  playCard,
  endTurn,
  chooseReward,
  advanceToNode,
  useItem,
} from "../src/game.js";

const copy = (state) => JSON.parse(JSON.stringify(state));
const triggers = [
  ["atlas", "sitoutpowerbomb", "powerUsed"],
  ["seraph", "dropkick", "aerialUsed"],
  ["lynx", "armbar", "jointUsed"],
  ["tempest", "grapple", "chainUsed"],
  ["onyx", "reversal", "counterUsed"],
];
const flags = triggers.map(([, , flag]) => flag);
function combat(actor, cards) {
  const state = newRun(actor, 31007);
  state.hand = cards.map((card, i) => ({
    uid: `fixture-${i}`,
    id: typeof card === "string" ? card : card.id,
    upgraded: typeof card === "object" && !!card.upgraded,
  }));
  state.deck = copy(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.energy = 10;
  state.enemy.hp = state.enemy.maxHp = 500;
  state.enemy.intent = { type: "attack", value: 12 };
  state.activeGimmick = null;
  state.player.block = 0;
  return state;
}

test("exactly five newcomers complement the five existing adult wrestlers with eleven-card decks", () => {
  assert.deepEqual(
    Object.values(WRESTLERS)
      .filter((actor) => actor.newcomer)
      .map((actor) => actor.id),
    triggers.map(([id]) => id),
  );
  for (const [id] of triggers) {
    const actor = WRESTLERS[id];
    assert.ok(actor.age >= 18);
    assert.ok(actor.maxHp >= 72 && actor.maxHp <= 86);
    assert.equal(actor.startingDeck.length, 11);
    assert.equal(newRun(id).player.id, id);
    assert.equal(newRun(id).player.maxHp, actor.maxHp);
  }
});

test("Atlas adds damage and guard to only the first costly grapple, with exact base and upgraded previews", () => {
  for (const upgraded of [false, true]) {
    let state = combat("atlas", [
      "bodyslam",
      { id: "sitoutpowerbomb", upgraded },
      { id: "sitoutpowerbomb", upgraded },
    ]);
    state = playCard(state, "fixture-0");
    assert.equal(
      state.status.powerUsed,
      false,
      "a one-cost slam does not consume the bonus",
    );
    const before = state.enemy.hp;
    const snapshot = copy(state);
    const preview = getCardDamage(state, state.hand[0]);
    assert.equal(preview, upgraded ? 26 : 21);
    assert.deepEqual(
      state,
      snapshot,
      "preview never consumes the first-power flag",
    );
    state = playCard(state, "fixture-1");
    assert.equal(before - state.enemy.hp, preview);
    assert.equal(state.player.block, upgraded ? 12 : 10);
    assert.equal(state.status.powerUsed, true);
    assert.equal(getCardDamage(state, state.hand[0]), upgraded ? 22 : 17);
    state = playCard(state, "fixture-2");
    assert.equal(state.player.block, upgraded ? 19 : 15);
    assert.equal(
      state.logEvents.filter((event) => event.type === "passive").length,
      1,
    );
  }
});

test("Seraph refunds energy and draws only once across Dropkick and Moonsault without creating a recursive refill", () => {
  let state = combat("seraph", ["strike", "dropkick", "moonsault"]);
  state.energy = 4;
  state.draw = [{ uid: "drawn", id: "guard", upgraded: false }];
  state = playCard(state, "fixture-0");
  assert.equal(state.status.aerialUsed, false);
  assert.equal(state.energy, 3);
  state = playCard(state, "fixture-1");
  assert.equal(state.energy, 3);
  assert.equal(state.status.aerialUsed, true);
  assert.deepEqual(
    state.hand.map((card) => card.uid),
    ["fixture-2", "drawn"],
  );
  state = playCard(state, "fixture-2");
  assert.equal(state.energy, 1);
  assert.equal(
    state.hand.length,
    1,
    "second aerial move does not reshuffle for a second passive draw",
  );
  assert.equal(
    state.logEvents.filter((event) => event.type === "passive").length,
    1,
  );
});

test("Seraph's extra draw stops on a lethal nightmare without reviving or refilling again", () => {
  let state = combat("seraph", ["dropkick"]);
  state.player.hp = 1;
  state.player.stress = 99;
  state.energy = 1;
  state.draw = [
    { uid: "after-defeat", id: "guard", upgraded: false },
    { uid: "lethal-draw", id: "nightmare", upgraded: false },
  ];
  state = playCard(state, "fixture-0");
  assert.equal(state.phase, "defeat");
  assert.equal(state.player.hp, 0);
  assert.equal(state.energy, 1);
  assert.equal(state.draw.length, 1);
  assert.equal(state.status.aerialUsed, true);
  assert.equal(
    state.logEvents.filter((event) => event.type === "passive").length,
    1,
  );
});

test("Lynx rewards real joint locks once while preserving their printed debuffs and guard", () => {
  let state = combat("lynx", ["headlock", "americana", "armbar", "kimura"]);
  state.player.stress = 12;
  state = playCard(state, "fixture-0");
  assert.equal(
    state.status.jointUsed,
    false,
    "a head hold is not a joint lock",
  );
  state = playCard(state, "fixture-1");
  assert.equal(state.player.block, 8);
  assert.equal(state.player.stress, 9);
  assert.equal(state.status.jointUsed, true);
  state = playCard(state, "fixture-2");
  assert.equal(state.enemy.vulnerable, 2);
  assert.equal(state.player.block, 8);
  state = playCard(state, "fixture-3");
  assert.equal(state.player.stress, 9);
  assert.equal(state.enemy.vulnerable, 3);
  assert.equal(
    state.logEvents.filter((event) => event.type === "passive").length,
    1,
  );
});

test("Tempest requires a preceding attack and adds both chain damage and heat only once", () => {
  let state = combat("tempest", ["grapple", "popuppowerbomb", "bodyslam"]);
  assert.equal(getCardDamage(state, state.hand[0]), 4);
  state = playCard(state, "fixture-0");
  assert.equal(state.status.chainUsed, false);
  assert.equal(state.combo, 1);
  assert.equal(state.player.hype, 0);
  assert.equal(getCardDamage(state, state.hand[0]), 26);
  state = playCard(state, "fixture-1");
  assert.equal(state.enemy.hp, 470);
  assert.equal(state.status.chainUsed, true);
  assert.equal(
    state.player.hype,
    3,
    "one printed heat, one combo heat, and one passive heat",
  );
  assert.equal(getCardDamage(state, state.hand[0]), 8);
  state = playCard(state, "fixture-2");
  assert.equal(state.player.hype, 3);
  assert.equal(
    state.logEvents.filter((event) => event.type === "passive").length,
    1,
  );
});

test("Onyx reads actual enemy intent and strengthens the following attack rather than the counter's own hit", () => {
  let state = combat("onyx", ["reversal", "crossface", "strike", "reversal"]);
  state.enemy.intent = { type: "guard", value: 8 };
  state = playCard(state, "fixture-0");
  assert.equal(state.status.counterUsed, false);
  assert.equal(state.player.block, 6);
  assert.equal(state.status.nextAttack, 0);
  state.enemy.intent = { type: "attack", value: 12 };
  assert.equal(getCardDamage(state, state.hand[0]), 6);
  state = playCard(state, "fixture-1");
  assert.equal(
    state.player.block,
    19,
    "existing6 + crossface4 + counter5 + passive4",
  );
  assert.equal(state.status.nextAttack, 3);
  assert.equal(state.status.counterUsed, true);
  assert.equal(getCardDamage(state, state.hand[0]), 9);
  state = playCard(state, "fixture-2");
  assert.equal(state.status.nextAttack, 0);
  state = playCard(state, "fixture-3");
  assert.equal(state.player.block, 30);
  assert.equal(state.status.nextAttack, 0);
  assert.equal(
    state.logEvents.filter((event) => event.type === "passive").length,
    1,
  );
});

test("new passive limits survive JSON and invalid actions, and reset only at a turn or new encounter", () => {
  for (const [actor, trigger, flag] of triggers) {
    let state = combat(actor, [trigger, trigger]);
    state.draw = [{ uid: "passive-draw", id: "guard", upgraded: false }];
    if (actor === "tempest") state.combo = 1;
    state.energy = 0;
    const unavailable = copy(state);
    assert.equal(playCard(state, "fixture-0"), state);
    assert.deepEqual(state, unavailable);
    state.energy = 10;
    assert.equal(playCard(state, "missing"), state);
    state = playCard(state, "fixture-0");
    assert.equal(state.status[flag], true, actor);
    const restored = copy(state);
    assert.deepEqual(
      playCard(restored, "fixture-1"),
      playCard(state, "fixture-1"),
      `${actor} save future`,
    );
    assert.equal(
      playCard(restored, "fixture-0"),
      restored,
      "an already-played UID cannot trigger twice",
    );
    const nextTurn = endTurn(restored);
    assert.equal(nextTurn.status[flag], false, `${actor} next turn`);
    state.enemy.hp = 1;
    state.energy = 1;
    state.hand = [{ uid: "winning", id: "strike", upgraded: false }];
    state = advanceToNode(
      chooseReward(playCard(state, "winning"), null),
      "f2-0",
    );
    assert.equal(state.phase, "combat");
    for (const freshFlag of flags)
      assert.equal(state.status[freshFlag], false, `${actor}/${freshFlag}`);
  }
});

test("support cards and items produce no fake hits or specialist bonuses, even when damage is fully blocked", () => {
  for (const [actor, , flag] of triggers) {
    let state = combat(actor, ["guard", "collartie", "focus", "nightmare"]);
    state.player.stress = 20;
    state.enemy.block = 999;
    if (actor === "tempest") state.combo = 2;
    for (const uid of ["fixture-0", "fixture-1", "fixture-2", "fixture-3"]) {
      assert.equal(
        getCardDamage(
          state,
          state.hand.find((card) => card.uid === uid),
        ),
        0,
      );
      state = playCard(state, uid);
      assert.equal(state.status[flag], false, actor);
      assert.equal(state.lastImpact.damage, 0);
      assert.equal(state.lastImpact.hits, 0);
      assert.equal(state.enemy.hp, 500);
    }
    state = useItem(state, state.inventory[0].uid);
    assert.equal(state.status[flag], false, `${actor} item`);
    assert.equal(state.lastImpact.hits, 0);
    assert.equal(
      state.logEvents.filter((event) => event.type === "passive").length,
      0,
    );
  }
});

test("fully blocked specialist attacks are genuine single attacks without fake health damage or repeated bonuses", () => {
  for (const [actor, trigger, flag] of triggers) {
    let state = combat(actor, [trigger, trigger]);
    state.enemy.block = 999;
    if (actor === "tempest") state.combo = 1;
    state = playCard(state, "fixture-0");
    assert.equal(state.enemy.hp, 500);
    assert.equal(state.lastImpact.damage, 0);
    assert.equal(state.lastImpact.hits, 1);
    assert.ok(state.lastImpact.blocked > 0);
    assert.equal(state.status[flag], true);
    state = playCard(state, "fixture-1");
    assert.equal(
      state.logEvents.filter((event) => event.type === "passive").length,
      1,
    );
  }
});

test("normalization preserves old v1 combat exactly and missing newcomer flags are acquired once", () => {
  for (const actor of ["raven", "valkyrie", "nova", "viper", "ember"]) {
    const old = newRun(actor, 424242);
    for (const flag of flags) delete old.status[flag];
    assert.deepEqual(normalizeRun(old), old, `${actor} prior save`);
  }
  for (const [actor, trigger, flag] of triggers) {
    const legacy = combat(actor, [trigger, trigger]);
    if (actor === "tempest") legacy.combo = 1;
    for (const absent of flags) delete legacy.status[absent];
    const first = playCard(copy(legacy), "fixture-0");
    assert.equal(first.status[flag], true);
    const second = playCard(copy(first), "fixture-1");
    assert.equal(
      second.logEvents.filter((event) => event.type === "passive").length,
      1,
    );
  }
});
