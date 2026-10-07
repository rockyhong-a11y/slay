import { newRun, WRESTLERS } from "./game.js";

// Explicit, isolated DEV fixtures exercise the real App and Card controls.
// The loader/save guard uses import.meta.env.DEV; these profiles never replace
// a saved run and are not entry points in the production build.
export function createCombatQA(profile = {}) {
  const options = typeof profile === "object" ? profile : { hand: profile };
  const count = Number(options.hand) === 10 ? 10 : 5;
  const actor = Object.hasOwn(WRESTLERS, options.actor)
    ? options.actor
    : "viper";
  const state = newRun(actor, 20903);
  const sdUtility = options.impact === "sdutility";
  const utility = options.impact === "utility" || sdUtility;
  const ids = sdUtility
    ? [
        "wristlock",
        "hammerlock",
        "omoplata",
        "octopushold",
        "surfboard",
        "stf",
        "toehold",
        "calfslicer",
        "bowandarrow",
        "abdominalstretch",
      ]
    : utility
      ? [
          "collartie",
          "powerbomb",
          "waistlock",
          "armbar",
          "kimura",
          "americana",
          "heelhook",
          "headlock",
          "anklelock",
          "guard",
        ]
      : [
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
  if (options.impact === "submission") state.hand[0].id = "figurefour";
  state.deck = structuredClone(state.hand);
  state.draw = utility
    ? ["guard", "strike", "headlock", "anklelock"].map((id, index) => ({
        id,
        uid: `qa-reserve-${index}`,
        upgraded: false,
      }))
    : [];
  state.deck.push(...structuredClone(state.draw));
  state.discard = [];
  state.exhaust = [];
  state.phase = "combat";
  state.turn = 1;
  state.energy = state.maxEnergy = utility ? 3 : 10;
  state.player.hp = state.player.maxHp;
  state.player.block = options.impact === "guard" ? 30 : 0;
  state.player.hype = 2;
  state.player.stress = 0;
  const previewCondition = {
    excited: { hype: 4 },
    fiery: { hype: 8 },
    frustrated: { stress: 75 },
    tired: { hp: Math.ceil(state.player.maxHp * 0.4) },
    groggy: { hp: Math.floor(state.player.maxHp * 0.2) },
    critical: { hp: Math.max(1, Math.floor(state.player.maxHp * 0.08)) },
  }[options.condition];
  if (previewCondition) Object.assign(state.player, previewCondition);
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
