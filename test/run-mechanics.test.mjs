import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/game.js";
export function select(s) {
  return s.hand
    .filter((c) => g.canPlayCard(s, c))
    .map((c) => {
      const e = g.getCard(c).effects;
      const d = g.getCardDamage(s, c);
      let score =
        d >= s.enemy.hp + s.enemy.block
          ? 10000
          : (d * 2) / Math.max(1, g.getCard(c).cost);
      if (e.block && s.enemy.intent.type === "attack")
        score +=
          Math.max(
            0,
            Math.min(
              e.block + (e.counterBlock || 0),
              s.enemy.intent.value - s.player.block,
            ),
          ) * 3;
      score += (e.draw || 0) * 6 + (e.energy || 0) * 12;
      if (e.hype && s.player.hype < 3) score += e.hype * 10;
      score +=
        Math.min(e.calm || 0, s.player.stress) * 0.3 +
        (e.weak || 0) * (s.enemy.intent.type === "attack" ? 5 : 2);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.c;
}
export function run(actor, seed, policy = "balanced", stopAtFloor = null) {
  let s = g.newRun(actor, seed);
  let earned = 0,
    damage = 0;
  const priority = [
    "championship",
    "quickdraw",
    "doubletap",
    "steelwill",
    "powerbomb",
    "sharpshooter",
    "armdrag",
    "spinebuster",
    "sitoutpowerbomb",
    "headlock",
    "suplex",
    "spotlight",
  ];
  for (let i = 0; i < 1500 && !["victory", "defeat"].includes(s.phase); i++) {
    if (stopAtFloor && s.floor >= stopAtFloor && s.phase === "map") break;
    if (s.phase === "combat") {
      let item = s.inventory.find((x) => {
        const e = g.ITEMS[x.id].effects;
        return (
          (e.heal && s.player.maxHp - s.player.hp >= e.heal) ||
          (e.block &&
            s.enemy.intent.type === "attack" &&
            s.enemy.intent.value - s.player.block >= 6) ||
          (e.energy && s.energy === 0) ||
          (e.hype &&
            s.player.hype < 3 &&
            s.hand.some((c) => g.getCard(c).type === "finisher")) ||
          (e.weak && s.enemy.intent.type === "attack" && !s.enemy.weak) ||
          (e.draw && s.energy > 0 && s.hand.length < 4)
        );
      });
      const c = select(s);
      const old = s;
      s = item
        ? g.useItem(s, item.uid)
        : c
          ? g.playCard(s, c.uid)
          : g.endTurn(s);
      if (s.lastImpact?.attacker === "enemy") damage += s.lastImpact.damage;
      if (old.phase === "combat" && ["reward", "victory"].includes(s.phase))
        earned += s.rewardCoins;
    } else if (s.phase === "reward") {
      for (const kind of ["item", "gimmick"]) {
        const id = s.rewardLoot[kind === "item" ? "items" : "gimmicks"][0];
        if (id) s = g.claimLoot(s, kind, id);
      }
      const rank = (id) => (priority.includes(id) ? priority.indexOf(id) : 999);
      s = g.chooseReward(
        s,
        [...s.rewards].sort((a, b) => rank(a) - rank(b))[0],
      );
    } else if (s.phase === "map") {
      if (s.gimmicks.length && !s.equippedGimmickUid)
        s = g.equipGimmick(s, s.gimmicks[0].uid);
      const types =
        policy === "risk"
          ? ["risk", "elite", "fight", "rest", "shop", "event"]
          : policy === "safe"
            ? ["rest", "shop", "event", "fight", "elite", "risk"]
            : s.player.hp < s.player.maxHp * 0.7
              ? ["rest", "shop", "fight", "event", "elite", "risk"]
              : ["fight", "elite", "rest", "shop", "event", "risk"];
      const n =
        types.map((t) => s.mapNodes.find((x) => x.type === t)).find(Boolean) ||
        s.mapNodes[0];
      s = g.advanceToNode(s, n.id);
    } else if (s.phase === "rest")
      s = g.rest(s, s.player.maxHp - s.player.hp > 10 ? "heal" : "upgrade");
    else if (s.phase === "event") s = g.resolveEvent(s, s.event.choices[1].id);
    else if (s.phase === "shop") {
      const affordable = s.shopItems.filter(
        (x) => !x.sold && s.player.coins >= x.cost,
      );
      const item =
        affordable.find(
          (x) => x.kind === "heal" && s.player.maxHp - s.player.hp > 12,
        ) ||
        affordable.find(
          (x) => x.kind === "card" && priority.includes(x.cardId),
        ) ||
        affordable.find((x) => x.kind === "gimmick" && s.gimmicks.length < 2) ||
        affordable.find((x) => x.kind === "item" && s.inventory.length < 3);
      s = item ? g.buyItem(s, item.id) : g.leaveShop(s);
    }
  }
  return { s, earned, damage };
}

const saved = (state) => JSON.parse(JSON.stringify(state));
function win(state) {
  const current = saved(state);
  current.enemy.hp = 1;
  current.hand = [{ uid: "win", id: "strike", upgraded: false }];
  current.energy = 3;
  return g.playCard(current, "win");
}
function firstMap(seed = 23) {
  return g.chooseReward(win(g.newRun("raven", seed)), null);
}
function plainCombat(actor = "ember") {
  const state = g.newRun(actor, 31337);
  state.activeGimmick = null;
  state.player.block = 0;
  state.player.stress = 20;
  state.player.hp -= 20;
  state.player.hype = 0;
  state.energy = 0;
  state.hand = [{ uid: "hit", id: "strike", upgraded: false }];
  state.draw = [0, 1].map((n) => ({
    uid: `draw-${n}`,
    id: "guard",
    upgraded: false,
  }));
  state.discard = [];
  state.exhaust = [];
  state.inventory = [];
  state.enemy.hp = 500;
  return state;
}

test("the full eight-floor graph has real connected choices, no dead nodes, and a boss path from every node", () => {
  assert.equal(g.ROUTE_GRAPH.nodes.length, 26);
  const ids = new Set(g.ROUTE_GRAPH.nodes.map((n) => n.id));
  assert.equal(ids.size, 26);
  const reachable = new Set(["f1-0"]);
  for (let floor = 1; floor < 8; floor++)
    for (const edge of g.ROUTE_GRAPH.edges) {
      assert.ok(ids.has(edge.from) && ids.has(edge.to));
      const from = g.ROUTE_GRAPH.nodes.find((n) => n.id === edge.from);
      const to = g.ROUTE_GRAPH.nodes.find((n) => n.id === edge.to);
      assert.equal(
        to.floor,
        from.floor + 1,
        "routes never go backward or skip a floor",
      );
      if (reachable.has(edge.from)) reachable.add(edge.to);
    }
  assert.equal(reachable.size, ids.size);
  for (const node of g.ROUTE_GRAPH.nodes) {
    let frontier = [node.id];
    while (frontier.length && !frontier.includes("f8-0"))
      frontier = g.ROUTE_GRAPH.edges
        .filter((e) => frontier.includes(e.from))
        .map((e) => e.to);
    assert.ok(
      frontier.includes("f8-0"),
      `${node.id} can reach the championship`,
    );
  }
  const map = firstMap();
  assert.equal(map.mapNodes.length, 4);
  let left = g.chooseReward(win(g.advanceToNode(map, "f2-0")), null);
  assert.deepEqual(
    left.mapNodes.map((n) => n.id),
    ["f3-0", "f3-1"],
  );
  left.mapNodes.push(g.mapForFloor(3).find((n) => n.id === "f3-2"));
  assert.equal(
    g.advanceToNode(left, "f3-2"),
    left,
    "forged visible offers cannot bypass graph edges",
  );
  const view = g.getRouteView(left);
  assert.equal(view.nodes.filter((n) => n.available).length, 2);
  assert.ok(
    view.edges.some((e) => e.from === "f1-0" && e.to === "f2-0" && e.visited),
  );
  assert.deepEqual(g.getRouteView(saved(left)), view);
});

test("each of six consumables applies its authored effect once for zero energy without triggering card passives", () => {
  assert.equal(Object.keys(g.ITEMS).length, 6);
  for (const id of Object.keys(g.ITEMS)) {
    const state = plainCombat();
    state.inventory = [{ uid: "use-once", id }];
    const old = saved(state),
      e = g.ITEMS[id].effects;
    const next = g.useItem(state, "use-once");
    assert.deepEqual(state, old);
    assert.deepEqual(next, g.useItem(saved(state), "use-once"));
    assert.equal(next.inventory.length, 0);
    assert.equal(g.useItem(next, "use-once"), next);
    assert.equal(next.energy, e.energy || 0);
    assert.equal(next.player.hp, old.player.hp + (e.heal || 0));
    assert.equal(
      next.player.stress,
      old.player.stress - (e.calm || 0) + (e.stress || 0),
    );
    assert.equal(next.player.block, e.block || 0);
    assert.equal(next.player.hype, e.hype || 0);
    assert.equal(next.enemy.weak, e.weak || 0);
    assert.equal(next.enemy.vulnerable, e.vulnerable || 0);
    assert.equal(next.status.nextAttack, e.nextAttack || 0);
    assert.equal(next.hand.length, 1 + (e.draw || 0));
    assert.equal(next.status.crowdUsed, false);
    assert.equal(next.combo, 0);
    assert.equal(next.stats.cardsPlayed, 0);
    assert.deepEqual(next.lastImpact, {
      attacker: "player",
      damage: 0,
      blocked: 0,
      hits: 0,
      type: "item",
      id,
      turn: 1,
    });
  }
  const map = firstMap();
  assert.equal(g.useItem(map, map.inventory[0].uid), map);
  const empty = plainCombat();
  assert.equal(
    g.useItem(empty, "missing"),
    empty,
    "invalid states are not cloned",
  );
});

test("six finite corner gimmicks have genuine tradeoffs, activate once on entry, and expire on either battle result", () => {
  assert.equal(Object.keys(g.GIMMICKS).length, 6);
  for (const [id, definition] of Object.entries(g.GIMMICKS)) {
    let map = firstMap(103);
    map.gimmicks = [
      { uid: "corner", id },
      { uid: "unspent", id: "mindcorner" },
    ];
    const baseline = g.advanceToNode(map, "f2-0");
    map = g.equipGimmick(map, "corner");
    assert.equal(map.gimmicks.length, 2, "staging does not consume stock");
    const state = g.advanceToNode(saved(map), "f2-0");
    assert.equal(state.activeGimmick.id, id);
    assert.equal(state.activeGimmick.duration, "encounter");
    assert.ok(definition.tradeoff.length > 0);
    assert.deepEqual(
      state.gimmicks.map((x) => x.uid),
      ["unspent"],
    );
    assert.equal(state.equippedGimmickUid, null);
    assert.equal(
      g.equipGimmick(state, "unspent"),
      state,
      "loadout is locked during combat",
    );
    if (id === "ironcorner") {
      assert.equal(state.hand.length, 4);
      assert.equal(state.player.block, 9);
    }
    if (id === "spotlightcorner") {
      assert.equal(state.player.hype, 3);
      assert.equal(state.enemy.attack, baseline.enemy.attack + 2);
    }
    if (id === "speedcorner") {
      assert.equal(state.energy, 4);
      state.hand = [{ uid: "guard", id: "guard", upgraded: false }];
      assert.equal(g.playCard(state, "guard").player.block, 4);
    }
    if (id === "grappleclinic") {
      assert.equal(state.player.stress, baseline.player.stress + 8);
      assert.equal(
        g.getCardDamage(state, "grapple"),
        g.getCardDamage(baseline, "grapple") + 3,
      );
    }
    if (id === "icecorner")
      assert.equal(
        g.getCardDamage(state, "strike"),
        g.getCardDamage(baseline, "strike") - 2,
      );
    if (id === "mindcorner")
      assert.equal(state.enemy.maxHp, Math.ceil(baseline.enemy.maxHp * 1.2));
    const reward = win(state);
    assert.equal(reward.activeGimmick, null);
    let next = g.chooseReward(reward, null);
    next = g.advanceToNode(next, "f3-0");
    assert.equal(
      next.activeGimmick,
      null,
      "unreserved stock never activates automatically",
    );
    assert.equal(next.gimmicks[0].uid, "unspent");
    const doomed = saved(state);
    doomed.player.hp = 1;
    doomed.player.block = 0;
    doomed.enemy.weak = 0;
    doomed.enemy.intent = { type: "attack", value: 50 };
    assert.equal(g.endTurn(doomed).phase, "defeat");
    assert.equal(g.endTurn(doomed).activeGimmick, null);
  }
});

test("corner bonuses persist across JSON load within a battle, reset once each turn, and never stack into permanent max energy", () => {
  let map = firstMap();
  map.gimmicks = [{ uid: "speed", id: "speedcorner" }];
  let state = g.advanceToNode(g.equipGimmick(map, "speed"), "f2-0");
  state.enemy.intent = { type: "guard", value: 0 };
  const next = g.endTurn(saved(state));
  assert.equal(next.energy, 4);
  assert.equal(next.maxEnergy, 3);
  assert.deepEqual(next, g.endTurn(state));
  assert.equal(
    g.normalizeRun(saved(next)).energy,
    4,
    "loading cannot grant another turn bonus",
  );
  state = g.chooseReward(win(next), null);
  state = g.advanceToNode(state, "f3-0");
  assert.equal(state.energy, 3);
  assert.equal(state.maxEnergy, 3);
});

test("mental corner suppresses nightmare draws only for its active encounter", () => {
  const state = plainCombat();
  state.inventory = [{ uid: "tape", id: "trainingtape" }];
  state.draw = [{ uid: "bad-dream", id: "nightmare", upgraded: false }];
  assert.equal(g.useItem(state, "tape").player.stress, 23);
  state.activeGimmick = {
    uid: "mind",
    id: "mindcorner",
    duration: "encounter",
  };
  assert.equal(g.useItem(saved(state), "tape").player.stress, 20);
});

test("loot capacity prevents paid empty gains and item/gimmick claims are independent one-time rewards", () => {
  let reward = win(g.newRun());
  reward.rewardLoot = { items: ["resin"], gimmicks: ["icecorner"] };
  reward.inventory = ["icepack", "energygel", "resin"].map((id, n) => ({
    uid: `i-${n}`,
    id,
  }));
  assert.equal(g.claimLoot(reward, "item", "resin"), reward);
  reward = g.claimLoot(reward, "gimmick", "icecorner");
  assert.equal(reward.gimmicks.length, 1);
  assert.deepEqual(reward.rewardLoot, { items: ["resin"], gimmicks: [] });
  assert.equal(g.claimLoot(reward, "gimmick", "icecorner"), reward);
  const discarded = g.chooseReward(reward, null);
  assert.deepEqual(discarded.rewardLoot, { items: [], gimmicks: [] });
  let shop = g.advanceToNode(
    g.rest(g.advanceToNode(firstMap(), "f2-1"), "heal"),
    "f3-2",
  );
  shop.inventory = saved(reward.inventory);
  shop.gimmicks = Array.from({ length: 6 }, (_, n) => ({
    uid: `full-${n}`,
    id: "icecorner",
  }));
  for (const offer of shop.shopItems.filter((x) =>
    ["item", "gimmick"].includes(x.kind),
  )) {
    assert.equal(g.buyItem(shop, offer.id), shop);
  }
  assert.ok(!shop.shopItems.some((x) => x.id === "energy-belt"));
});

test("event physical and credit costs must be affordable, and typed arrival/result data reports actual effects", () => {
  let state = g.advanceToNode(firstMap(), "f2-2");
  assert.equal(state.arrival.nodeId, "f2-2");
  assert.ok(state.arrival.cutscene.artKey.startsWith("events/"));
  state.event = saved(g.EVENTS.find((event) => event.id === "challenge"));
  state.player.hp = 12;
  assert.equal(g.canResolveEventChoice(state, "sign"), false);
  assert.equal(g.resolveEvent(state, "sign"), state);
  state.player.hp = 13;
  const result = g.resolveEvent(saved(state), "sign");
  assert.equal(result.player.hp, 1);
  assert.equal(result.player.coins, state.player.coins + 80);
  assert.equal(result.lastChoice.type, "event");
  assert.ok(result.lastChoice.result.includes("체력 -12"));
  assert.equal(g.resolveEvent(result, "sign"), result);
  state.event = saved(g.EVENTS.find((event) => event.id === "cornercoach"));
  state.player.coins = 29;
  assert.equal(g.resolveEvent(state, "overdrive"), state);
  state.player.coins = 30;
  const paid = g.resolveEvent(state, "overdrive");
  assert.equal(paid.player.coins, 0);
  assert.equal(paid.gimmicks.at(-1).id, "speedcorner");
  state.event = saved(g.EVENTS.find((event) => event.id === "physio"));
  state.inventory = Array.from({ length: 3 }, (_, n) => ({
    uid: `full-${n}`,
    id: "icepack",
  }));
  assert.equal(
    g.resolveEvent(state, "pack"),
    state,
    "an unaffordable empty gain cannot charge HP",
  );
  state = g.advanceToNode(firstMap(), "f2-1");
  state.player.hp -= 7;
  assert.equal(state.arrival.choices.length, 3);
  const rested = g.rest(state, "heal");
  assert.equal(rested.lastChoice.type, "rest");
  assert.ok(rested.lastChoice.result.includes("체력 +7"));
});

test("risk encounters actually pay better than normal and elite encounters, and all six item/gimmick types are offered", () => {
  const items = new Set(),
    gimmicks = new Set();
  for (let seed = 1; seed <= 128; seed++) {
    const map = firstMap(seed);
    const normal = g.advanceToNode(map, "f2-0");
    const risk = g.advanceToNode(map, "f2-3");
    assert.ok(risk.enemy.maxHp > normal.enemy.maxHp);
    assert.ok(risk.enemy.attack > normal.enemy.attack);
    const normalReward = win(normal),
      riskReward = win(risk);
    assert.equal(normalReward.rewardCoins, 35);
    assert.equal(normalReward.rewards.length, 3);
    assert.equal(riskReward.rewardCoins, 95);
    assert.equal(riskReward.rewards.length, 4);
    assert.ok(riskReward.rewards.every((id) => g.CARDS[id].rarity === "rare"));
    assert.equal(riskReward.rewardLoot.items.length, 1);
    assert.equal(riskReward.rewardLoot.gimmicks.length, 1);
    items.add(riskReward.rewardLoot.items[0]);
    gimmicks.add(riskReward.rewardLoot.gimmicks[0]);
    let claimed = g.claimLoot(
      riskReward,
      "item",
      riskReward.rewardLoot.items[0],
    );
    claimed = g.claimLoot(claimed, "gimmick", claimed.rewardLoot.gimmicks[0]);
    assert.equal(claimed.inventory.length, 2);
    assert.equal(claimed.gimmicks.length, 1);
    let throughEvent = g.advanceToNode(map, "f2-2");
    throughEvent = g.resolveEvent(
      throughEvent,
      throughEvent.event.choices[1].id,
    );
    const elite = g.advanceToNode(throughEvent, "f3-1");
    const eliteReward = win(elite);
    assert.equal(eliteReward.rewardCoins, 65);
    assert.ok(
      eliteReward.rewards.every((id) =>
        ["uncommon", "rare"].includes(g.CARDS[id].rarity),
      ),
    );
    assert.equal(eliteReward.rewardLoot.items.length, 1);
    assert.equal(eliteReward.rewardLoot.gimmicks.length, 1);
  }
  assert.deepEqual([...items].sort(), Object.keys(g.ITEMS).sort());
  assert.deepEqual([...gimmicks].sort(), Object.keys(g.GIMMICKS).sort());
});

test("normalizing an older v1 save preserves its exact combat and legacy belt, grants a starter item once, and never rerolls RNG", () => {
  const old = plainCombat("raven");
  for (const key of [
    "mechanicsVersion",
    "inventory",
    "gimmicks",
    "activeGimmick",
    "equippedGimmickUid",
    "rewardLoot",
    "route",
    "arrival",
    "lastChoice",
    "lastImpact",
  ])
    delete old[key];
  old.relics.push({ id: "energy-belt", name: "벨트", description: "에너지+1" });
  old.maxEnergy = old.energy = 4;
  const snapshot = saved(old);
  const normalized = g.normalizeRun(old);
  assert.deepEqual(old, snapshot);
  for (const key of [
    "deck",
    "hand",
    "draw",
    "discard",
    "enemy",
    "player",
    "energy",
    "maxEnergy",
    "seed",
    "phase",
  ])
    assert.deepEqual(normalized[key], old[key], key);
  assert.equal(normalized.inventory.length, 1);
  assert.equal(normalized.activeGimmick, null);
  assert.equal(normalized.relics.at(-1).permanentLegacy, true);
  assert.equal(normalized.relics.at(-1).duration, "run");
  assert.deepEqual(g.normalizeRun(saved(normalized)), normalized);
  const used = g.useItem(normalized, normalized.inventory[0].uid);
  assert.equal(g.normalizeRun(saved(used)).inventory.length, 0);
});

test("support actions overwrite stale impact fields and incoming intent records actual blocked damage", () => {
  const state = plainCombat();
  state.lastImpact = { attacker: "player", damage: 3, blocked: 8, hits: 1 };
  state.inventory = [{ uid: "heal", id: "icepack" }];
  assert.equal(g.useItem(state, "heal").lastImpact.blocked, 0);
  state.energy = 3;
  state.hand = [{ uid: "focus", id: "focus", upgraded: false }];
  assert.equal(g.playCard(state, "focus").lastImpact.hits, 0);
  state.player.block = 5;
  state.enemy.weak = 1;
  state.enemy.intent = { type: "attack", value: 12 };
  assert.deepEqual(g.endTurn(state).lastImpact, {
    attacker: "enemy",
    damage: 4,
    blocked: 5,
    hits: 1,
    type: "attack",
    turn: 1,
  });
  state.enemy.intent.type = "guard";
  assert.deepEqual(g.endTurn(state).lastImpact, {
    attacker: "enemy",
    damage: 0,
    blocked: 0,
    hits: 0,
    type: "guard",
    turn: 1,
  });
});

test("seeded public-action policies keep all ten fighters viable while dangerous routes exchange more damage for better economy", () => {
  const totals = {
    safe: { wins: 0, earned: 0, damage: 0 },
    balanced: { wins: 0, earned: 0, damage: 0 },
    risk: { wins: 0, earned: 0, damage: 0 },
  };
  for (const policy of Object.keys(totals))
    for (const actor of Object.keys(g.WRESTLERS))
      for (const seed of [1, 23, 20903, 424242]) {
        const result = run(actor, seed, policy);
        assert.ok(
          ["victory", "defeat"].includes(result.s.phase),
          `${policy}/${actor}/${seed} terminates`,
        );
        if (policy === "balanced")
          assert.equal(
            result.s.phase,
            "victory",
            `${actor}/${seed} remains beatable`,
          );
        totals[policy].wins += result.s.phase === "victory";
        totals[policy].earned += result.earned;
        totals[policy].damage += result.damage;
        for (let i = 1; i < result.s.route.visited.length; i++)
          assert.ok(
            g.ROUTE_GRAPH.edges.some(
              (e) =>
                e.from === result.s.route.visited[i - 1] &&
                e.to === result.s.route.visited[i],
            ),
          );
        assert.ok(
          result.s.inventory.length <= 3 && result.s.gimmicks.length <= 6,
        );
        assert.equal(result.s.activeGimmick, null);
      }
  assert.ok(
    totals.safe.wins > 0 && totals.risk.wins > 0,
    "both preparation and risk paths can succeed",
  );
  assert.ok(
    totals.risk.damage > totals.balanced.damage * 2,
    "the same decision policy takes materially more damage on high-risk routes",
  );
  assert.ok(
    totals.risk.earned > totals.balanced.earned,
    "high risk pays more even without requiring everyone to win",
  );
  assert.ok(
    totals.safe.earned < totals.balanced.earned,
    "avoiding fights gives up rewards rather than dominating the economy",
  );
});
