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

// Individually inspected garment planes: main upper, main lower, second upper,
// second lower. Each tuple is [x, y, width, height, angle], in source pixels.
// Main panels retain opaque sports lining. The second upper/lower panels
// follow a visible shoulder/side seam and outer hip, clear of intimate cores.
// These bounds were inspected separately for every pose, including occlusions.
const garmentPoses = {
  raven: {
    normal: [
      570, 397, 217, 87, 0, 510, 645, 236, 166, 0, 439, 438, 48, 44, -16, 431,
      628, 100, 106, 12,
    ],
    excited: [
      560, 402, 207, 97, 0, 505, 643, 236, 160, 0, 448, 430, 48, 44, -14, 424,
      625, 95, 106, 12,
    ],
    fiery: [
      585, 437, 186, 91, 0, 495, 660, 236, 166, 0, 468, 469, 52, 36, -8, 407,
      631, 95, 110, 15,
    ],
    frustrated: [
      565, 443, 167, 80, 0, 475, 660, 236, 160, 0, 659, 435, 38, 57, 12, 404,
      622, 90, 100, 13,
    ],
    tired: [
      555, 453, 181, 71, 0, 530, 661, 149, 166, 0, 646, 464, 32, 38, 12, 598,
      680, 80, 118, -22,
    ],
    groggy: [
      565, 482, 161, 43, 0, 545, 640, 140, 127, 0, 650, 469, 42, 40, 15, 335,
      604, 70, 106, 16,
    ],
  },
  valkyrie: {
    normal: [
      538, 401, 222, 62, 0, 570, 645, 158, 108, 0, 468, 308, 30, 76, 17, 445,
      600, 75, 80, 15,
    ],
    excited: [
      535, 402, 218, 62, 0, 550, 640, 149, 98, 0, 435, 414, 44, 45, -12, 428,
      587, 75, 78, 17,
    ],
    fiery: [
      545, 427, 202, 69, 0, 550, 642, 158, 94, 0, 594, 296, 24, 76, -33, 415,
      592, 75, 80, 17,
    ],
    frustrated: [
      515, 409, 198, 66, 0, 490, 609, 222, 81, 0, 584, 293, 25, 75, -32, 413,
      583, 70, 78, 15,
    ],
    tired: [
      540, 448, 155, 52, 0, 588, 620, 119, 70, 0, 445, 322, 34, 86, 4, 482, 580,
      45, 60, 15,
    ],
    groggy: [
      504, 452, 156, 41, 0, 585, 572, 132, 56, 0, 407, 340, 30, 98, -2, 480,
      537, 70, 60, 23,
    ],
  },
  nova: {
    normal: [
      454, 414, 227, 100, 0, 468, 632, 121, 60, 0, 578, 326, 38, 78, -10, 579,
      576, 65, 38, -25,
    ],
    excited: [
      464, 418, 227, 100, 0, 479, 631, 106, 64, 0, 373, 438, 38, 40, -10, 586,
      573, 65, 38, -25,
    ],
    fiery: [
      446, 434, 222, 88, 0, 485, 637, 91, 65, 0, 366, 450, 40, 40, -10, 600,
      574, 65, 37, -27,
    ],
    frustrated: [
      489, 419, 227, 75, 0, 497, 603, 109, 51, 0, 550, 329, 35, 85, -6, 419,
      569, 38, 42, 5,
    ],
    tired: [
      490, 455, 182, 65, 0, 549, 631, 94, 58, 0, 582, 338, 35, 78, -13, 621,
      577, 38, 34, -30,
    ],
    groggy: [
      489, 452, 172, 49, 0, 556, 583, 98, 47, 0, 577, 344, 30, 78, -26, 648,
      523, 55, 42, -35,
    ],
  },
  viper: {
    normal: [
      527, 418, 170, 151, 0, 558, 605, 141, 106, 0, 465, 305, 80, 90, 12, 463,
      603, 94, 65, 21,
    ],
    excited: [
      520, 423, 170, 139, 0, 551, 626, 126, 106, 0, 500, 316, 90, 54, 15, 439,
      614, 90, 60, 17,
    ],
    fiery: [
      510, 429, 183, 144, 0, 525, 625, 126, 83, 0, 520, 306, 86, 62, 18, 421,
      594, 85, 58, 27,
    ],
    frustrated: [
      510, 459, 161, 63, 0, 537, 610, 156, 86, 0, 566, 335, 32, 44, 25, 431,
      602, 88, 60, 22,
    ],
    tired: [
      495, 408, 180, 124, 0, 533, 601, 142, 74, 0, 475, 318, 92, 65, 20, 596,
      590, 74, 58, -25,
    ],
    groggy: [
      531, 405, 181, 121, 0, 488, 553, 97, 56, 0, 557, 316, 88, 76, 15, 552,
      554, 76, 40, -30,
    ],
  },
  ember: {
    normal: [
      534, 439, 218, 73, 0, 545, 679, 166, 74, 0, 622, 330, 22, 82, -28, 414,
      637, 65, 66, 18,
    ],
    excited: [
      533, 432, 218, 73, 0, 533, 665, 162, 66, 0, 625, 326, 22, 82, -28, 408,
      608, 70, 55, 24,
    ],
    fiery: [
      511, 467, 194, 58, 0, 530, 663, 156, 70, -8, 560, 308, 20, 70, -10, 636,
      625, 70, 56, -18,
    ],
    frustrated: [
      514, 456, 218, 49, 0, 519, 658, 138, 57, 0, 565, 316, 22, 86, -22, 427,
      599, 70, 58, 19,
    ],
    tired: [
      510, 456, 199, 66, 0, 524, 649, 156, 69, -4, 619, 343, 22, 85, -22, 411,
      611, 58, 52, 10,
    ],
    groggy: [
      512, 478, 153, 37, -5, 534, 624, 146, 61, -5, 588, 358, 22, 82, -20, 647,
      577, 56, 56, -18,
    ],
  },
  atlas: {
    normal: [
      559, 388, 212, 80, 0, 558, 640, 182, 104, 0, 465, 369, 65, 85, 10, 445,
      601, 75, 87, 19,
    ],
    excited: [
      565, 389, 222, 80, 0, 555, 631, 177, 104, 0, 472, 362, 65, 85, 8, 431,
      593, 75, 84, 20,
    ],
    fiery: [
      558, 424, 218, 76, 0, 540, 644, 171, 90, 0, 458, 409, 65, 72, 10, 403,
      594, 76, 73, 25,
    ],
    frustrated: [
      554, 393, 222, 71, 0, 580, 619, 177, 100, 0, 469, 366, 65, 82, 8, 451,
      572, 70, 70, 25,
    ],
    tired: [
      514, 437, 212, 51, 0, 570, 612, 188, 77, 0, 416, 422, 36, 62, -12, 458,
      576, 60, 60, 22,
    ],
    groggy: [
      536, 436, 197, 51, 0, 575, 615, 178, 76, 0, 445, 417, 45, 65, -9, 461,
      572, 62, 60, 23,
    ],
  },
  seraph: {
    normal: [
      496, 445, 190, 91, 0, 482, 660, 161, 72, 0, 573, 310, 48, 92, 12, 402,
      639, 69, 61, 18,
    ],
    excited: [
      500, 446, 185, 81, 0, 483, 654, 171, 67, 0, 576, 311, 48, 92, 12, 400,
      634, 69, 58, 17,
    ],
    fiery: [
      469, 481, 123, 51, 0, 520, 655, 155, 61, 0, 558, 330, 44, 74, 8, 630, 636,
      60, 42, -15,
    ],
    frustrated: [
      496, 443, 190, 85, 0, 489, 645, 181, 59, 0, 568, 311, 48, 88, 12, 408,
      618, 67, 61, 18,
    ],
    tired: [
      510, 469, 185, 46, 0, 557, 615, 136, 43, 0, 548, 329, 37, 82, -8, 454,
      581, 46, 40, 24,
    ],
    groggy: [
      494, 498, 170, 36, 0, 542, 644, 122, 53, 0, 546, 351, 40, 95, -12, 433,
      601, 50, 40, 25,
    ],
  },
  lynx: {
    normal: [
      510, 381, 201, 130, 0, 515, 603, 212, 95, 0, 476, 299, 86, 76, 20, 613,
      638, 66, 74, -20,
    ],
    excited: [
      529, 381, 201, 130, 0, 536, 603, 182, 104, 0, 480, 302, 86, 76, 22, 438,
      590, 70, 70, 23,
    ],
    fiery: [
      514, 426, 181, 120, 0, 525, 642, 167, 103, 0, 528, 315, 85, 64, 18, 394,
      608, 80, 75, 25,
    ],
    frustrated: [
      514, 378, 176, 129, 0, 528, 601, 182, 93, 0, 484, 296, 80, 72, 20, 435,
      583, 68, 75, 20,
    ],
    tired: [
      504, 396, 175, 136, 0, 532, 590, 213, 72, 0, 490, 318, 90, 90, -5, 610,
      580, 60, 55, -20,
    ],
    groggy: [
      517, 398, 183, 124, 0, 493, 583, 208, 68, 0, 528, 327, 80, 70, 25, 592,
      565, 65, 55, -20,
    ],
  },
  onyx: {
    normal: [
      556, 405, 218, 60, 0, 531, 669, 236, 117, 0, 452, 330, 28, 72, 23, 413,
      671, 80, 110, 20,
    ],
    excited: [
      541, 420, 178, 90, 0, 532, 668, 236, 119, 0, 604, 322, 18, 76, -46, 413,
      670, 80, 110, 20,
    ],
    fiery: [
      535, 445, 180, 83, 0, 536, 676, 236, 126, 0, 587, 298, 24, 76, -40, 393,
      666, 80, 107, 20,
    ],
    frustrated: [
      559, 444, 155, 54, 0, 524, 662, 227, 125, 0, 590, 312, 25, 84, -36, 403,
      657, 80, 107, 20,
    ],
    tired: [
      533, 448, 213, 59, 0, 515, 665, 218, 125, 0, 468, 329, 25, 100, -4, 425,
      592, 58, 78, 15,
    ],
    groggy: [
      541, 465, 182, 52, 0, 534, 664, 218, 118, 0, 465, 345, 25, 94, -4, 630,
      682, 70, 95, -20,
    ],
  },
  tempest: {
    normal: [
      508, 437, 218, 86, 0, 546, 674, 179, 86, 0, 422, 315, 28, 96, -7, 425,
      654, 65, 55, 20,
    ],
    excited: [
      513, 426, 218, 76, 0, 549, 667, 179, 84, 0, 426, 302, 28, 88, -5, 407,
      635, 68, 60, 20,
    ],
    fiery: [
      498, 468, 208, 78, 0, 522, 677, 149, 83, 0, 571, 326, 38, 80, -33, 400,
      620, 75, 52, 24,
    ],
    frustrated: [
      500, 432, 216, 82, 0, 542, 651, 183, 78, 0, 416, 331, 28, 97, -3, 417,
      620, 68, 65, 20,
    ],
    tired: [
      520, 465, 184, 60, 0, 545, 629, 179, 57, 0, 459, 340, 30, 110, 1, 427,
      597, 56, 56, 13,
    ],
    groggy: [
      500, 487, 178, 51, 0, 494, 650, 164, 59, 0, 434, 352, 28, 112, 0, 578,
      629, 48, 58, -20,
    ],
  },
};

