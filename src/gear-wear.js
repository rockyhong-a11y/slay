import { WEAR_ACTORS, WEAR_STATES } from "./fighter-wear.js";

export const GEAR_WEAR_ACTORS = WEAR_ACTORS;
export const GEAR_WEAR_STATES = WEAR_STATES;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const previewLevels = {
  normal: 0,
  excited: 0,
  fiery: 1,
  frustrated: 2,
  tired: 3,
  groggy: 4,
};

// Pure presentation data. Pose, live combat pressure, and a caller-owned peak
// can each advance wear. This also preserves enemy debuff poses at healthy HP.
export function gearWearProfile(condition = "normal", vitals) {
  const state = WEAR_STATES.includes(condition) ? condition : "normal";
  const liveHealth =
    Number.isFinite(vitals?.hp) &&
    Number.isFinite(vitals?.maxHp) &&
    vitals.maxHp > 0;
  const ratio = liveHealth ? clamp(vitals.hp / vitals.maxHp, 0, 1) : 1;
  const healthLevel = ratio <= 0.25 ? 4 : ratio <= 0.5 ? 3 : 0;
  const stressLevel =
    Number.isFinite(vitals?.stress) && vitals.stress >= 60 ? 2 : 0;
  const hypeLevel = Number.isFinite(vitals?.hype) && vitals.hype >= 6 ? 1 : 0;
  const retainedLevel = Number.isFinite(vitals?.gearWearLevel)
    ? clamp(Math.floor(vitals.gearWearLevel), 0, 4)
    : 0;
  const level = Math.max(
    previewLevels[state],
    healthLevel,
    stressLevel,
    hypeLevel,
    retainedLevel,
  );
  return {
    condition: state,
    level,
    visible: level > 0,
    fray: level,
    split: Math.max(0, level - 1),
    loosen: Math.max(0, level - 1),
  };
}

const palettes = {
  raven: {
    fabric: "#252c40",
    accent: "#d62e43",
    skin: "#efb89c",
    shadow: "#10121d",
  },
  valkyrie: {
    fabric: "#263047",
    accent: "#e6ddbe",
    skin: "#f1bd9e",
    shadow: "#101421",
  },
  nova: {
    fabric: "#292d2f",
    accent: "#37b1b8",
    skin: "#f0b28b",
    shadow: "#151719",
  },
  viper: {
    fabric: "#252a32",
    accent: "#ed303d",
    skin: "#efac8e",
    shadow: "#11171e",
  },
  ember: {
    fabric: "#242122",
    accent: "#ddad47",
    skin: "#db976b",
    shadow: "#160e12",
  },
  atlas: {
    fabric: "#303238",
    accent: "#e88932",
    skin: "#dda073",
    shadow: "#14171e",
  },
  seraph: {
    fabric: "#254e9c",
    accent: "#e8edf1",
    skin: "#edb38e",
    shadow: "#152647",
  },
  lynx: {
    fabric: "#34303d",
    accent: "#9b3a83",
    skin: "#df9d75",
    shadow: "#1b1425",
  },
  onyx: {
    fabric: "#2d2a38",
    accent: "#a261df",
    skin: "#a5714f",
    shadow: "#161321",
  },
  tempest: {
    fabric: "#23353c",
    accent: "#3ad7e5",
    skin: "#c68755",
    shadow: "#102029",
  },
};

