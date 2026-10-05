import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  WRESTLERS,
  newRun,
  getCard,
  canPlayCard,
  playCard,
  endTurn,
  chooseReward,
  advanceToNode,
  mapForFloor,
  rest,
  upgradeCard,
  buyItem,
  leaveShop,
  resolveEvent,
  getCardDamage,
  getRunProgress,
} from "../src/game.js";

function combatWith(ids, wrestler = "raven") {
  const state = newRun(wrestler);
  const cards = ids.map((id, index) => ({
    uid: `test-${index}`,
    id,
    upgraded: false,
  }));
  state.hand = cards;
  state.deck = structuredClone(cards);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.enemy.hp = state.enemy.maxHp = 200;
  state.activeGimmick = null;
  state.player.block = 0;
  return state;
}

function toMap(state = newRun()) {
  state.enemy.hp = 1;
  state.hand = [{ uid: "victory", id: "strike", upgraded: false }];
  return chooseReward(playCard(state, "victory"), null);
}

test("new runs are deterministic, serializable, and start with unique cards", () => {
  for (const id of Object.keys(WRESTLERS)) {
    const state = newRun(id, 12345);
    assert.deepEqual(state, newRun(id, 12345));
    assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
    assert.equal(state.phase, "combat");
    assert.equal(
      state.hand.length,
      4,
      "starter iron corner reduces only the opening hand",
    );
    assert.equal(state.deck.length, 11);
    assert.equal(new Set(state.deck.map((c) => c.uid)).size, 11);
    assert.equal(state.player.hp, WRESTLERS[id].maxHp);
    assert.equal(state.energy, 3);
    assert.equal(state.relics.length, 1);
    assert.ok(state.deck.some((c) => c.id === WRESTLERS[id].signature));
  }
});

test("invalid actions are safe no-ops and valid actions never mutate the input", () => {
  const state = combatWith(["strike", "finisher"]);
  const snapshot = structuredClone(state);
  assert.equal(playCard(state, "missing"), state);
  assert.equal(playCard(state, "test-1"), state);
  assert.equal(canPlayCard(state, "test-1"), false);
  const result = playCard(state, "test-0");
  assert.notEqual(result, state);
  assert.deepEqual(state, snapshot);
  assert.equal(result.energy, 2);
  assert.equal(result.enemy.hp, 192);
  assert.equal(result.hand.length, 1);
  assert.equal(result.discard[0].uid, "test-0");
  state.energy = 0;
  assert.equal(playCard(state, "test-0"), state);
});

test("combos create hype and finishers require and consume it", () => {
  let state = combatWith(["strike", "strike", "finisher"]);
  state = playCard(state, "test-0");
  state = playCard(state, "test-1");
  assert.equal(state.combo, 2);
  assert.equal(state.player.hype, 1);
  assert.equal(state.enemy.hp, 186);
  assert.equal(playCard(state, "test-2"), state);
  state.energy = 2;
  state.player.hype = 3;
  assert.equal(getCardDamage(state, state.hand[0]), 26);
  state = playCard(state, "test-2");
  assert.equal(state.enemy.hp, 160);
  assert.equal(state.player.hype, 0);
  assert.equal(state.stats.finishers, 1);
});

test("visible attacks resolve against block and the next turn refills energy", () => {
  let state = combatWith(["guard", "strike", "grapple"]);
  const initialHp = state.player.hp;
  state = playCard(state, "test-0");
  assert.equal(state.player.block, 7);
  state = endTurn(state);
  assert.equal(state.player.hp, initialHp);
  assert.equal(state.player.block, 0);
  assert.equal(state.energy, 3);
  assert.equal(state.turn, 2);
  assert.equal(state.enemy.intent.type, "guard");
  assert.equal(state.hand.length, 3);
  assert.equal(state.player.stress, 2);
});

test("Nova draws an extra card once per turn and exhausted cards cannot reshuffle", () => {
  let state = combatWith(
    ["flashstep", "focus", "strike", "guard", "grapple"],
    "nova",
  );
  state.draw = state.hand.splice(1);
  state = playCard(state, "test-0");
  assert.equal(state.hand.length, 2);
  assert.equal(state.exhaust.length, 1);
  assert.equal(state.status.firstZero, false);
  for (let i = 0; i < 4; i++) state = endTurn(state);
  assert.ok(
    ![...state.hand, ...state.draw, ...state.discard].some(
      (c) => c.id === "flashstep",
    ),
  );
  assert.equal(state.exhaust[0].id, "flashstep");
});

test("pressure thresholds permanently add nightmare cards and a breakdown can defeat", () => {
  let state = newRun();
  state.player.stress = 34;
  state.enemy.intent = { type: "taunt", value: 7 };
  state = endTurn(state);
  assert.equal(state.deck.filter((c) => c.id === "nightmare").length, 1);
  assert.equal(state.nextNightmareAt, 60);
  assert.ok(state.log.some((line) => line.includes("악몽")));
  state.player.stress = 99;
  state.player.hp = 5;
  state.enemy.intent = { type: "taunt", value: 2 };
  state = endTurn(state);
  assert.equal(state.phase, "defeat");
  assert.equal(state.player.hp, 0);
  assert.equal(endTurn(state), state);
});

