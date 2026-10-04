import { createCombatQA } from "./combat-qa.js";
import { playCard, chooseReward, advanceToNode, rest } from "./game.js";

// The real App reaches these DEV screens through public game actions. Neither
// this module nor its query entry survives the production DEV guard.
export const JOURNEY_QA_PROFILES = ["map", "rest", "event", "shop"];

export function createJourneyQA(profile = "map") {
  if (!JOURNEY_QA_PROFILES.includes(profile))
    throw new Error(`Unknown journey QA profile: ${profile}`);
  let state = createCombatQA({ hand: 10, impact: "ko" });
  state = playCard(state, state.hand[0].uid);
  if (state.phase !== "reward")
    throw new Error("Journey QA requires a resolved opening victory.");
  state = chooseReward(state, null);
  if (profile !== "map")
    state = advanceToNode(state, profile === "event" ? "f2-2" : "f2-1");
  if (profile === "shop") {
    state = rest(state, "heal");
    state = advanceToNode(state, "f3-2");
  }
  if (state.phase !== profile)
    throw new Error(
      `Journey QA could not reach ${profile} through public actions.`,
    );
  return state;
}
