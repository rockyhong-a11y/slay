import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  newRun,
  getCard,
  getCardDamage,
  getCardUpgradeOptions,
  upgradeCard,
  purchaseCardUpgrade,
  buyItem,
  playCard,
  normalizeRun,
} from "../src/game.js";
import {
  CARD_UPGRADE_PATHS,
  isValidUpgradePath,
} from "../src/card-upgrades.js";
import { getLibraryCards } from "../src/card-library.js";

const copy = (value) => JSON.parse(JSON.stringify(value));
const acquired = Object.keys(CARDS).filter(
  (id) => !["starter", "nightmare"].includes(CARDS[id].rarity),
);
const supported = new Set([
  "damage",
  "hits",
  "comboDamage",
  "comboRequired",
  "extraCombo",
  "block",
  "counterBlock",
  "lowHpBlock",
  "nextAttack",
  "nextCardDiscount",
  "hype",
  "calm",
  "stress",
  "draw",
  "energy",
  "heal",
  "weak",
  "vulnerable",
  "spendHype",
]);

function combat(id, upgradePath) {
  const state = newRun("raven", 90123);
  const instance = { uid: "specialized", id, upgraded: true, upgradePath };
  state.deck = [copy(instance)];
  state.hand = [copy(instance)];
  state.draw = Array.from({ length: 10 }, (_, i) => ({
    id: "guard",
    uid: `draw-${i}`,
    upgraded: false,
  }));
  state.discard = [];
  state.exhaust = [];
  state.energy = 7;
  state.combo = 2;
  state.player.hp = 30;
  state.player.hype = 6;
  state.player.stress = 20;
  state.player.block = 0;
  state.status.firstAttack = false;
  state.status.nextAttack = 0;
  state.enemy.hp = state.enemy.maxHp = 999;
  state.enemy.block = state.enemy.weak = state.enemy.vulnerable = 0;
  state.enemy.intent = { type: "attack", value: 12 };
  state.activeGimmick = null;
  return state;
}

test("every acquired and signature technique has exactly three distinct mechanical specializations", () => {
  assert.equal(acquired.length, 54);
  assert.deepEqual(
    Object.keys(CARD_UPGRADE_PATHS).sort(),
    [...acquired].sort(),
  );
  assert.equal(
    acquired.reduce((count, id) => count + getCardUpgradeOptions(id).length, 0),
    162,
  );
  const source = copy(CARDS);
  for (const id of acquired) {
    const choices = getCardUpgradeOptions(id);
    assert.deepEqual(
      choices.map((choice) => choice.id),
      ["force", "control", "flow"],
      id,
    );
    assert.equal(new Set(choices.map((choice) => choice.label)).size, 3, id);
    assert.equal(
      new Set(
        choices.map((choice) => JSON.stringify([choice.cost, choice.effects])),
      ).size,
      3,
      id,
    );
    assert.ok(
      choices.some((choice) =>
        Object.entries(choice.effects).some(
          ([key, value]) =>
            key !== "damage" &&
            key !== "comboDamage" &&
            value !== CARDS[id].effects[key],
        ),
      ),
      `${id} has a non-damage mechanic choice`,
    );
    for (const choice of choices) {
      assert.ok(
        choice.focus && choice.description && choice.label.length <= 12,
        `${id}/${choice.id} readable copy`,
      );
      assert.ok(isValidUpgradePath(id, choice.id));
      assert.ok(Number.isInteger(choice.cost) && choice.cost >= 0);
      for (const [key, value] of Object.entries(choice.effects)) {
        assert.ok(supported.has(key), `${id}/${choice.id} unsupported ${key}`);
        assert.ok(
          Number.isFinite(value) && value >= 0,
          `${id}/${choice.id}/${key}`,
        );
      }
    }
  }
  assert.deepEqual(CARDS, source);
});