// Authored edge directions; a lean can put the anatomical side past centre.
const garmentReleaseSides = {
  raven: {
    normal: [-1, -1],
    excited: [-1, -1],
    fiery: [-1, -1],
    frustrated: [1, -1],
    tired: [1, 1],
    groggy: [1, -1],
  },
  valkyrie: {
    normal: [-1, -1],
    excited: [-1, -1],
    fiery: [1, -1],
    frustrated: [1, -1],
    tired: [-1, -1],
    groggy: [-1, -1],
  },
  nova: {
    normal: [1, 1],
    excited: [-1, 1],
    fiery: [-1, 1],
    frustrated: [1, -1],
    tired: [1, 1],
    groggy: [1, 1],
  },
  viper: {
    normal: [-1, -1],
    excited: [-1, -1],
    fiery: [1, -1],
    frustrated: [1, -1],
    tired: [-1, 1],
    groggy: [1, 1],
  },
  ember: {
    normal: [1, -1],
    excited: [1, -1],
    fiery: [1, 1],
    frustrated: [1, -1],
    tired: [1, -1],
    groggy: [1, 1],
  },
  atlas: {
    normal: [-1, -1],
    excited: [-1, -1],
    fiery: [-1, -1],
    frustrated: [-1, -1],
    tired: [-1, -1],
    groggy: [-1, -1],
  },
  seraph: {
    normal: [1, -1],
    excited: [1, -1],
    fiery: [1, 1],
    frustrated: [1, -1],
    tired: [1, -1],
    groggy: [1, -1],
  },
  lynx: {
    normal: [-1, 1],
    excited: [-1, -1],
    fiery: [1, -1],
    frustrated: [-1, -1],
    tired: [-1, 1],
    groggy: [1, 1],
  },
  onyx: {
    normal: [-1, -1],
    excited: [1, -1],
    fiery: [1, -1],
    frustrated: [1, -1],
    tired: [-1, -1],
    groggy: [-1, 1],
  },
  tempest: {
    normal: [-1, -1],
    excited: [-1, -1],
    fiery: [1, -1],
    frustrated: [-1, -1],
    tired: [-1, -1],
    groggy: [-1, 1],
  },
};

