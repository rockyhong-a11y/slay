import { newRun } from "./game.js";

// Explicit, isolated DEV fixtures exercise the real App and Card controls.
// The loader/save guard uses import.meta.env.DEV; these profiles never replace
// a saved run and are not entry points in the production build.
export function createCombatQA(profile = {}) {
  const options = typeof profile === "object" ? profile : { hand: profile };
  const count = Number(options.hand) === 10 ? 10 : 5;
  const state = newRun("viper", 20903);
  const ids = [
    "strike",
    "guard",
    "headlock",
    "powerbomb",
    "armbar",
    "sitoutpowerbomb",
    "sidewalkslam",
    "kimura",
    "anklelock",
    "championship",
  ];
  state.hand = ids
    .slice(0, count)
    .map((id, index) => ({ id, uid: `qa-hand-${index + 1}`, upgraded: false }));
  state.deck = structuredClone(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.phase = "combat";
  state.turn = 1;
  state.energy = state.maxEnergy = 10;
  state.player.hp = state.player.maxHp;
  state.player.block = options.impact === "guard" ? 30 : 0;
  state.player.hype = 2;
  state.player.stress = 0;
  state.combo = 0;
  state.activeGimmick = null;
  state.equippedGimmickUid = null;
  state.gimmicks = [];
  state.enemy.hp = state.enemy.maxHp = options.impact === "ko" ? 1 : 100;
  state.enemy.block = 0;
  state.enemy.weak = state.enemy.vulnerable = 0;
  state.enemy.intent = { type: "attack", value: 18 };
  state.lastImpact = null;
  state.arrival = null;
  state.lastChoice = null;
  state.log = [];
  return state;
}
