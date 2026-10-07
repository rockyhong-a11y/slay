import { gearWearProfile } from "./gear-wear.js";
import { selectFighterState } from "./presentation.js";

const hasStoredWear = (fighter) =>
  fighter != null && Object.hasOwn(fighter, "gearWearLevel");

function currentLevel(fighter, enemy, reset = false) {
  if (!fighter) return 0;
  const vitals = reset ? { ...fighter, gearWearLevel: 0 } : fighter;
  return gearWearProfile(selectFighterState(fighter, { enemy }).id, vitals)
    .level;
}

function beginsBattle(previous, next) {
  if (next.phase !== "combat" || !previous) return false;
  return (
    previous.phase !== "combat" ||
    previous.player?.id !== next.player?.id ||
    previous.enemy?.id !== next.enemy?.id ||
    previous.wave !== next.wave ||
    previous.floor !== next.floor ||
    previous.route?.currentNodeId !== next.route?.currentNodeId ||
    next.turn < previous.turn ||
    // Engine actions clone the player and preserve this field. A fresh newRun
    // deliberately has no cosmetic history, even for the same opening match.
    (hasStoredWear(previous.player) && !hasStoredWear(next.player))
  );
}

function withWear(fighter, previous, enemy, reset) {
  if (!fighter) return fighter;
  const earlierLevel =
    !reset && previous?.id === fighter.id ? currentLevel(previous, enemy) : 0;
  const gearWearLevel = Math.max(
    earlierLevel,
    currentLevel(fighter, enemy, reset),
  );
  return fighter.gearWearLevel === gearWearLevel
    ? fighter
    : { ...fighter, gearWearLevel };
}

/** Restore cosmetic history from a save, or infer its initial level for an old save. */
export function initializeGearWear(state) {
  return trackGearWear(null, state);
}

/**
 * Keep the highest visible gear damage until the next battle. Only the two
 * gearWearLevel fields are added/updated; all combat values retain their values.
 * Feed raw newRun results here so a same-character restart clears old history.
 */
export function trackGearWear(previous, next) {
  if (!next) return next;
  const reset = beginsBattle(previous, next);
  const player = withWear(next.player, previous?.player, false, reset);
  const enemy = withWear(next.enemy, previous?.enemy, true, reset);
  if (player === next.player && enemy === next.enemy) return next;
  return { ...next, player, enemy };
}
