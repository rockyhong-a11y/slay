import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  WRESTLERS,
  newRun,
  getCard,
  getCardDamage,
  canPlayCard,
  playCard,
  endTurn,
  chooseReward,
  advanceToNode,
  rest,
  upgradeCard,
  buyItem,
} from "../src/game.js";
import { CARD_DETAILS, getLibraryCards } from "../src/card-library.js";

const THROWS = [
  "sitoutpowerbomb",
  "jackknifepowerbomb",
  "popuppowerbomb",
  "gutwrenchpowerbomb",
  "foldingpowerbomb",
  "bodyslam",
  "powerslam",
  "sidewalkslam",
  "spinebuster",
  "bellysuplex",
  "snapsuplex",
  "samoandrop",
];
const HOLDS = [
  "armbar",
  "kimura",
  "americana",
  "anklelock",
  "kneebar",
  "heelhook",
  "figurefour",
  "bostoncrab",
  "sharpshooter",
  "crossface",
];
const SETUPS = ["collartie", "armdrag", "waistlock"];
const NEW_CARDS = [...THROWS, ...HOLDS, ...SETUPS];
const restored = (state) => JSON.parse(JSON.stringify(state));

function combat(actor, ids) {
  const state = newRun(actor, 90103);
  state.hand = ids.map((card, index) => ({
    uid: `move-${index}`,
    id: typeof card === "string" ? card : card.id,
    upgraded: typeof card === "object" && !!card.upgraded,
  }));
  state.deck = restored(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.enemy.hp = state.enemy.maxHp = 500;
  state.activeGimmick = null;
  state.player.block = 0;
  state.enemy.intent = { type: "attack", value: 12 };
  return state;
}

function openingReward(seed) {
  const state = newRun("raven", seed);
  state.enemy.hp = 1;
  state.hand = [{ uid: "winning-strike", id: "strike", upgraded: false }];
  return playCard(state, "winning-strike");
}

test("25 named grappling techniques preserve the original five starting decks and v1 save shape", () => {
  assert.equal(NEW_CARDS.length, 25);
  assert.equal(Object.keys(CARDS).length, 60);
  assert.equal(new Set(NEW_CARDS).size, 25);
  const profiles = new Set();
  for (const id of NEW_CARDS) {
    const base = getCard(id);
    const upgraded = getCard({ id, upgraded: true });
    assert.ok(base.grapple, id);
    assert.ok(["common", "uncommon", "rare"].includes(base.rarity), id);
    assert.equal(CARD_DETAILS[id].art, `cards/${id}.webp`);
    assert.ok(
      CARD_DETAILS[id].startingWrestlers.every(
        (actor) => WRESTLERS[actor].newcomer,
      ),
      `${id} never changes an original wrestler's starting deck`,
    );
    assert.equal(
      CARD_DETAILS[id].disciplineSlug,
      THROWS.includes(id)
        ? "throw"
        : HOLDS.includes(id)
          ? "submission"
          : "grapple",
    );
    assert.notDeepEqual(
      upgraded.effects,
      base.effects,
      `${id} has an effective upgrade`,
    );
    profiles.add(
      JSON.stringify([base.type, base.cost, base.effects, !!base.exhaust]),
    );
  }
  assert.equal(
    profiles.size,
    25,
    "each new move has a distinct tactical profile",
  );
  assert.equal(getLibraryCards({ discipline: "submission" }).length, 23);
  for (const actor of Object.keys(WRESTLERS)) {
    const state = newRun(actor);
    assert.equal(state.version, 1);
    assert.equal(state.deck.length, 11);
    if (!WRESTLERS[actor].newcomer)
      assert.ok(state.deck.every((card) => !NEW_CARDS.includes(card.id)));
    assert.deepEqual(state, restored(state));
  }
});

test("all 60 cards resolve base and upgraded effects for every wrestler with accurate damage previews and immutable saves", () => {
  for (const actor of Object.keys(WRESTLERS)) {
    for (const id of Object.keys(CARDS)) {
      for (const upgraded of [false, true]) {
        const state = combat(actor, [{ id, upgraded }]);
        state.player.hp = Math.floor(state.player.maxHp / 2);
        state.player.stress = 20;
        state.player.hype = 3;
        state.combo = 2;
        state.status.nextAttack = 2;
        state.enemy.weak = 1;
        state.enemy.vulnerable = 1;
        state.draw = Array.from({ length: 5 }, (_, index) => ({
          uid: `reserve-${index}`,
          id: "guard",
          upgraded: false,
        }));
        state.deck.push(...restored(state.draw));
        const label = `${actor}/${id}/${upgraded ? "upgraded" : "base"}`;
        const snapshot = restored(state);
        const definition = getCard(state.hand[0]);
        const preview = getCardDamage(state, state.hand[0]);
        assert.equal(canPlayCard(state, "move-0"), true, label);
        const next = playCard(state, "move-0");
        assert.equal(state.enemy.hp - next.enemy.hp, preview, label);
        assert.deepEqual(state, snapshot, `${label} source remains immutable`);
        assert.deepEqual(
          next,
          playCard(restored(state), "move-0"),
          `${label} JSON restore agrees`,
        );
        const piles = [
          ...next.hand,
          ...next.draw,
          ...next.discard,
          ...next.exhaust,
        ];
        assert.equal(
          new Set(piles.map((card) => card.uid)).size,
          piles.length,
          label,
        );
        assert.equal(
          next[definition.exhaust ? "exhaust" : "discard"].filter(
            (card) => card.uid === "move-0",
          ).length,
          1,
          label,
        );
        assert.ok(next.energy >= 0 && next.energy <= 10, label);
        assert.ok(
          next.player.hp >= 0 && next.player.hp <= next.player.maxHp,
          label,
        );
        assert.ok(next.player.hype >= 0 && next.player.hype <= 9, label);
        assert.ok(next.player.stress >= 0 && next.player.stress <= 100, label);
      }
    }
  }
});

test("every new move is actually offered in normal rewards and shops, purchasable once, and permanently upgradeable", () => {
  const rewards = new Map();
  const shops = new Map();
  for (let seed = 1; seed <= 768; seed++) {
    const reward = openingReward(seed);
    for (const id of reward.rewards)
      if (NEW_CARDS.includes(id)) rewards.set(id, reward);
    let state = chooseReward(reward, null);
    state = advanceToNode(
      state,
      state.mapNodes.find((node) => node.type === "shop").index,
    );
    for (const item of state.shopItems) {
      if (NEW_CARDS.includes(item.cardId))
        shops.set(item.cardId, { state, item });
    }
  }
  assert.deepEqual([...rewards.keys()].sort(), [...NEW_CARDS].sort());
  assert.deepEqual([...shops.keys()].sort(), [...NEW_CARDS].sort());
  for (const id of NEW_CARDS) {
    const reward = rewards.get(id);
    const original = restored(reward);
    let chosen = chooseReward(reward, id);
    const acquired = chosen.deck.at(-1);
    assert.equal(acquired.id, id);
    assert.equal(acquired.upgraded, false);
    assert.deepEqual(
      reward,
      original,
      `${id} reward does not mutate its source`,
    );
    chosen = advanceToNode(
      chosen,
      chosen.mapNodes.find((node) => node.type === "rest").index,
    );
    const upgraded = upgradeCard(chosen, acquired.uid);
    assert.equal(upgraded.phase, "map");
    assert.equal(
      upgraded.deck.find((card) => card.uid === acquired.uid).upgraded,
      true,
    );
    assert.equal(
      chosen.deck.find((card) => card.uid === acquired.uid).upgraded,
      false,
    );
    assert.deepEqual(upgraded, upgradeCard(restored(chosen), acquired.uid));
    const { state, item } = shops.get(id);
    const bought = buyItem(state, item.id);
    assert.equal(bought.deck.at(-1).id, id);
    assert.equal(bought.player.coins, state.player.coins - item.cost);
    assert.equal(
      buyItem(bought, item.id),
      bought,
      `${id} cannot be purchased twice`,
    );
  }
});

test("zero-cost arm drag opens a two-combo throw chain while a tie-up reserves its discount for the throw", () => {
  let state = combat("valkyrie", ["collartie", "armdrag", "foldingpowerbomb"]);
  state = playCard(state, "move-0");
  assert.equal(state.status.nextCardDiscount, 1);
  assert.equal(state.status.nextAttack, 0);
  assert.equal(state.combo, 0);
  assert.equal(state.player.hype, 0);
  assert.equal(state.status.firstAttack, true);
  assert.equal(getCardDamage(state, state.hand[0]), 5);
  state = playCard(state, "move-1");
  assert.equal(state.combo, 2);
  assert.equal(state.player.hype, 1);
  assert.equal(state.status.nextAttack, 0);
  assert.equal(state.status.nextCardDiscount, 1);
  assert.equal(getCardDamage(state, state.hand[0]), 30);
  const before = state.enemy.hp;
  state = playCard(state, "move-2");
  assert.equal(before - state.enemy.hp, 30);
  assert.equal(state.player.block, 12);
  assert.equal(state.energy, 2);
  assert.equal(state.status.nextCardDiscount, 0);
  assert.deepEqual(
    state.exhaust.map((card) => card.id),
    ["collartie", "armdrag"],
  );
  assert.equal(state.discard[0].id, "foldingpowerbomb");
});

test("throw combo bonuses use preceding attacks and survive upgrades without becoming unconditional", () => {
  for (const id of ["popuppowerbomb", "powerslam", "foldingpowerbomb"]) {
    const card = getCard({ id, upgraded: true });
    const state = combat("ember", [{ id, upgraded: true }]);
    assert.equal(getCardDamage(state, state.hand[0]), card.effects.damage);
    state.combo = card.effects.comboRequired;
    assert.equal(
      getCardDamage(state, state.hand[0]),
      card.effects.damage + card.effects.comboDamage,
    );
    const preview = getCardDamage(state, state.hand[0]);
    const played = playCard(state, "move-0");
    assert.equal(state.enemy.hp - played.enemy.hp, preview);
    assert.equal(
      state.combo,
      card.effects.comboRequired,
      "damage previews do not advance combo",
    );
  }
});

test("joint utilities trigger Viper once and prepare real follow-up damage through save/load", () => {
  let state = combat("viper", ["kimura", "armbar", "strike"]);
  state.draw = Array.from({ length: 4 }, (_, index) => ({
    uid: `reserve-${index}`,
    id: "guard",
    upgraded: false,
  }));
  assert.equal(getCardDamage(state, state.hand[0]), 0);
  state = playCard(state, "move-0");
  assert.equal(state.enemy.hp, 500);
  assert.equal(state.enemy.weak, 1);
  assert.equal(state.enemy.vulnerable, 1);
  assert.equal(getCardDamage(state, state.hand[0]), 0);
  state = playCard(restored(state), "move-1");
  assert.equal(state.enemy.hp, 500);
  assert.equal(state.enemy.vulnerable, 3);
  assert.equal(
    playCard(state, "move-1"),
    state,
    "a used card cannot repeat a passive",
  );
  assert.equal(getCardDamage(state, state.hand[0]), 12);
  const third = playCard(state, "move-2");
  assert.equal(third.enemy.hp, 488);
  assert.equal(third.enemy.weak, 1);
  assert.equal(
    third.enemy.vulnerable,
    3,
    "the following attack does not add another passive vulnerability",
  );
  assert.equal(third.status.precisionUsed, true);
  const next = endTurn(third);
  assert.equal(next.enemy.weak, 0);
  assert.equal(next.enemy.vulnerable, 2);
  assert.equal(next.status.precisionUsed, false);
});

test("slam counters depend on visible intent and figure-four comeback guard uses the exact health boundary", () => {
  for (const id of ["spinebuster", "crossface"]) {
    const state = combat("valkyrie", [id]);
    const card = getCard(id);
    assert.equal(
      playCard(state, "move-0").player.block,
      card.effects.block + card.effects.counterBlock,
    );
    state.enemy.intent.type = "guard";
    assert.equal(playCard(state, "move-0").player.block, card.effects.block);
  }
  const state = combat("ember", [{ id: "figurefour", upgraded: true }]);
  state.player.hp = 40;
  assert.equal(playCard(state, "move-0").player.block, 22);
  assert.equal(
    playCard(state, "move-0").status.crowdUsed,
    false,
    "a submission attack is not a skill",
  );
  state.player.hp = 41;
  assert.equal(playCard(state, "move-0").player.block, 14);
});

test("Sharpshooter enforces energy and heat, consumes three heat, weakens, and exhausts through a saved run", () => {
  let state = combat("valkyrie", [{ id: "sharpshooter", upgraded: true }]);
  state.player.hype = 2;
  assert.equal(canPlayCard(state, "move-0"), false);
  assert.equal(playCard(state, "move-0"), state);
  state.player.hype = 3;
  state.energy = 1;
  assert.equal(playCard(state, "move-0"), state);
  state.energy = 2;
  const preview = getCardDamage(state, state.hand[0]);
  assert.equal(preview, 36);
  state = playCard(restored(state), "move-0");
  assert.equal(state.enemy.hp, 500 - preview);
  assert.equal(state.enemy.weak, 4);
  assert.equal(state.player.hype, 0);
  assert.equal(state.stats.finishers, 1);
  assert.equal(state.energy, 0);
  assert.equal(state.exhaust[0].id, "sharpshooter");
  state = endTurn(state);
  assert.ok(
    ![...state.hand, ...state.draw, ...state.discard].some(
      (card) => card.id === "sharpshooter",
    ),
  );
});

test("new setup skills combine with Ember's crowd and Nova's draw without repeating per-turn passives", () => {
  let ember = combat("ember", ["collartie", "waistlock"]);
  ember.player.hp = 40;
  ember.player.stress = 8;
  ember = playCard(ember, "move-0");
  assert.equal(ember.player.hp, 42);
  assert.equal(ember.player.hype, 1);
  assert.equal(ember.player.stress, 5);
  ember = playCard(restored(ember), "move-1");
  assert.equal(ember.player.hp, 42);
  assert.equal(ember.player.hype, 1);
  assert.equal(ember.status.nextAttack, 0);
  assert.equal(ember.energy, 5);
  assert.equal(ember.player.block, 9);
  assert.equal(ember.status.crowdUsed, true);

  let nova = combat("nova", ["armdrag", "collartie"]);
  nova.draw = [{ uid: "drawn-guard", id: "guard", upgraded: false }];
  nova = playCard(nova, "move-0");
  assert.deepEqual(
    nova.hand.map((card) => card.id),
    ["collartie", "guard"],
  );
  assert.equal(nova.status.firstZero, false);
  nova = playCard(restored(nova), "move-1");
  assert.deepEqual(
    nova.hand.map((card) => card.id),
    ["guard"],
  );
  assert.equal(nova.draw.length, 0);
  assert.deepEqual(
    nova.exhaust.map((card) => card.id),
    ["armdrag", "collartie"],
  );
});