test("victories pay once, offer three different rewards, and enter a branching map", () => {
  let state = combatWith(["strike"]);
  state.enemy.hp = 1;
  const coins = state.player.coins;
  state = playCard(state, "test-0");
  assert.equal(state.phase, "reward");
  assert.equal(state.player.coins, coins + 35);
  assert.equal(new Set(state.rewards).size, 3);
  assert.equal(chooseReward(state, "not-a-card"), state);
  const id = state.rewards[0];
  state = chooseReward(state, id);
  assert.equal(state.phase, "map");
  assert.equal(state.deck.length, 2);
  assert.equal(state.deck[1].id, id);
  assert.equal(state.mapNodes.length, 6);
  assert.equal(chooseReward(state, id), state);
  assert.equal(advanceToNode(state, 99), state);
});

test("rest upgrades a chosen permanent card and spends exactly one map node", () => {
  let state = advanceToNode(toMap(), 1);
  assert.equal(state.phase, "rest");
  assert.equal(state.floor, 2);
  const finisher = state.deck.find((c) => c.id === "finisher");
  const original = structuredClone(state);
  state = upgradeCard(state, finisher.uid);
  assert.equal(state.phase, "map");
  assert.equal(state.floor, 2);
  assert.equal(state.deck.find((c) => c.uid === finisher.uid).upgraded, true);
  assert.equal(
    getCard(state.deck.find((c) => c.uid === finisher.uid)).effects.damage,
    36,
  );
  assert.equal(
    getCard(state.deck.find((c) => c.uid === finisher.uid)).uid,
    finisher.uid,
  );
  assert.ok(
    getCard(
      state.deck.find((c) => c.uid === finisher.uid),
    ).description.includes("36"),
  );
  assert.deepEqual(
    original.deck.find((c) => c.uid === finisher.uid).upgraded,
    false,
  );
});

test("healing is capped, meditation removes a nightmare, and invalid rest actions do nothing", () => {
  let state = advanceToNode(toMap(), 1);
  state.player.hp -= 3;
  assert.equal(rest(state, "unknown"), state);
  const healed = rest(state, "heal");
  assert.equal(healed.player.hp, healed.player.maxHp);
  state.player.stress = 40;
  state.deck.push({ uid: "bad-dream", id: "nightmare", upgraded: false });
  state = rest(state, "meditate");
  assert.equal(state.player.stress, 15);
  assert.ok(!state.deck.some((c) => c.uid === "bad-dream"));
});

test("shops enforce affordability, prevent duplicate purchases, and stock one-encounter gimmicks", () => {
  let state = advanceToNode(toMap(), 4);
  assert.equal(state.phase, "shop");
  assert.ok(!state.shopItems.some((item) => item.id === "energy-belt"));
  const offer = state.shopItems.find((item) => item.kind === "gimmick");
  state.player.coins = offer.cost - 1;
  assert.equal(buyItem(state, offer.id), state);
  state.player.coins = offer.cost + 5;
  state = buyItem(state, offer.id);
  assert.equal(state.player.coins, 5);
  assert.equal(state.maxEnergy, 3);
  assert.ok(state.gimmicks.some((item) => item.id === offer.gimmickId));
  assert.equal(buyItem(state, offer.id), state);
  state = leaveShop(state);
  assert.equal(state.phase, "map");
  assert.equal(state.floor, 2);
});

test("events apply a valid choice atomically and saved runs preserve future randomness", () => {
  let state = advanceToNode(toMap(), 2);
  assert.equal(state.phase, "event");
  assert.equal(resolveEvent(state, "unknown"), state);
  const saved = JSON.parse(JSON.stringify(state));
  const choiceId = state.event.choices[0].id;
  const result = resolveEvent(state, choiceId);
  assert.equal(result.phase, "map");
  assert.equal(result.event, null);
  assert.deepEqual(result, resolveEvent(saved, choiceId));
  assert.equal(state.phase, "event");
});

test("the final championship resolves into a complete victory", () => {
  let state = toMap();
  state.floor = 7;
  state.mapNodes = mapForFloor(8);
  assert.equal(state.mapNodes.length, 1);
  state = advanceToNode(state, 0);
  assert.equal(state.floor, 8);
  assert.equal(state.enemy.type, "boss");
  state.enemy.hp = 1;
  state.hand = [{ uid: "winning-shot", id: "strike", upgraded: false }];
  state = playCard(state, "winning-shot");
  assert.equal(state.phase, "victory");
  assert.equal(getRunProgress(state), 100);
  assert.equal(endTurn(state), state);
});