test("all 162 choices execute their stated damage, costs, debuffs, resources and card movement", () => {
  for (const id of acquired)
    for (const choice of getCardUpgradeOptions(id)) {
      const state = combat(id, choice.id);
      const before = copy(state);
      const card = getCard(state.hand[0]);
      const fx = card.effects;
      const expectedDamage = getCardDamage(state, state.hand[0]);
      const result = playCard(state, "specialized");
      const label = `${id}/${choice.id}`;
      assert.notEqual(result, state, label);
      assert.deepEqual(state, before, `${label} immutable`);
      assert.equal(
        before.enemy.hp - result.enemy.hp,
        expectedDamage,
        `${label} damage`,
      );
      assert.equal(
        result.energy,
        Math.min(10, 7 - card.cost + (fx.energy || 0)),
        `${label} cost`,
      );
      assert.equal(
        result.player.block,
        (fx.block || 0) + (fx.counterBlock || 0) + (fx.lowHpBlock || 0),
        `${label} guard`,
      );
      assert.equal(result.enemy.weak, fx.weak || 0, `${label} weak`);
      assert.equal(
        result.enemy.vulnerable,
        fx.vulnerable || 0,
        `${label} vulnerable`,
      );
      assert.equal(
        result.player.stress,
        Math.max(0, 20 - (fx.calm || 0)) + (fx.stress || 0),
        `${label} pressure`,
      );
      assert.equal(
        result.player.hp,
        Math.min(result.player.maxHp, 30 + (fx.heal || 0)),
        `${label} heal`,
      );
      assert.equal(
        result.status.nextAttack,
        fx.nextAttack || 0,
        `${label} next attack`,
      );
      const comboGain = fx.damage
        ? Math.floor((2 + 1 + (fx.extraCombo || 0)) / 2) - 1
        : 0;
      assert.equal(
        result.player.hype,
        Math.min(9, 6 - (fx.spendHype || 0) + comboGain + (fx.hype || 0)),
        `${label} heat`,
      );
      assert.equal(result.hand.length, fx.draw || 0, `${label} draw`);
      const played = result[card.exhaust ? "exhaust" : "discard"].find(
        (entry) => entry.uid === "specialized",
      );
      assert.equal(
        played?.upgradePath,
        choice.id,
        `${label} survives movement`,
      );
    }
});

test("new specialization choices never alter legacy + effects or starter upgrades", () => {
  for (const [id, definition] of Object.entries(CARDS)) {
    assert.deepEqual(
      getCard({ id, upgraded: true }).effects,
      { ...definition.effects, ...definition.upgrade },
      id,
    );
    if (definition.rarity === "starter") {
      assert.deepEqual(
        getCardUpgradeOptions(id).map((choice) => choice.id),
        ["standard"],
      );
    }
    assert.deepEqual(getCardUpgradeOptions({ id, upgraded: true }), []);
  }
  assert.deepEqual(getCardUpgradeOptions("nightmare"), []);
  assert.deepEqual(getCardUpgradeOptions("unknown"), []);
  assert.equal(isValidUpgradePath("powerbomb", "invented"), false);
});

test("training changes exactly one UID and synchronizes its copies without mutating another copy of the technique", () => {
  const state = combat("powerbomb", "force");
  state.phase = "shop";
  state.player.coins = 45;
  state.shopItems = [
    { id: "training", name: "퍼스널 트레이닝", kind: "upgrade", cost: 45 },
  ];
  const card = { id: "powerbomb", uid: "selected", upgraded: false };
  state.deck = [copy(card), { ...card, uid: "other-copy" }];
  for (const pile of ["hand", "draw", "discard", "exhaust"])
    state[pile] = [copy(card)];
  const before = copy(state);
  const result = purchaseCardUpgrade(state, "selected", "flow");
  assert.equal(result.phase, "shop");
  for (const pile of ["deck", "hand", "draw", "discard", "exhaust"]) {
    const upgraded = result[pile].find((entry) => entry.uid === "selected");
    assert.equal(upgraded.upgraded, true, pile);
    assert.equal(upgraded.upgradePath, "flow", pile);
  }
  assert.equal(
    result.deck.find((entry) => entry.uid === "other-copy").upgraded,
    false,
  );
  assert.equal(result.floor, state.floor);
  assert.deepEqual(state, before);
  assert.deepEqual(normalizeRun(copy(result)).deck, result.deck);
});

