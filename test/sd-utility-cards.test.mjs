import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  WRESTLERS,
  newRun,
  getCard,
  getCardCost,
  getCardDamage,
  getCardUpgradeOptions,
  canPlayCard,
  playCard,
  endTurn,
  normalizeRun,
  chooseReward,
  advanceToNode,
  buyItem,
  upgradeCard,
} from "../src/game.js";
import {
  saveCompletedDeck,
  loadDeckArchive,
  startRunFromSavedDeck,
} from "../src/deck-archive.js";

const NEW_CARDS = {
  wristlock: "리스트록",
  hammerlock: "해머록",
  omoplata: "오모플라타",
  octopushold: "옥토퍼스 홀드",
  surfboard: "서프보드 스트레치",
  stf: "STF",
  toehold: "토 홀드",
  calfslicer: "카프 슬라이서",
  bowandarrow: "보우 앤 애로",
  abdominalstretch: "앱도미널 스트레치",
};
const ids = Object.keys(NEW_CARDS);
const copy = (value) => JSON.parse(JSON.stringify(value));
const variants = (id) => [
  { id, upgraded: false },
  { id, upgraded: true },
  ...getCardUpgradeOptions(id).map(({ id: upgradePath }) => ({
    id,
    upgraded: true,
    upgradePath,
  })),
];

