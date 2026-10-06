import test from "node:test";
import assert from "node:assert/strict";
import {
  newRun,
  getCard,
  getCardCost,
  getCardDamage,
  getCardUpgradeOptions,
  playCard,
  canPlayCard,
  endTurn,
  normalizeRun,
  chooseReward,
  advanceToNode,
} from "../src/game.js";

const copy = (value) => structuredClone(value);
const utilities = [
  "headlock",
  "armbar",
  "kimura",
  "americana",
  "anklelock",
  "heelhook",
  "collartie",
  "waistlock",
];
function combat(cards, actor = "raven") {
  const state = newRun(actor, 71129);
  state.hand = cards.map((card, index) => ({
    uid: `utility-${index}`,
    upgraded: false,
    ...(typeof card === "string" ? { id: card } : card),
  }));
  state.deck = copy(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.activeGimmick = null;
  state.energy = 3;
  state.player.block = 0;
  state.enemy.hp = state.enemy.maxHp = 500;
  state.enemy.block = state.enemy.weak = state.enemy.vulnerable = 0;
  state.enemy.intent = { type: "guard", value: 0 };
  return state;
}
const play = (state, index) => playCard(state, `utility-${index}`);

test("eight utility cards and their legacy/three-path upgrades prepare resources without dealing damage", () => {
  for (const id of utilities) {
    const variants = [
      getCard(id),
      getCard({ id, upgraded: true }),
      ...getCardUpgradeOptions(id).map((path) => path.preview),
    ];
    assert.equal(variants.length, 5);
    for (const card of variants) {
      assert.equal(card.type, "skill", id);
      assert.equal(card.utility, true, id);
      assert.equal(card.effects.damage || 0, 0, id);
      if (card.effects.energy || card.effects.nextCardDiscount)
        assert.equal(
          card.exhaust,
          true,
          `${id}: reusable resource loops must be finite`,
        );
    }
  }
});

test("the next paid card uses the displayed discounted cost once, immutably, without editing the deck", () => {
  let state = combat(["collartie", "powerbomb", "strike"]);
  state.energy = 1;
  const original = copy(state);
  assert.equal(canPlayCard(state, state.hand[1]), false);
  state = play(state, 0);
  assert.deepEqual(original.deck, state.deck);
  assert.equal(state.status.nextCardDiscount, 1);
  assert.equal(getCardCost(state, state.hand[0]), 1);
  assert.equal(canPlayCard(state, state.hand[0]), true);
  const snapshot = copy(state);
  state = play(state, 1);
  assert.deepEqual(snapshot.deck, state.deck);
  assert.equal(snapshot.energy, 1);
  assert.equal(state.energy, 0);
  assert.equal(state.status.nextCardDiscount, 0);
  assert.equal(getCardCost(state, state.hand[0]), 1);
  assert.equal(state.exhaust[0].id, "collartie");
});

test("printed zero-cost cards preserve the strongest offer instead of adding discounts", () => {
  let state = combat([
    { id: "collartie", upgraded: true, upgradePath: "force" },
    "heelhook",
    "focus",
    "powerbomb",
  ]);
  state.energy = 0;
  state = play(state, 0);
  assert.equal(state.status.nextCardDiscount, 2);
  state = play(state, 1);
  assert.equal(state.status.nextCardDiscount, 2);
  state = play(state, 2);
  assert.equal(state.status.nextCardDiscount, 2);
  assert.equal(
    getCardCost(
      state,
      state.hand.find((c) => c.id === "powerbomb"),
    ),
    0,
  );
  state = play(state, 3);
  assert.equal(state.energy, 0);
  assert.equal(state.status.nextCardDiscount, 0);
});

test("invalid actions preserve discounts, energy, seed and hand including finisher heat requirements", () => {
  let state = combat(["collartie", "finisher"]);
  state = play(state, 0);
  const snapshot = copy(state);
  assert.equal(play(state, 1), state);
  assert.equal(playCard(state, "absent"), state);
  assert.deepEqual(state, snapshot);
  state.player.hype = 3;
  state.energy = 0;
  assert.equal(play(state, 1), state);
  assert.equal(state.status.nextCardDiscount, 1);
});

test("a discounted supplier consumes the previous offer before granting a new one", () => {
  let state = combat(["collartie", "kimura", "guard"]);
  state.energy = 0;
  state = play(state, 0);
  state = play(state, 1);
  assert.equal(state.energy, 0);
  assert.equal(state.status.nextCardDiscount, 1);
  assert.equal(state.exhaust.length, 2);
  state = play(state, 2);
  assert.equal(state.player.block, 10);
  assert.equal(state.status.nextCardDiscount, 0);
});

test("turn offers survive a JSON resume, expire at turn/encounter end and never discount an archived or preview card", () => {
  let state = play(combat(["collartie", "strike", "guard"]), 0);
  const resumed = normalizeRun(JSON.parse(JSON.stringify(state)));
  assert.equal(getCardCost(resumed, resumed.hand[0]), 0);
  assert.deepEqual(play(resumed, 1), play(state, 1));
  assert.equal(getCardCost(state, { id: "powerbomb", uid: "not-in-hand" }), 2);
  assert.equal(getCardCost(state, "powerbomb"), 2);
  const next = endTurn(state);
  assert.equal(next.status.nextCardDiscount, 0);
  state.enemy.hp = 1;
  state = play(state, 1);
  assert.equal(state.phase, "reward");
  assert.equal(state.status.nextCardDiscount, 0);
  state = advanceToNode(chooseReward(state, null), "f2-0");
  assert.equal(state.phase, "combat");
  assert.equal(state.status.nextCardDiscount, 0);
});

test("legacy and malformed saved offers normalize without granting unbounded or negative costs", () => {
  const state = combat(["powerbomb"]);
  delete state.status.nextCardDiscount;
  assert.equal(normalizeRun(state).status.nextCardDiscount, 0);
  for (const [value, expected] of [
    [-4, 0],
    [9, 3],
    [1.8, 1],
    ["bad", 0],
    [Infinity, 0],
  ]) {
    state.status.nextCardDiscount = value;
    const normalized = normalizeRun(state);
    assert.equal(normalized.status.nextCardDiscount, expected);
    assert.equal(
      getCardCost(normalized, normalized.hand[0]),
      Math.max(0, 2 - expected),
    );
  }
});

test("utility locks trigger Lynx once without spending attack-only bonuses or adding a combo", () => {
  let state = combat(["armbar", "anklelock", "strike"], "lynx");
  state.status.nextAttack = 5;
  state.player.stress = 12;
  state = play(state, 0);
  assert.equal(state.enemy.hp, 500);
  assert.equal(state.player.block, 3);
  assert.equal(state.player.stress, 9);
  assert.equal(state.status.jointUsed, true);
  assert.equal(state.status.firstAttack, true);
  assert.equal(state.status.nextAttack, 5);
  assert.equal(state.combo, 0);
  state = play(state, 1);
  assert.equal(state.player.block, 3);
  assert.equal(
    getCardDamage(
      state,
      state.hand.find((c) => c.id === "strike"),
    ),
    16,
  );
});

test("resource utilities refund action points, exhaust, respect the cap, and draw only up to ten", () => {
  let state = combat(["americana", "waistlock", "armbar"]);
  state = play(state, 0);
  assert.equal(state.energy, 3);
  assert.equal(state.player.block, 5);
  state = play(state, 1);
  assert.equal(state.energy, 4);
  assert.equal(state.exhaust.length, 2);
  state = combat(["waistlock"]);
  state.energy = 10;
  assert.equal(play(state, 0).energy, 10);
  state = combat(["armbar", ...Array(9).fill("guard")]);
  state.draw = [
    { uid: "reserve-1", id: "strike" },
    { uid: "reserve-2", id: "strike" },
  ];
  const after = play(state, 0);
  assert.equal(after.hand.length, 10);
  assert.equal(after.draw.length, 1);
});

test("a free draw from a temporary offer cannot repeat the same utility for unlimited actions", () => {
  let state = combat(["collartie", "armbar"]);
  state.energy = 0;
  state = play(state, 0);
  state = play(state, 1);
  assert.equal(
    state.hand[0].id,
    "armbar",
    "reshuffle may return the played drawing card",
  );
  assert.equal(state.status.nextCardDiscount, 0);
  assert.equal(canPlayCard(state, state.hand[0]), false);
  assert.equal(play(state, 1), state);
  assert.equal(state.stats.cardsPlayed, 2);
});