const garmentColors = {
  raven: ["#252c40", "#ca2a3a", "#786e6b"],
  valkyrie: ["#263047", "#e6ddbe", "#79736e"],
  nova: ["#24282a", "#37b1b8", "#746e65"],
  viper: ["#066e54", "#24ae87", "#60716c"],
  ember: ["#211b1c", "#dba849", "#89745f"],
  atlas: ["#34363d", "#e88932", "#807367"],
  seraph: ["#e1e5e5", "#2b5ca2", "#374764"],
  lynx: ["#60305f", "#b0529c", "#746373"],
  onyx: ["#25212d", "#a261df", "#89808e"],
  tempest: ["#15323b", "#3ad7e5", "#779198"],
};

const skinShadows = {
  raven: "#ba7e67",
  valkyrie: "#bd8066",
  nova: "#b87959",
  viper: "#b8755d",
  ember: "#a76545",
  atlas: "#aa704b",
  seraph: "#b77857",
  lynx: "#aa684b",
  onyx: "#754a32",
  tempest: "#925b3c",
};

function garmentZones(actor, condition) {
  const row = garmentPoses[actor][condition];
  const [fabric, accent, lining] = garmentColors[actor];
  return [0, 1, 2, 3].map((index) => {
    const [x, y, width, height, angle] = row.slice(index * 5, index * 5 + 5);
    const area = index % 2 === 0 ? "upper" : "lower";
    return {
      kind: "garment",
      area,
      surface: index < 2 ? "lining" : "side-skin",
      skin: index >= 2,
      ...(index >= 2
        ? {
            deform:
              index === 3 ||
              ["raven", "viper", "atlas", "lynx"].includes(actor) ||
              (actor === "valkyrie" && condition === "excited") ||
              (actor === "nova" && ["excited", "fiery"].includes(condition))
                ? "seam"
                : "strap",
            side: garmentReleaseSides[actor][condition][index - 2],
            skinColor: palettes[actor].skin,
            skinShadow: skinShadows[actor],
          }
        : {}),
      x,
      y,
      width,
      height,
      angle,
      minLevel: index < 2 ? 1 : 2,
      fabric:
        actor === "atlas" && (index === 2 || (index === 3 && x < 505))
          ? "#d97b2e"
          : actor === "seraph" && index === 3
            ? "#2958a2"
            : actor === "lynx" && index === 3
              ? "#30303a"
              : actor === "tempest" && area === "lower"
                ? "#138c9d"
                : fabric,
      accent: actor === "ember" && index === 2 ? "#b62b30" : accent,
      lining,
      thread: actor === "seraph" ? "#c9d3e3" : "#ddd0ba",
    };
  });
}

// Main upper/lower tears retain opaque sports lining over the coverage cores.
// Secondary openings reveal only an inspected shoulder/outer torso or outer
// hip, with a released strap/seam; equipment windows stay at knees/outer thigh.
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
      ...garmentZones(actor, condition),
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