function combat(cards, actor = "raven") {
  const state = newRun(actor, 71583);
  state.hand = cards.map((card, index) => ({
    uid: `hold-${index}`,
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
  state.player.stress = 20;
  state.enemy.hp = state.enemy.maxHp = 500;
  state.enemy.block = state.enemy.weak = state.enemy.vulnerable = 0;
  state.enemy.intent = { type: "guard", value: 0 };
  return state;
}

test("ten additional SD holds expand the catalog to 60 and add 30 distinct named upgrade choices", () => {
  assert.equal(Object.keys(CARDS).length, 60);
  assert.equal(Object.values(CARDS).filter((card) => card.utility).length, 18);
  assert.deepEqual(
    Object.keys(CARDS).filter((id) => CARDS[id].artStyle === "sd2d"),
    ids,
  );
  const labels = new Set();
  for (const [id, name] of Object.entries(NEW_CARDS)) {
    const base = getCard(id);
    assert.equal(base.name, name);
    assert.ok(["common", "uncommon", "rare"].includes(base.rarity));
    const paths = getCardUpgradeOptions(id);
    assert.equal(paths.length, 3, id);
    assert.equal(
      new Set(paths.map((path) => JSON.stringify(path.effects))).size,
      3,
      id,
    );
    paths.forEach(({ label }) => labels.add(label));
    for (const instance of variants(id)) {
      const card = getCard(instance);
      const label = `${id}/${instance.upgradePath || instance.upgraded}`;
      assert.equal(card.type, "skill", label);
      assert.equal(card.utility, true, label);
      assert.equal(card.grapple, true, label);
      assert.equal(card.artStyle, "sd2d", label);
      assert.equal(card.effects.damage || 0, 0, label);
      assert.equal(card.effects.comboDamage || 0, 0, label);
      if (
        card.effects.energy ||
        card.effects.nextCardDiscount ||
        card.cost === 0
      )
        assert.equal(card.exhaust, true, `${label} free resources are finite`);
    }
  }
  assert.equal(labels.size, 30);
});

test("all ten wrestlers retain their exact established eleven-card starter decks", () => {
  const standard = (signature) => [
    "strike",
    "strike",
    "strike",
    "strike",
    "guard",
    "guard",
    "guard",
    "grapple",
    "focus",
    "finisher",
    signature,
  ];
  const specialist = (...cards) => [
    "strike",
    "strike",
    "guard",
    "guard",
    "grapple",
    "focus",
    "finisher",
    ...cards,
  ];
  const expected = {
    raven: standard("redline"),
    valkyrie: standard("ironclad"),
    nova: standard("flashstep"),
    viper: [
      "strike",
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "headlock",
      "headlock",
      "reversal",
    ],
    ember: [
      "strike",
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "spotlight",
      "rally",
      "comeback",
    ],
    atlas: specialist("bodyslam", "waistlock", "sitoutpowerbomb", "shoulder"),
    seraph: specialist("dropkick", "dropkick", "moonsault", "rally"),
    lynx: specialist("armbar", "armbar", "americana", "kimura"),
    tempest: specialist("armdrag", "bodyslam", "snapsuplex", "popuppowerbomb"),
    onyx: specialist("reversal", "reversal", "ringcraft", "crossface"),
  };
  assert.deepEqual(Object.keys(WRESTLERS), Object.keys(expected));
  for (const [actor, startingDeck] of Object.entries(expected)) {
    assert.deepEqual(WRESTLERS[actor].startingDeck, startingDeck, actor);
    assert.deepEqual(
      newRun(actor).deck.map(({ id }) => id),
      startingDeck,
      actor,
    );
  }
});

test("every base, legacy and named variant resolves without damage and cannot recycle itself indefinitely", () => {
  for (const id of ids) {
    for (const instance of variants(id)) {
      let state = combat([instance], "nova");
      const card = getCard(instance);
      const label = `${id}/${instance.upgradePath || instance.upgraded}`;
      let actions = 0;
      while (canPlayCard(state, "hold-0") && actions < 10) {
        const before = copy(state);
        assert.equal(getCardDamage(state, state.hand[0]), 0, label);
        state = playCard(state, "hold-0");
        actions++;
        assert.equal(state.enemy.hp, 500, label);
        assert.equal(state.combo, 0, label);
        assert.equal(state.status.firstAttack, true, label);
        assert.equal(
          state.energy,
          Math.min(
            10,
            before.energy -
              getCardCost(before, before.hand[0]) +
              (card.effects.energy || 0),
          ),
          label,
        );
        assert.deepEqual(
          state,
          playCard(normalizeRun(copy(before)), "hold-0"),
          `${label} deterministic resume`,
        );
      }
      assert.ok(
        actions > 0 && actions <= 3,
        `${label} terminates with finite resources`,
      );
      if (card.exhaust) {
        assert.equal(actions, 1, label);
        assert.equal(
          state.exhaust.filter(({ uid }) => uid === "hold-0").length,
          1,
          label,
        );
      } else {
        assert.equal(actions, 3, `${label} each repeat spends energy`);
        assert.equal(state.energy, 0, label);
      }
      assert.equal(
        playCard(state, "hold-0"),
        state,
        `${label} cannot repeat without resources`,
      );
    }
  }
});

test("every new hold activates Lynx once per turn, including after a save and resume", () => {
  for (const id of ids) {
    let state = combat([id, id], "lynx");
    state.energy = 10;
    state.status.nextAttack = 5;
    const fx = getCard(id).effects;
    state = playCard(state, "hold-0");
    assert.equal(state.player.block, (fx.block || 0) + 3, id);
    assert.equal(state.player.stress, Math.max(0, 17 - (fx.calm || 0)), id);
    assert.equal(state.status.jointUsed, true, id);
    state = playCard(normalizeRun(copy(state)), "hold-1");
    assert.equal(state.player.block, 2 * (fx.block || 0) + 3, id);
    assert.equal(state.player.stress, Math.max(0, 17 - 2 * (fx.calm || 0)), id);
    assert.equal(state.status.nextAttack, 5, id);
    assert.equal(state.status.firstAttack, true, id);
    assert.equal(state.combo, 0, id);
    assert.equal(state.enemy.hp, 500, id);
    state = endTurn(state);
    assert.equal(state.status.jointUsed, false, id);
    state.hand = [{ id, uid: "next-turn", upgraded: false }];
    const block = state.player.block;
    state = playCard(state, "next-turn");
    assert.equal(state.player.block, block + (fx.block || 0) + 3, id);
    assert.equal(state.status.jointUsed, true, id);
  }
});

function openingReward(seed) {
  const state = newRun("raven", seed);
  state.enemy.hp = 1;
  state.hand = [{ uid: "winning-strike", id: "strike", upgraded: false }];
  return playCard(state, "winning-strike");
}

test("all ten holds are reachable through normal reward and shop actions and each offer is acquired once", () => {
  const rewards = new Map();
  const shops = new Map();
  for (
    let seed = 1;
    seed <= 768 && (rewards.size < 10 || shops.size < 10);
    seed++
  ) {
    const reward = openingReward(seed);
    for (const id of reward.rewards)
      if (ids.includes(id)) rewards.set(id, reward);
    const map = chooseReward(reward, null);
    const shop = advanceToNode(
      map,
      map.mapNodes.find((node) => node.type === "shop").index,
    );
    assert.equal(shop.phase, "shop");
    for (const item of shop.shopItems)
      if (ids.includes(item.cardId)) shops.set(item.cardId, { shop, item });
  }
  assert.deepEqual([...rewards.keys()].sort(), [...ids].sort());
  assert.deepEqual([...shops.keys()].sort(), [...ids].sort());
  for (const id of ids) {
    const reward = rewards.get(id);
    const snapshot = copy(reward);
    const chosen = chooseReward(reward, id);
    assert.equal(chosen.deck.length, reward.deck.length + 1, id);
    assert.equal(chosen.deck.at(-1).id, id);
    assert.equal(
      chooseReward(chosen, id),
      chosen,
      `${id} reward cannot be repeated`,
    );
    assert.deepEqual(reward, snapshot, `${id} reward remains immutable`);
    const { shop, item } = shops.get(id);
    const purchased = buyItem(shop, item.id);
    assert.equal(purchased.deck.at(-1).id, id);
    assert.equal(purchased.player.coins, shop.player.coins - item.cost, id);
    assert.equal(
      buyItem(purchased, item.id),
      purchased,
      `${id} purchase cannot be repeated`,
    );
  }
});

test("all 30 mutually exclusive upgrades and legacy versions survive JSON saves and exact champion deck replay", () => {
  const preserved = [];
  for (const id of ids) {
    for (const variant of variants(id)) {
      const state = combat([id]);
      state.phase = "rest";
      const upgraded = variant.upgraded
        ? upgradeCard(state, "hold-0", variant.upgradePath)
        : state;
      const instance = upgraded.deck[0];
      assert.deepEqual(getCard(instance).effects, getCard(variant).effects, id);
      if (variant.upgraded) {
        assert.equal(instance.upgraded, true, id);
        assert.equal(instance.upgradePath, variant.upgradePath, id);
        upgraded.phase = "rest";
        assert.equal(
          upgradeCard(upgraded, "hold-0", "control"),
          upgraded,
          `${id} upgrades are exclusive`,
        );
      }
      const resumed = normalizeRun(copy(upgraded));
      assert.deepEqual(resumed.deck, upgraded.deck, id);
      preserved.push({ ...instance, uid: `archived-${preserved.length}` });
    }
  }
  let victory = newRun("lynx", 7823);
  victory.floor = victory.maxFloor;
  victory.wave = victory.waveCount;
  victory.enemy.type = "boss";
  victory.enemy.hp = 1;
  victory.hand = [{ uid: "winning-strike", id: "strike", upgraded: false }];
  victory = playCard(victory, "winning-strike");
  assert.equal(victory.phase, "victory");
  victory.deck = preserved;
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const saved = saveCompletedDeck(victory, { storage });
  assert.equal(saved.ok, true);
  const loaded = loadDeckArchive(storage).archive.decks[0];
  const replay = startRunFromSavedDeck(loaded, "lynx", 73519);
  assert.deepEqual(
    replay.deck.map(({ uid, ...card }) => card),
    preserved.map(({ uid, ...card }) => card),
  );
  assert.deepEqual(
    replay.deck.map((card) => getCard(card).effects),
    preserved.map((card) => getCard(card).effects),
  );
  assert.equal(replay.deck.filter((card) => card.upgradePath).length, 30);
  assert.ok(replay.deck.every((card) => !card.uid.startsWith("archived-")));
});
