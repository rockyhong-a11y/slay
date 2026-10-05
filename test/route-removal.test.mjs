import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/game.js";

const copy = (state) => JSON.parse(JSON.stringify(state));
function win(current) {
  const state = copy(current);
  state.enemy.hp = 1;
  state.enemy.block = 0;
  state.hand = [{ uid: "winning-strike", id: "strike", upgraded: false }];
  state.energy = 3;
  return g.playCard(state, "winning-strike");
}
const firstMap = () => g.chooseReward(win(g.newRun("raven", 631)), null);
const visit = (kind) => {
  const map = firstMap();
  return g.advanceToNode(
    map,
    map.mapNodes.find((node) => node.type === kind).id,
  );
};

test("every complete route has at least four pre-boss fights, with optional extra risk and reachable support branches", () => {
  const { nodes, edges } = g.ROUTE_GRAPH;
  assert.equal(nodes.length, 38);
  assert.equal(nodes.filter((node) => node.floor === 2).length, 6);
  const routes = [];
  const explore = (id, fights, path) => {
    const node = nodes.find((entry) => entry.id === id);
    if (node.type === "boss") return routes.push({ fights, path });
    const count =
      fights + Number(["fight", "elite", "risk"].includes(node.type));
    for (const edge of edges.filter((entry) => entry.from === id))
      explore(edge.to, count, [...path, node]);
  };
  explore("f1-0", 0, []);
  assert.ok(
    routes.length > 500,
    "real branches produce distinct complete paths",
  );
  assert.equal(Math.min(...routes.map((route) => route.fights)), 4);
  assert.equal(Math.max(...routes.map((route) => route.fights)), 7);
  for (const route of routes) {
    assert.ok(route.fights >= g.MIN_PRE_BOSS_COMBATS);
    for (const floor of [1, 3, 5, 7])
      assert.ok(
        ["fight", "elite", "risk"].includes(
          route.path.find((node) => node.floor === floor).type,
        ),
      );
  }
  for (const kind of ["shop", "rest", "event"])
    assert.ok(
      routes.some(
        (route) =>
          route.fights === 4 && route.path.some((node) => node.type === kind),
      ),
    );
  const view = g.getRouteView(firstMap());
  assert.equal(view.minPreBossCombats, 4);
  assert.equal(view.completedCombats, 1);
  assert.equal(view.laneCount, 6);
  assert.equal(view.stageLabels[7], "최종 예선");
});

test("a support-seeking player must actually win four encounters before entering the final", () => {
  let state = firstMap();
  for (let step = 0; step < 30 && state.enemy?.type !== "boss"; step++) {
    if (state.phase === "combat") state = win(state);
    else if (state.phase === "reward") state = g.chooseReward(state, null);
    else if (state.phase === "map") {
      const option = ["shop", "event", "rest", "fight", "elite", "risk", "boss"]
        .map((kind) => state.mapNodes.find((node) => node.type === kind))
        .find(Boolean);
      state = g.advanceToNode(state, option.id);
    } else if (state.phase === "shop") state = g.leaveShop(state);
    else if (state.phase === "rest") state = g.rest(state, "heal");
    else if (state.phase === "event")
      state = g.resolveEvent(state, state.event.choices[1].id);
  }
  assert.equal(state.enemy.type, "boss");
  assert.equal(state.stats.enemiesDefeated, 4);
  assert.equal(state.floor, 8);
});

test("legacy support-heavy progress migrates once to the earned qualifier stage without losing the run", () => {
  const original = visit("shop");
  delete original.route.version;
  original.floor = 7;
  original.route.currentNodeId = "f7-2";
  original.route.visited = [
    "f1-0",
    "f2-2",
    "f3-2",
    "f4-2",
    "f5-2",
    "f6-2",
    "f7-2",
  ];
  original.history.push({ floor: 7, type: "shop", label: "프로 숍" });
  const before = copy(original);
  const migrated = g.normalizeRun(original);
  assert.deepEqual(original, before);
  assert.equal(migrated.floor, 2);
  assert.equal(migrated.route.currentNodeId, "f2-4");
  assert.equal(migrated.route.version, g.ROUTE_VERSION);
  assert.equal(migrated.route.migratedFrom.floor, 7);
  for (const key of [
    "player",
    "deck",
    "hand",
    "draw",
    "discard",
    "exhaust",
    "seed",
    "shopItems",
    "phase",
    "history",
    "stats",
  ])
    assert.deepEqual(migrated[key], original[key], key);
  assert.deepEqual(g.normalizeRun(copy(migrated)), migrated);
  const resumed = g.leaveShop(migrated);
  assert.ok(
    resumed.mapNodes.every((node) =>
      ["fight", "elite", "risk"].includes(node.type),
    ),
  );
  assert.ok(resumed.mapNodes.every((node) => node.floor === 3));
});