test("invalid branch, repeated training and nightmare training do not consume the rest visit", () => {
  const state = newRun("raven", 822);
  state.phase = "rest";
  state.deck.push({ id: "powerbomb", uid: "train", upgraded: false });
  const before = copy(state);
  assert.equal(upgradeCard(state, "train", "unknown"), state);
  assert.equal(upgradeCard(state, "train", "standard"), state);
  assert.equal(upgradeCard(state, "missing", "flow"), state);
  const starter = state.deck.find((card) => card.id === "strike");
  assert.equal(upgradeCard(state, starter.uid, "flow"), state);
  state.deck.push({ id: "nightmare", uid: "bad", upgraded: false });
  assert.equal(upgradeCard(state, "bad", "force"), state);
  state.deck.pop();
  assert.deepEqual(state, before);
  const upgraded = upgradeCard(state, "train", "control");
  assert.equal(upgraded.phase, "map");
  upgraded.phase = "rest";
  assert.equal(upgradeCard(upgraded, "train", "force"), upgraded);
});

test("shop training requires concrete selection and charges once only after valid confirmation", () => {
  const state = newRun("raven", 522);
  state.phase = "shop";
  state.player.coins = 90;
  state.shopItems = [
    { id: "training", name: "퍼스널 트레이닝", kind: "upgrade", cost: 45 },
  ];
  state.deck.push({ id: "armbar", uid: "train", upgraded: false });
  const before = copy(state);
  assert.equal(buyItem(state, "training"), state);
  assert.equal(purchaseCardUpgrade(state, "train"), state);
  assert.equal(purchaseCardUpgrade(state, "train", "invalid"), state);
  assert.equal(purchaseCardUpgrade(state, "missing", "flow"), state);
  const poor = copy(state);
  poor.player.coins = 44;
  assert.equal(purchaseCardUpgrade(poor, "train", "flow"), poor);
  const bought = purchaseCardUpgrade(state, "train", "control");
  assert.equal(bought.player.coins, 45);
  assert.equal(bought.shopItems[0].sold, true);
  assert.equal(bought.phase, "shop");
  assert.equal(
    bought.deck.find((card) => card.uid === "train").upgradePath,
    "control",
  );
  assert.equal(purchaseCardUpgrade(bought, "train", "flow"), bought);
  assert.deepEqual(state, before);
});

test("new run blueprints preserve specialization exactly and reject incompatible paths", () => {
  const blueprint = [
    { id: "armbar", upgraded: true, upgradePath: "force" },
    { id: "armbar", upgraded: true, upgradePath: "flow" },
    { id: "powerbomb", upgraded: true, upgradePath: "control" },
    { id: "guard", upgraded: true },
    { id: "focus", upgraded: false },
  ];
  const result = newRun("lynx", 332, blueprint);
  assert.deepEqual(
    result.deck.map(({ uid, ...card }) => card),
    blueprint,
  );
  for (const invalid of [
    { id: "armbar", upgraded: true, upgradePath: "invalid" },
    { id: "armbar", upgraded: false, upgradePath: "flow" },
    { id: "strike", upgraded: true, upgradePath: "force" },
  ]) {
    assert.equal(newRun("lynx", 332, [invalid, ...blueprint]).deck.length, 11);
  }
});

test("the card library exposes every branch and searches specialized mechanics", () => {
  for (const card of getLibraryCards()) {
    assert.deepEqual(
      card.upgradeOptions.map(({ id }) => id),
      getCardUpgradeOptions(card.id).map(({ id }) => id),
    );
  }
  assert.ok(
    getLibraryCards({ search: "스위프트 밤" }).some(
      (card) => card.id === "powerbomb",
    ),
  );
  const preview = getLibraryCards({ upgraded: true, upgradePath: "flow" }).find(
    (card) => card.id === "jackknifepowerbomb",
  );
  assert.equal(preview.cost, 2);
  assert.equal(preview.upgradeLabel, "퀵 릴리스");
});
