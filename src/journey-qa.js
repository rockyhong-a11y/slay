import { createCombatQA } from "./combat-qa.js";
import { playCard, chooseReward, advanceToNode } from "./game.js";
import * as game from "./game.js";

// The real App reaches these DEV screens through public game actions. Neither
// this module nor its query entry survives the production DEV guard.
export const JOURNEY_QA_PROFILES = [
  "map",
  "rest",
  "event",
  "shop",
  "wave-clear",
  "victory",
];

function championQA(target = "victory") {
  let state = game.newRun("raven", 23);
  const rewards = [
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
  const rank = (id) => (rewards.includes(id) ? rewards.indexOf(id) : 999);
  // Bounded deterministic play, using exactly the same actions as a player.
  // No phase, HP, resources, deck entries or upgrades are forged for this screen.
  for (
    let step = 0;
    step < 5000 && ![target, "defeat"].includes(state.phase);
    step++
  ) {
    if (state.phase === "wave-clear") {
      state = game.continueToNextWave(state);
    } else if (state.phase === "combat") {
      const item = state.inventory.find((entry) => {
        const effects = game.ITEMS[entry.id].effects;
        return (
          (effects.heal &&
            state.player.maxHp - state.player.hp >= effects.heal) ||
          (effects.block &&
            state.enemy.intent.type === "attack" &&
            state.enemy.intent.value - state.player.block >= 6) ||
          (effects.energy && state.energy === 0) ||
          (effects.hype &&
            state.player.hype < 3 &&
            state.hand.some(
              (card) => game.getCard(card).type === "finisher",
            )) ||
          (effects.weak &&
            state.enemy.intent.type === "attack" &&
            !state.enemy.weak) ||
          (effects.draw && state.energy > 0 && state.hand.length < 4)
        );
      });
      const card = state.hand
        .filter((entry) => game.canPlayCard(state, entry))
        .map((entry) => {
          const definition = game.getCard(entry),
            effects = definition.effects;
          const damage = game.getCardDamage(state, entry);
          let score =
            damage >= state.enemy.hp + state.enemy.block
              ? 10000
              : (damage * 2) / Math.max(1, definition.cost);
          if (effects.block && state.enemy.intent.type === "attack")
            score +=
              Math.max(
                0,
                Math.min(
                  effects.block + (effects.counterBlock || 0),
                  state.enemy.intent.value - state.player.block,
                ),
              ) * 3;
          score += (effects.draw || 0) * 6 + (effects.energy || 0) * 12;
          if (effects.hype && state.player.hype < 3) score += effects.hype * 10;
          score +=
            Math.min(effects.calm || 0, state.player.stress) * 0.3 +
            (effects.weak || 0) *
              (state.enemy.intent.type === "attack" ? 5 : 2);
          return { entry, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.entry;
      state = item
        ? game.useItem(state, item.uid)
        : card
          ? game.playCard(state, card.uid)
          : game.endTurn(state);
    } else if (state.phase === "reward") {
      for (const kind of ["item", "gimmick"]) {
        const id = state.rewardLoot[kind === "item" ? "items" : "gimmicks"][0];
        if (id) state = game.claimLoot(state, kind, id);
      }
      state = game.chooseReward(
        state,
        [...state.rewards].sort((a, b) => rank(a) - rank(b))[0],
      );
    } else if (state.phase === "map") {
      if (state.gimmicks.length && !state.equippedGimmickUid)
        state = game.equipGimmick(state, state.gimmicks[0].uid);
      const next =
        ["rest", "shop", "event", "fight", "elite", "risk"]
          .map((type) => state.mapNodes.find((node) => node.type === type))
          .find(Boolean) || state.mapNodes[0];
      state = game.advanceToNode(state, next.id);
    } else if (state.phase === "rest") {
      state = game.rest(
        state,
        state.player.maxHp - state.player.hp > 10 ? "heal" : "upgrade",
      );
    } else if (state.phase === "event") {
      state = game.resolveEvent(state, state.event.choices[1].id);
    } else if (state.phase === "shop") {
      const affordable = state.shopItems.filter(
        (entry) => !entry.sold && state.player.coins >= entry.cost,
      );
      const offer =
        affordable.find(
          (entry) =>
            entry.kind === "heal" && state.player.maxHp - state.player.hp > 12,
        ) ||
        affordable.find(
          (entry) => entry.kind === "card" && rewards.includes(entry.cardId),
        ) ||
        affordable.find(
          (entry) => entry.kind === "gimmick" && state.gimmicks.length < 2,
        ) ||
        affordable.find(
          (entry) => entry.kind === "item" && state.inventory.length < 3,
        );
      state = offer ? game.buyItem(state, offer.id) : game.leaveShop(state);
    }
  }
  if (state.phase !== target || !state.deck.some((card) => card.upgraded))
    throw new Error(
      "Champion QA requires a real completed run with upgraded cards.",
    );
  return state;
}

export function createJourneyQA(profile = "map") {
  if (!JOURNEY_QA_PROFILES.includes(profile))
    throw new Error(`Unknown journey QA profile: ${profile}`);
  if (["wave-clear", "victory"].includes(profile)) return championQA(profile);
  let state = createCombatQA({ hand: 10, impact: "ko" });
  state = playCard(state, state.hand[0].uid);
  if (state.phase !== "reward")
    throw new Error("Journey QA requires a resolved opening victory.");
  state = chooseReward(state, null);
  if (profile !== "map")
    state = advanceToNode(
      state,
      { event: "f2-2", rest: "f2-1", shop: "f2-4" }[profile],
    );
  if (state.phase !== profile)
    throw new Error(
      `Journey QA could not reach ${profile} through public actions.`,
    );
  return state;
}