test("legacy active encounters and finals retain their exact opponent, piles, seed and phase", () => {
  for (const final of [false, true]) {
    const original = g.advanceToNode(firstMap(), "f2-0");
    original.floor = final ? 8 : 7;
    delete original.route.version;
    original.route.currentNodeId = final ? "f8-0" : "f7-0";
    if (final) original.enemy.type = "boss";
    const migrated = g.normalizeRun(original);
    assert.equal(migrated.floor, final ? 8 : 3);
    for (const key of [
      "enemy",
      "player",
      "deck",
      "hand",
      "draw",
      "discard",
      "exhaust",
      "phase",
      "seed",
      "energy",
      "turn",
      "status",
    ])
      assert.deepEqual(migrated[key], original[key], key);
  }
});

test("shop removal pays once and removes only the selected duplicate card instance from every pile", () => {
  const state = visit("shop");
  const target = state.deck.find((card) => card.id === "strike");
  const other = state.deck.find(
    (card) => card.id === "strike" && card.uid !== target.uid,
  );
  for (const pile of ["hand", "draw", "discard", "exhaust"])
    state[pile] = [copy(target), copy(other)];
  const before = copy(state);
  const offer = g.getCardRemovalOffer(state);
  assert.equal(offer.cost, 60);
  assert.equal(offer.available, true);
  const next = g.removeDeckCard(state, target.uid);
  assert.deepEqual(state, before);
  assert.deepEqual(next, g.removeDeckCard(copy(state), target.uid));
  assert.equal(next.phase, "shop");
  assert.equal(next.player.coins, state.player.coins - 60);
  assert.equal(next.deck.length, state.deck.length - 1);
  for (const pile of ["deck", "hand", "draw", "discard", "exhaust"]) {
    assert.ok(!next[pile].some((card) => card.uid === target.uid), pile);
    assert.ok(
      next[pile].some((card) => card.uid === other.uid),
      pile,
    );
  }
  assert.ok(next.lastChoice.result.some((line) => line.includes("영구 제거")));
  assert.equal(g.getCardRemovalOffer(next).remaining, 0);
  assert.equal(g.removeDeckCard(next, other.uid), next);
  assert.equal(
    g.removeDeckCard(copy(next), target.uid).deck.length,
    next.deck.length,
  );
  const map = g.leaveShop(next);
  assert.equal(g.getCardRemovalOffer(map), null);
  assert.equal(g.removeDeckCard(map, other.uid), map);
});

test("removal prices rise only after paid removals, and insufficient funds, missing UIDs and minimum deck size cannot spend resources", () => {
  const state = visit("shop");
  state.deckRemoval.shopPurchases = 2;
  assert.equal(g.getCardRemovalOffer(state).cost, 100);
  state.player.coins = 99;
  assert.equal(g.removeDeckCard(state, state.deck[0].uid), state);
  state.player.coins = 100;
  assert.equal(g.removeDeckCard(state, "missing-uid"), state);
  const paid = g.removeDeckCard(state, state.deck[0].uid);
  assert.equal(paid.player.coins, 0);
  assert.equal(paid.deckRemoval.shopPurchases, 3);
  const rest = visit("rest");
  rest.deck = rest.deck.slice(0, 5);
  assert.equal(g.getCardRemovalOffer(rest).available, false);
  assert.equal(g.removeDeckCard(rest, rest.deck[0].uid), rest);
  rest.deck.push({ uid: "sixth", id: "nightmare", upgraded: false });
  const trimmed = g.removeDeckCard(rest, "sixth");
  assert.equal(trimmed.deck.length, 5);
  assert.equal(trimmed.phase, "map");
});