test("all card definitions have renderable Korean descriptions and usable artwork keys", () => {
  for (const [id, card] of Object.entries(CARDS)) {
    assert.ok(card.name && card.nameEn && card.description, id);
    assert.ok(
      ["strike", "guard", "grapple", "focus", "finisher"].includes(card.artKey),
      id,
    );
    assert.ok(card.cost >= 0 && card.cost <= 3, id);
    assert.ok(getCard({ id, uid: "render", upgraded: true }).description, id);
  }
});

function strategicRun(id, seed = 20903) {
  let state = newRun(id, seed);
  const priority = [
    "championship",
    "quickdraw",
    "doubletap",
    "powerbomb",
    "steelwill",
    "spotlight",
    "suplex",
    "moonsault",
    "ringcraft",
    "headlock",
    "dropkick",
  ];
  for (
    let step = 0;
    step < 1000 && !["victory", "defeat"].includes(state.phase);
    step++
  ) {
    if (state.phase === "combat") {
      const choices = state.hand
        .filter((c) => canPlayCard(state, c))
        .map((instance) => {
          const card = getCard(instance),
            effects = card.effects;
          const damage = getCardDamage(state, instance);
          let score =
            damage >= state.enemy.hp + state.enemy.block
              ? 10000
              : (damage * 2) / Math.max(1, card.cost);
          if (effects.block && state.enemy.intent.type === "attack") {
            const incoming = state.enemy.intent.value - state.player.block;
            score +=
              Math.max(
                0,
                Math.min(effects.block + (effects.counterBlock || 0), incoming),
              ) * 3;
          }
          score += (effects.draw || 0) * 6 + (effects.energy || 0) * 12;
          if (effects.hype && state.player.hype < 3) score += effects.hype * 10;
          score += Math.min(effects.calm || 0, state.player.stress) * 0.3;
          if (card.exhaust && card.cost === 0) score += 3;
          if (card.type === "nightmare") score -= 10;
          return { instance, score };
        })
        .sort((a, b) => b.score - a.score);
      state =
        choices[0]?.score > 0
          ? playCard(state, choices[0].instance.uid)
          : endTurn(state);
      const piles = [
        ...state.hand,
        ...state.draw,
        ...state.discard,
        ...state.exhaust,
      ];
      assert.equal(
        new Set(piles.map((c) => c.uid)).size,
        piles.length,
        "no card can exist in two combat piles",
      );
      assert.ok(state.hand.length <= 10);
      assert.ok(state.player.hp >= 0 && state.player.hp <= state.player.maxHp);
    } else if (state.phase === "reward") {
      const rank = (id) => (priority.includes(id) ? priority.indexOf(id) : 999);
      state = chooseReward(
        state,
        [...state.rewards].sort((a, b) => rank(a) - rank(b))[0],
      );
    } else if (state.phase === "map") {
      const preferred =
        state.floor === 2
          ? "shop"
          : [3, 5, 6].includes(state.floor)
            ? "rest"
            : "fight";
      const node =
        state.mapNodes.find((n) => n.type === preferred) || state.mapNodes[0];
      state = advanceToNode(state, node.index);
    } else if (state.phase === "rest") {
      state = rest(
        state,
        state.player.maxHp - state.player.hp > 10 ? "heal" : "upgrade",
      );
    } else if (state.phase === "event") {
      state = resolveEvent(state, state.event.choices[1].id);
    } else if (state.phase === "shop") {
      const healing = state.shopItems.find(
        (item) => item.id === "treatment" && !item.sold,
      );
      const card = state.shopItems.find(
        (item) =>
          item.kind === "card" && !item.sold && state.player.coins >= item.cost,
      );
      if (
        healing &&
        state.player.coins >= healing.cost &&
        state.player.maxHp - state.player.hp > 10
      )
        state = buyItem(state, healing.id);
      else if (card) state = buyItem(state, card.id);
      else state = leaveShop(state);
    }
  }
  return state;
}

test("all ten wrestlers can complete a real eight-floor run using only public actions", () => {
  for (const id of Object.keys(WRESTLERS)) {
    for (const seed of [20903, 424242]) {
      const result = strategicRun(id, seed);
      const label = `${id}/${seed}`;
      assert.equal(result.phase, "victory", label);
      assert.equal(result.floor, 8, label);
      assert.equal(result.history.length, 8, label);
      assert.ok(result.stats.enemiesDefeated >= 3, label);
      assert.ok(result.stats.cardsPlayed > 20, label);
      assert.ok(
        result.deck.some((card) => card.upgraded),
        label,
      );
    }
  }
});

test("ignoring the opponent leads to an actual defeat without invalid negative health", () => {
  let state = newRun();
  for (let turn = 0; turn < 100 && state.phase === "combat"; turn++)
    state = endTurn(state);
  assert.equal(state.phase, "defeat");
  assert.equal(state.player.hp, 0);
  assert.ok(state.turn < 100);
});