// Each row was authored against its original 1000 × 1500 state illustration,
// reviewed together in six-state contact sheets. These are patch CENTRES:
// [left knee, right knee, left boot cuff, right boot], each [x, y, angle].
// Raven's left patch is lower outer-thigh fabric instead of a separate pad.
// Knees and cuffs move independently as fighters bend and spread their legs;
// deliberately do not derive these coordinates from face or torso anchors.
const poses = {
  raven: {
    normal: [390, 805, -10, 675, 988, -18, 301, 1155, 12, 724, 1250, -14],
    excited: [408, 797, -9, 716, 973, -20, 326, 1145, 13, 758, 1230, -14],
    fiery: [377, 806, -9, 740, 960, -21, 294, 1140, 14, 775, 1200, -9],
    frustrated: [397, 812, -9, 674, 980, -15, 315, 1155, 11, 745, 1250, -13],
    tired: [405, 882, -7, 697, 970, -16, 327, 1140, 10, 741, 1230, -11],
    groggy: [350, 800, -9, 736, 961, -15, 277, 1115, 11, 801, 1230, -13],
  },
  valkyrie: {
    normal: [350, 970, 20, 670, 978, -13, 275, 1165, 14, 748, 1250, -10],
    excited: [380, 935, 22, 700, 945, -14, 305, 1145, 14, 720, 1210, -8],
    fiery: [340, 940, 23, 708, 950, -15, 267, 1155, 14, 751, 1195, -9],
    frustrated: [360, 945, 22, 678, 970, -15, 285, 1160, 14, 758, 1260, -11],
    tired: [395, 925, 22, 710, 937, -10, 320, 1135, 17, 785, 1240, -4],
    groggy: [415, 865, 20, 772, 874, -15, 330, 1080, 15, 850, 1170, -5],
  },
  nova: {
    normal: [375, 975, -5, 680, 1000, -18, 377, 1130, -2, 758, 1250, -10],
    excited: [340, 960, -5, 670, 977, -22, 350, 1100, -2, 772, 1230, -8],
    fiery: [280, 945, -14, 675, 970, -26, 320, 1070, -5, 768, 1235, -10],
    frustrated: [353, 955, -3, 682, 991, -24, 355, 1100, -3, 780, 1240, -8],
    tired: [380, 970, -3, 690, 975, -19, 365, 1120, 3, 775, 1235, -7],
    groggy: [380, 960, -5, 775, 950, -21, 350, 1120, 7, 850, 1200, -6],
  },
  viper: {
    normal: [355, 945, 22, 657, 970, -9, 270, 1120, 11, 705, 1230, -11],
    excited: [380, 935, 22, 705, 945, -9, 300, 1120, 13, 740, 1210, -8],
    fiery: [355, 905, 23, 716, 936, -13, 220, 1090, 17, 753, 1135, -6],
    frustrated: [355, 930, 23, 695, 950, -9, 270, 1110, 15, 744, 1200, -9],
    tired: [420, 945, 18, 665, 930, -7, 330, 1100, 14, 717, 1190, -8],
    groggy: [330, 908, 8, 710, 890, -11, 235, 1040, 12, 750, 1150, -9],
  },
  ember: {
    normal: [345, 990, 16, 658, 1000, -12, 268, 1155, 10, 735, 1250, -11],
    excited: [375, 955, 19, 702, 970, -13, 300, 1120, 12, 752, 1220, -10],
    fiery: [304, 900, 24, 675, 965, -16, 295, 1050, -3, 785, 1200, -13],
    frustrated: [360, 975, 17, 638, 975, -10, 305, 1140, 12, 724, 1230, -10],
    tired: [420, 950, 17, 682, 970, -17, 335, 1130, 12, 757, 1220, -13],
    groggy: [350, 930, 20, 730, 915, -13, 290, 1100, 13, 796, 1190, -7],
  },
  atlas: {
    normal: [350, 975, 16, 690, 975, -7, 275, 1170, 10, 751, 1250, -12],
    excited: [360, 955, 19, 700, 970, -7, 285, 1150, 11, 753, 1240, -12],
    fiery: [342, 930, 20, 720, 925, -12, 257, 1110, 11, 750, 1180, -8],
    frustrated: [367, 945, 21, 696, 970, -6, 300, 1140, 13, 752, 1230, -12],
    tired: [330, 915, 20, 693, 955, -8, 255, 1120, 13, 746, 1210, -13],
    groggy: [338, 920, 19, 735, 935, -6, 250, 1120, 13, 775, 1210, -13],
  },
  seraph: {
    normal: [385, 995, 0, 680, 995, -18, 370, 1160, -2, 752, 1250, -8],
    excited: [390, 970, 0, 680, 995, -17, 373, 1170, -3, 757, 1260, -8],
    fiery: [325, 945, 1, 680, 965, -20, 340, 1100, -5, 764, 1210, -9],
    frustrated: [380, 955, -2, 680, 965, -23, 380, 1130, -3, 775, 1230, -10],
    tired: [411, 930, -4, 755, 935, -15, 409, 1130, 0, 828, 1210, -9],
    groggy: [325, 930, -4, 720, 945, -17, 305, 1130, 2, 807, 1210, -9],
  },
  lynx: {
    normal: [356, 950, 18, 697, 960, -7, 275, 1160, 11, 747, 1240, -11],
    excited: [371, 945, 22, 693, 960, -8, 280, 1155, 13, 753, 1240, -11],
    fiery: [350, 925, 22, 735, 940, -12, 255, 1120, 10, 785, 1195, -8],
    frustrated: [360, 945, 20, 687, 960, -7, 300, 1160, 13, 742, 1240, -10],
    tired: [340, 915, 21, 665, 940, -8, 275, 1120, 11, 729, 1220, -9],
    groggy: [345, 900, 19, 715, 895, -8, 260, 1095, 12, 765, 1175, -9],
  },
  onyx: {
    normal: [370, 990, 21, 707, 990, -8, 295, 1200, 8, 738, 1270, -9],
    excited: [375, 990, 22, 710, 975, -8, 290, 1185, 8, 733, 1250, -9],
    fiery: [360, 970, 21, 727, 960, -10, 280, 1180, 8, 753, 1220, -8],
    frustrated: [385, 980, 22, 714, 980, -8, 297, 1180, 9, 748, 1260, -10],
    tired: [360, 973, 23, 665, 960, -8, 297, 1180, 10, 737, 1250, -9],
    groggy: [425, 990, 24, 722, 970, -7, 333, 1190, 10, 760, 1250, -9],
  },
  tempest: {
    normal: [350, 995, 18, 680, 995, -12, 268, 1140, 9, 737, 1250, -10],
    excited: [347, 975, 19, 672, 995, -12, 275, 1140, 10, 750, 1250, -10],
    fiery: [332, 960, 21, 722, 955, -15, 275, 1110, 11, 765, 1220, -9],
    frustrated: [350, 960, 20, 672, 960, -11, 278, 1120, 11, 752, 1230, -10],
    tired: [340, 935, 21, 650, 935, -12, 250, 1090, 11, 730, 1210, -10],
    groggy: [325, 945, 22, 715, 945, -13, 240, 1110, 12, 770, 1210, -10],
  },
};