test("locker room and each backstage event exchange their entire choice for one permanent removal", () => {
  for (const kind of ["rest", "event"]) {
    const cases = kind === "event" ? g.EVENTS : [null];
    for (const event of cases) {
      const state = visit(kind);
      if (event) state.event = copy(event);
      const uid = state.deck[0].uid;
      const choice =
        kind === "event"
          ? state.event.choices.find((entry) => entry.effects.removeCard)
          : g.getRestChoices(state).find((entry) => entry.effects.removeCard);
      assert.equal(choice.id, "remove-card");
      assert.equal(g.getCardRemovalOffer(state).cost, 0);
      if (event) {
        assert.equal(g.canResolveEventChoice(state, choice.id), true);
        assert.equal(
          g.resolveEvent(state, choice.id),
          state,
          "no effect until a concrete card is selected",
        );
      }
      const next = g.removeDeckCard(state, uid);
      assert.equal(next.phase, "map");
      assert.equal(next.event, null);
      assert.equal(next.deck.length, state.deck.length - 1);
      assert.deepEqual(next.player, { ...state.player, block: 0 });
      assert.equal(next.deckRemoval.shopPurchases, 0);
      assert.equal(g.resolveEvent(next, event?.choices[0].id), next);
      assert.equal(g.rest(next, "heal"), next);
      assert.equal(g.removeDeckCard(next, next.deck[0].uid), next);
    }
  }
});

test("meditation and shop nightmare cleansing also scrub all piles and preserve the five-card minimum", () => {
  for (const kind of ["rest", "shop"]) {
    const state = visit(kind);
    const nightmare = { uid: "bad-dream", id: "nightmare", upgraded: false };
    state.deck.push(nightmare);
    state.draw.push(copy(nightmare));
    state.discard.push(copy(nightmare));
    state.exhaust.push(copy(nightmare));
    const next =
      kind === "rest" ? g.rest(state, "meditate") : g.buyItem(state, "clarity");
    for (const pile of ["deck", "hand", "draw", "discard", "exhaust"])
      assert.ok(!next[pile].some((card) => card.uid === nightmare.uid));
    state.deck = [...state.deck.slice(0, 4), nightmare];
    const minimal =
      kind === "rest" ? g.rest(state, "meditate") : g.buyItem(state, "clarity");
    assert.equal(minimal.deck.length, 5);
  }
});

test("archived deck blueprints start a fresh encounter with fresh UIDs and preserved upgrades", () => {
  const blueprint = ["strike", "guard", "focus", "finisher", "kimura"].map(
    (id, index) => ({ id, upgraded: index % 2 === 0, uid: `old-${index}` }),
  );
  const before = copy(blueprint);
  const run = g.newRun("lynx", 777, blueprint);
  assert.deepEqual(blueprint, before);
  assert.deepEqual(
    run.deck.map(({ id, upgraded }) => ({ id, upgraded })),
    blueprint.map(({ id, upgraded }) => ({ id, upgraded })),
  );
  assert.equal(new Set(run.deck.map((card) => card.uid)).size, 5);
  assert.ok(run.deck.every((card) => !card.uid.startsWith("old-")));
  assert.equal(run.player.coins, 80);
  assert.equal(run.player.hp, g.WRESTLERS.lynx.maxHp);
  assert.equal(run.floor, 1);
  assert.equal(run.stats.enemiesDefeated, 0);
  assert.ok(
    [...run.hand, ...run.draw].every((card) =>
      run.deck.some(
        (entry) =>
          entry.uid === card.uid &&
          entry.id === card.id &&
          entry.upgraded === card.upgraded,
      ),
    ),
  );
  assert.deepEqual(run, g.newRun("lynx", 777, copy(blueprint)));
  for (const invalid of [
    [],
    blueprint.slice(0, 4),
    Array(81).fill(blueprint[0]),
    [{ id: "unknown", upgraded: false }, ...blueprint],
    [{ id: "strike", upgraded: "yes" }, ...blueprint],
  ])
    assert.equal(g.newRun("lynx", 777, invalid).deck.length, 11);
});
