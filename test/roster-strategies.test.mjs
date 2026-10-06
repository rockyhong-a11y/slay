import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  WRESTLERS,
  newRun,
  getCard,
  getCardDamage,
  playCard,
  endTurn,
  chooseReward,
  advanceToNode,
} from "../src/game.js";
import { CARD_DETAILS, getLibraryCards } from "../src/card-library.js";

const saved = (state) => JSON.parse(JSON.stringify(state));
function combat(id, cards) {
  const state = newRun(id, 31007);
  state.hand = cards.map((card, index) => ({
    uid: `fixture-${index}`,
    id: typeof card === "string" ? card : card.id,
    upgraded: typeof card === "object" && !!card.upgraded,
  }));
  state.deck = saved(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.energy = 10;
  state.enemy.hp = state.enemy.maxHp = 500;
  state.activeGimmick = null;
  state.player.block = 0;
  return state;
}

test("ten selectable adults expose distinct strategies and their exact eleven-card starting decks", () => {
  assert.deepEqual(Object.keys(WRESTLERS), [
    "raven",
    "valkyrie",
    "nova",
    "viper",
    "ember",
    "atlas",
    "seraph",
    "lynx",
    "tempest",
    "onyx",
  ]);
  assert.equal(Object.keys(CARDS).length, 50);
  assert.equal(new Set(Object.values(WRESTLERS).map((w) => w.role)).size, 10);
  for (const [id, w] of Object.entries(WRESTLERS)) {
    assert.ok(w.age >= 18);
    assert.ok([1, 2, 3].includes(w.complexity));
    for (const key of [
      "role",
      "roleEn",
      "strategy",
      "complexityLabel",
      "easyLabel",
      "passive",
    ])
      assert.ok(
        typeof w[key] === "string" && w[key].length > 0,
        `${id}.${key}`,
      );
    for (const key of ["strengths", "playstyle", "recommendedCards"])
      assert.ok(Array.isArray(w[key]) && w[key].length >= 3, `${id}.${key}`);
    assert.ok(w.recommendedCards.every((card) => CARDS[card]));
    assert.equal(w.startingDeck.length, 11);
    assert.deepEqual(
      newRun(id).deck.map((card) => card.id),
      w.startingDeck,
    );
    assert.ok(w.startingDeck.includes(w.signature));
  }
  assert.deepEqual(
    WRESTLERS.viper.startingDeck.filter((id) => id === "headlock"),
    ["headlock", "headlock"],
  );
  assert.ok(WRESTLERS.ember.startingDeck.includes("rally"));
  assert.ok(WRESTLERS.ember.startingDeck.includes("comeback"));
});

test("Viper sets up vulnerability with a utility hold and rewards follow-up attacks", () => {
  let state = combat("viper", ["headlock", "strike", "headlock"]);
  assert.equal(getCardDamage(state, state.hand[0]), 0);
  state = playCard(state, "fixture-0");
  assert.equal(
    state.enemy.hp,
    500,
    "the opening utility hold controls without dealing damage",
  );
  assert.equal(state.enemy.weak, 2);
  assert.equal(state.enemy.vulnerable, 1);
  assert.equal(state.status.precisionUsed, true);
  assert.equal(getCardDamage(state, state.hand[0]), 12);
  state = playCard(state, "fixture-1");
  assert.equal(state.enemy.hp, 488);
  assert.equal(getCardDamage(state, state.hand[0]), 0);
  state = playCard(state, "fixture-2");
  assert.equal(state.enemy.hp, 488);
  assert.equal(state.enemy.weak, 4);
  assert.equal(
    state.enemy.vulnerable,
    1,
    "a second debuff cannot repeat the passive this turn",
  );
});

test("Viper uses actual upgraded effects and multi-hit preview agrees with resolved damage", () => {
  let state = combat("viper", [{ id: "suplex", upgraded: true }, "doubletap"]);
  assert.equal(getCard(state.hand[0]).effects.vulnerable, 2);
  assert.equal(getCardDamage(state, state.hand[0]), 21);
  state = playCard(state, "fixture-0");
  assert.equal(state.enemy.vulnerable, 3);
  state.status.nextAttack = 4;
  const before = state.enemy.hp;
  const preview = getCardDamage(state, state.hand[0]);
  assert.equal(preview, 32);
  state = playCard(state, "fixture-1");
  assert.equal(before - state.enemy.hp, preview);
  assert.equal(state.enemy.vulnerable, 3);
});

test("Viper's setup rearms on the next turn and on a genuinely new encounter", () => {
  let state = playCard(combat("viper", ["headlock"]), "fixture-0");
  state = endTurn(state);
  assert.equal(state.status.precisionUsed, false);
  assert.equal(state.enemy.weak, 1);
  assert.equal(state.enemy.vulnerable, 0);
  state = playCard(state, "fixture-0");
  assert.equal(state.status.precisionUsed, true);
  assert.equal(state.enemy.vulnerable, 1);
  state.enemy.hp = 1;
  state.hand = [{ uid: "finish", id: "strike", upgraded: false }];
  state.energy = 1;
  state = playCard(state, "finish");
  state = chooseReward(state, null);
  state = advanceToNode(state, 0);
  assert.equal(state.phase, "combat");
  assert.equal(state.status.precisionUsed, false);
  assert.equal(state.status.crowdUsed, false);
});

test("Ember's first skill supplies heat, calm and conditional healing exactly once per turn", () => {
  let state = combat("ember", ["guard", "guard", "focus", "rally"]);
  state.player.hp = 40;
  state.player.stress = 12;
  state = playCard(state, "fixture-0");
  assert.equal(state.player.hp, 42);
  assert.equal(state.player.stress, 9);
  assert.equal(state.player.hype, 1);
  assert.equal(state.player.block, 7);
  assert.equal(state.status.crowdUsed, true);
  state = playCard(state, "fixture-1");
  assert.equal(state.player.hp, 42);
  assert.equal(state.player.stress, 9);
  assert.equal(state.player.hype, 1);
  state = playCard(state, "fixture-2");
  assert.equal(
    state.player.stress,
    3,
    "focus still has its own normal card effect",
  );
  state = playCard(state, "fixture-3");
  assert.equal(
    state.player.hype,
    2,
    "rally gives its printed heat without a second passive",
  );
  assert.equal(state.player.stress, 0);
  assert.equal(
    state.logEvents.filter((e) => e.type === "passive").length,
    1,
    "passive calm/heal must not recursively trigger the passive",
  );
});

test("Ember does not heal above half health, exceed heat caps, or treat nightmares and finishers as skills", () => {
  let full = combat("ember", ["guard"]);
  full.player.hp = 41;
  full.player.hype = 9;
  full = playCard(full, "fixture-0");
  assert.equal(full.player.hp, 41);
  assert.equal(full.player.hype, 9);
  assert.equal(full.player.stress, 0);
  assert.equal(
    full.status.crowdUsed,
    true,
    "caps do not postpone a first-skill trigger",
  );

  let state = combat("ember", ["nightmare", "strike", "championship", "guard"]);
  state.player.hp = 30;
  state.player.hype = 3;
  state.player.stress = 20;
  for (const uid of ["fixture-0", "fixture-1", "fixture-2"])
    state = playCard(state, uid);
  assert.equal(state.status.crowdUsed, false);
  assert.equal(
    state.player.hp,
    36,
    "only championship's printed healing applied",
  );
  assert.equal(state.player.stress, 10);
  assert.equal(
    state.player.hype,
    1,
    "only the attack combo generated heat after the finisher",
  );
  state = playCard(state, "fixture-3");
  assert.equal(state.player.hp, 38);
  assert.equal(state.player.stress, 7);
  assert.equal(state.player.hype, 2);
});

test("Ember's comeback calculates low-health guard before the passive heals across the threshold", () => {
  let state = combat("ember", ["comeback"]);
  state.player.hp = 40;
  state = playCard(state, "fixture-0");
  assert.equal(state.player.block, 22);
  assert.equal(state.player.hp, 42);
  assert.equal(state.player.hype, 1);
  state = endTurn(state);
  assert.equal(state.status.crowdUsed, false);
});

test("new passive limits survive JSON restore and invalid actions neither consume nor repeat them", () => {
  for (const [id, trigger] of [
    ["viper", "headlock"],
    ["ember", "guard"],
  ]) {
    let state = combat(id, [trigger, trigger]);
    state.draw = Array.from({ length: 2 }, (_, index) => ({
      uid: `passive-reserve-${index}`,
      id: "guard",
      upgraded: false,
    }));
    state.player.hp = 30;
    state.player.stress = 15;
    const before = saved(state);
    assert.equal(playCard(state, "missing"), state);
    state.energy = 0;
    assert.equal(playCard(state, "fixture-0"), state);
    state.energy = before.energy;
    assert.deepEqual(state, before);
    state = playCard(state, "fixture-0");
    const restored = saved(state);
    assert.deepEqual(
      playCard(restored, "fixture-1"),
      playCard(state, "fixture-1"),
      id,
    );
    assert.deepEqual(endTurn(restored), endTurn(state), `${id} saved future`);
    assert.equal(
      playCard(restored, "fixture-0"),
      restored,
      "an already played UID is a no-op",
    );
  }
});

test("older v1 status objects without new flags remain playable and acquire limits once", () => {
  for (const [id, card, flag] of [
    ["viper", "headlock", "precisionUsed"],
    ["ember", "guard", "crowdUsed"],
  ]) {
    const old = combat(id, [card, card]);
    delete old.status.precisionUsed;
    delete old.status.crowdUsed;
    const first = playCard(saved(old), "fixture-0");
    assert.equal(first.status[flag], true);
    const second = playCard(saved(first), "fixture-1");
    assert.equal(
      second.logEvents.filter((e) => e.type === "passive").length,
      1,
    );
  }
});

test("nightmare draws can defeat Ember without passive recursion or post-defeat resurrection", () => {
  let state = combat("ember", ["encore"]);
  state.player.hp = 1;
  state.player.stress = 99;
  state.draw = [0, 1, 2].map((n) => ({
    uid: `nightmare-${n}`,
    id: "nightmare",
    upgraded: false,
  }));
  state = playCard(state, "fixture-0");
  assert.equal(state.phase, "defeat");
  assert.equal(state.player.hp, 0);
  assert.equal(state.draw.length, 1, "drawing stops as soon as the run ends");
  assert.equal(state.logEvents.filter((e) => e.type === "passive").length, 1);
});

test("encyclopedia starting owners are derived from all ten actual decks", () => {
  for (const [id, detail] of Object.entries(CARD_DETAILS)) {
    const actual = Object.values(WRESTLERS)
      .filter((w) => w.startingDeck.includes(id))
      .map((w) => w.id);
    assert.deepEqual(detail.startingWrestlers, actual, id);
    for (const owner of actual)
      assert.ok(
        getLibraryCards({ search: owner }).some((card) => card.id === id),
        `${owner}/${id}`,
      );
  }
  assert.match(CARD_DETAILS.headlock.acquisition, /바이퍼/);
  assert.match(CARD_DETAILS.headlock.acquisition, /프로 숍/);
  assert.match(CARD_DETAILS.spotlight.acquisition, /엠버/);
  assert.match(CARD_DETAILS.comeback.acquisition, /정예/);
  assert.match(CARD_DETAILS.sitoutpowerbomb.acquisition, /아틀라스/);
  assert.match(CARD_DETAILS.moonsault.acquisition, /세라프/);
  assert.match(CARD_DETAILS.kimura.acquisition, /링스/);
  assert.match(CARD_DETAILS.popuppowerbomb.acquisition, /템페스트/);
  assert.match(CARD_DETAILS.crossface.acquisition, /오닉스/);
});