// Fabric patches fit wholly inside the inspected pads or Raven's leggings.
// No anchor is placed on the torso, waistband, trunks, or a clothing closure.
// Small windows therefore expose only knee / outer lower thigh, while both
// mandatory coverage regions retain their original illustration unchanged.
// Enlarged patches stay readable at 180px figure width. Viper's groggy left
// patch is flatter and lower than the other pads to clear the resting fingers.
export function gearWearAnchors(actor, condition = "normal") {
  if (!WEAR_ACTORS.includes(actor) || !WEAR_STATES.includes(condition))
    return null;
  const row = poses[actor][condition];
  const zone = (offset, data) => ({
    x: row[offset],
    y: row[offset + 1],
    angle: row[offset + 2],
    ...data,
  });
  return {
    actor,
    condition,
    viewBox: [1000, 1500],
    palette: { ...palettes[actor] },
    zones: [
      zone(6, {
        kind: "strap",
        area: "shin",
        width: 52,
        height: 20,
        skin: false,
        minLevel: 1,
      }),
      zone(0, {
        kind: actor === "raven" ? "fabric" : "pad",
        area: actor === "raven" ? "outer-thigh" : "knee",
        width: actor === "raven" ? 90 : 82,
        height:
          actor === "raven"
            ? 52
            : actor === "viper" && condition === "groggy"
              ? 40
              : 44,
        skin: true,
        minLevel: 2,
      }),
      zone(9, {
        kind: "boot",
        area: "shin",
        width: 42,
        height: 46,
        skin: false,
        minLevel: 3,
      }),
      zone(3, {
        kind: actor === "raven" ? "fabric" : "pad",
        area: "knee",
        width: 70,
        height: 42,
        skin: true,
        minLevel: 4,
      }),
    ],
  };
}
