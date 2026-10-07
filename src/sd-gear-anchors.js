import { sdSpriteFrame } from "./sd-artwork.js";

// Authored against the original 1774 × 887 RGBA sheets. Each row contains the
// exact manifest crop followed by gear centres in atlas pixels. Converting at
// this boundary keeps all wear in the same local rectangle as the sprite.
// Garment openings retain opaque athletic lining across chest and trunks.
// Skin openings are confined to the previously authored equipment/outer-leg zones.
const z = (kind, x, y, width, height, angle, minLevel, skin = false) => ({
  kind,
  x,
  y,
  width,
  height,
  angle,
  minLevel,
  skin,
});

const palettes = {
  nova: {
    fabric: "#25252d",
    accent: "#ce3046",
    skin: "#f5b487",
    shadow: "#352732",
  },
  raven: {
    fabric: "#34313f",
    accent: "#d63249",
    skin: "#f4b38d",
    shadow: "#33212e",
  },
  valkyrie: {
    fabric: "#25283f",
    accent: "#ede9e9",
    skin: "#efb482",
    shadow: "#302939",
  },
  viper: {
    fabric: "#b92835",
    accent: "#f24a50",
    skin: "#efb28d",
    shadow: "#35282e",
  },
  ember: {
    fabric: "#292427",
    accent: "#e4ac4c",
    skin: "#eeac78",
    shadow: "#392522",
  },
  atlas: {
    fabric: "#2c292c",
    accent: "#ed8031",
    skin: "#eda36d",
    shadow: "#392720",
  },
  seraph: {
    fabric: "#1645bd",
    accent: "#f0edf0",
    skin: "#f1bc94",
    shadow: "#273358",
  },
  lynx: {
    fabric: "#302935",
    accent: "#9950ba",
    skin: "#e9a56c",
    shadow: "#33233e",
  },
  tempest: {
    fabric: "#252b31",
    accent: "#27b4c7",
    skin: "#db9858",
    shadow: "#33292a",
  },
  onyx: {
    fabric: "#2e2935",
    accent: "#9854b5",
    skin: "#cb8c5d",
    shadow: "#3a2730",
  },
};

// Materials that differ from the actor's main boot/gear colour.
const materials = {
  viper: { pad: { fabric: "#2d2931", accent: "#77717f" } },
  valkyrie: {
    fabric: { fabric: "#ede9e9", accent: "#ffffff" },
    strap: { fabric: "#ede9e9", accent: "#ffffff" },
  },
};

// Source-pixel garment rectangles follow the exposed cloth, including poses in
// which the arms cover most of the shirt. All chest/trunk tears reveal opaque
// cool-coloured sports lining, never skin. Four large patches balance the upper
// and lower garment; their original outer contours remain fully intact.
const garment = (area, x, y, width, height, angle, minLevel, colors = {}) => ({
  kind: "garment",
  area,
  x,
  y,
  width,
  height,
  angle,
  minLevel,
  skin: false,
  lining: "#56616e",
  thread: "#c2c9d2",
  ...colors,
});
const garmentMaterials = {
  nova: { fabric: "#292a31", accent: "#46c1d8" },
  raven: { fabric: "#34313f", accent: "#a1a5b1" },
  valkyrie: { fabric: "#25283f", accent: "#d3d6df" },
  viper: { fabric: "#087661", accent: "#64ceb6" },
  ember: { fabric: "#292427", accent: "#b99b68" },
  atlas: { fabric: "#2c292c", accent: "#c88448" },
  seraph: { fabric: "#1845ab", accent: "#bacbe7" },
  lynx: { fabric: "#302935", accent: "#9f7bab" },
  tempest: { fabric: "#15899d", accent: "#60c0cb" },
  onyx: { fabric: "#2e2935", accent: "#ae92bf" },
};
const whiteKit = {
  fabric: "#e4e5ef",
  accent: "#2258d3",
  lining: "#4a648f",
  thread: "#f4f4ff",
};
const garments = {
  nova: [
    [
      garment("upper", 327, 498, 104, 43, 0, 1),
      garment("upper", 381, 480, 31, 37, 14, 2),
      garment("lower", 316, 574, 80, 47, -3, 1),
      garment("lower", 267, 548, 48, 19, -16, 2),
    ],
    [
      garment("upper", 950, 509, 96, 39, 5, 1),
      garment("upper", 891, 500, 38, 32, -12, 2),
      garment("lower", 919, 578, 76, 46, -13, 1),
      garment("lower", 855, 544, 48, 20, -18, 2),
    ],
    [
      garment("upper", 1538, 502, 53, 27, 8, 1),
      garment("upper", 1500, 477, 29, 42, -12, 2),
      garment("lower", 1480, 573, 65, 40, -12, 1),
      garment("lower", 1417, 545, 47, 21, -10, 2),
    ],
  ],
  raven: [
    [
      garment("upper", 304, 510, 95, 44, 4, 1),
      garment("upper", 378, 501, 70, 47, -13, 2),
      garment("lower", 252, 614, 100, 76, 12, 1),
      garment("lower", 395, 626, 112, 61, -18, 2),
    ],
    [
      garment("upper", 903, 523, 98, 43, -5, 1),
      garment("upper", 975, 507, 71, 45, -13, 2),
      garment("lower", 895, 632, 100, 75, 15, 1),
      garment("lower", 1039, 629, 113, 61, 20, 2),
    ],
    [
      garment("upper", 1569, 496, 65, 43, -12, 1),
      garment("upper", 1436, 476, 20, 44, -9, 2),
      garment("lower", 1441, 603, 94, 73, 10, 1),
      garment("lower", 1554, 628, 101, 57, 17, 2),
    ],
  ],
  valkyrie: [
    [
      garment("upper", 265, 480, 95, 49, 7, 1),
      garment("upper", 342, 480, 69, 42, -8, 2),
      garment("lower", 283, 589, 98, 60, -4, 1),
      garment("lower", 202, 556, 67, 29, -15, 2),
    ],
    [
      garment("upper", 916, 494, 110, 50, -2, 1),
      garment("upper", 998, 498, 36, 31, -13, 2),
      garment("lower", 956, 605, 96, 62, -8, 1),
      garment("lower", 861, 574, 68, 26, 14, 2),
    ],
    [
      garment("upper", 1417, 445, 34, 44, 22, 1),
      garment("upper", 1495, 477, 42, 24, -18, 2),
      garment("lower", 1472, 604, 80, 57, -7, 1),
      garment("lower", 1391, 568, 60, 26, -13, 2),
    ],
  ],
  viper: [
    [
      garment("upper", 285, 451, 112, 94, 0, 1),
      garment("upper", 326, 504, 68, 24, -4, 2),
      garment("lower", 297, 582, 83, 65, 0, 1),
      garment("lower", 224, 551, 62, 23, -13, 2),
    ],
    [
      garment("upper", 944, 485, 96, 60, -5, 1),
      garment("upper", 844, 462, 32, 69, -8, 2),
      garment("lower", 902, 596, 82, 65, 14, 1),
      garment("lower", 829, 562, 70, 25, 3, 2),
    ],
    [
      garment("upper", 1483, 443, 86, 54, -16, 1),
      garment("upper", 1441, 430, 33, 49, 15, 2),
      garment("lower", 1554, 554, 84, 27, 5, 1),
      garment("lower", 1498, 598, 32, 36, 21, 2),
    ],
  ],
  ember: [
    [
      garment("upper", 327, 506, 70, 49, -11, 1),
      garment("upper", 239, 508, 55, 40, 17, 2),
      garment("lower", 300, 602, 90, 57, 2, 1),
      garment("lower", 228, 561, 52, 22, -34, 2),
    ],
    [
      garment("upper", 894, 512, 76, 43, -8, 1),
      garment("upper", 824, 516, 45, 33, 12, 2),
      garment("lower", 921, 607, 87, 55, -8, 1),
      garment("lower", 1003, 562, 56, 25, 27, 2),
    ],
    [
      garment("upper", 1482, 502, 57, 22, -16, 1),
      garment("upper", 1416, 480, 26, 41, -25, 2),
      garment("lower", 1424, 588, 87, 48, 6, 1),
      garment("lower", 1362, 557, 51, 28, -21, 2),
    ],
  ],
  atlas: [
    [
      garment("upper", 322, 492, 74, 53, -12, 1),
      garment("upper", 232, 496, 57, 34, 14, 2),
      garment("lower", 295, 605, 94, 55, 1, 1),
      garment("lower", 374, 559, 59, 27, 35, 2),
    ],
    [
      garment("upper", 974, 484, 98, 49, -16, 1),
      garment("upper", 877, 498, 61, 28, 10, 2),
      garment("lower", 917, 605, 95, 59, -4, 1),
      garment("lower", 831, 562, 65, 29, -26, 2),
    ],
    [
      garment("upper", 1486, 475, 63, 25, 24, 1),
      garment("upper", 1553, 498, 33, 27, -17, 2),
      garment("lower", 1484, 617, 60, 55, 22, 1),
      garment("lower", 1407, 582, 87, 34, 8, 2),
    ],
  ],
  seraph: [
    [
      garment("upper", 346, 518, 68, 62, 8, 1, whiteKit),
      garment("upper", 243, 518, 50, 53, -18, 2, whiteKit),
      garment("lower", 322, 628, 78, 52, -5, 1, whiteKit),
      garment("lower", 401, 596, 56, 25, -26, 2),
    ],
    [
      garment("upper", 999, 520, 66, 49, -10, 1, whiteKit),
      garment("upper", 918, 522, 73, 32, 8, 2),
      garment("lower", 932, 627, 70, 54, -5, 1, whiteKit),
      garment("lower", 844, 589, 76, 29, -15, 2),
    ],
    [
      garment("upper", 1495, 506, 47, 36, 24, 1, whiteKit),
      garment("upper", 1573, 518, 37, 22, -13, 2, whiteKit),
      garment("lower", 1520, 616, 70, 40, -7, 1, whiteKit),
      garment("lower", 1423, 593, 56, 26, -21, 2),
    ],
  ],
  lynx: [
    [
      garment("upper", 331, 514, 112, 86, -3, 1),
      garment("upper", 253, 524, 53, 48, -14, 2),
      garment("lower", 308, 647, 98, 56, -12, 1),
      garment("lower", 215, 612, 72, 25, -15, 2),
    ],
    [
      garment("upper", 884, 516, 104, 64, 5, 1),
      garment("upper", 979, 538, 37, 36, -14, 2),
      garment("lower", 906, 654, 84, 59, 6, 1),
      garment("lower", 830, 626, 73, 41, 18, 2),
    ],
    [
      garment("upper", 1488, 501, 87, 46, 5, 1),
      garment("upper", 1445, 482, 22, 48, 6, 2),
      garment("lower", 1500, 639, 88, 50, -13, 1),
      garment("lower", 1409, 609, 72, 29, -14, 2),
    ],
  ],
  tempest: [
    [
      garment("upper", 366, 553, 79, 46, -12, 1),
      garment("upper", 270, 548, 57, 39, 11, 2),
      garment("lower", 332, 648, 78, 48, -3, 1),
      garment("lower", 253, 610, 60, 24, -23, 2),
    ],
    [
      garment("upper", 936, 549, 84, 47, -10, 1),
      garment("upper", 859, 537, 47, 34, 14, 2),
      garment("lower", 941, 651, 74, 45, -14, 1),
      garment("lower", 865, 600, 55, 24, 32, 2),
    ],
    [
      garment("upper", 1575, 544, 43, 31, -18, 1),
      garment("upper", 1488, 533, 27, 35, -10, 2),
      garment("lower", 1529, 635, 68, 36, -18, 1),
      garment("lower", 1429, 604, 54, 25, -7, 2),
    ],
  ],
  onyx: [
    [
      garment("upper", 282, 524, 119, 51, 4, 1),
      garment("upper", 354, 516, 38, 48, 3, 2),
      garment("lower", 295, 631, 101, 53, -5, 1),
      garment("lower", 212, 591, 65, 30, -13, 2),
    ],
    [
      garment("upper", 875, 524, 101, 35, 7, 1),
      garment("upper", 985, 532, 36, 32, -17, 2),
      garment("lower", 888, 640, 94, 54, -3, 1),
      garment("lower", 811, 589, 70, 29, 10, 2),
    ],
    [
      garment("upper", 1560, 561, 42, 32, -18, 1),
      garment("upper", 1493, 522, 29, 34, 18, 2),
      garment("lower", 1469, 632, 75, 43, -8, 1),
      garment("lower", 1390, 599, 67, 28, -15, 2),
    ],
  ],
};

const sheets = {
  nova: [
    [
      [75, 147, 424, 621],
      [
        z("pad", 228, 635, 48, 30, 15, 1),
        z("strap", 218, 468, 33, 17, 35, 2),
        z("strap", 453, 453, 30, 14, -14, 3, true),
        z("pad", 432, 638, 52, 38, -20, 2, true),
        z("boot", 190, 685, 39, 18, 16, 3),
        z("boot", 418, 715, 37, 19, -7, 4),
      ],
    ],
    [
      [648, 150, 449, 619],
      [
        z("pad", 823, 643, 48, 30, 18, 1),
        z("strap", 960, 449, 32, 18, 87, 2),
        z("strap", 937, 449, 22, 13, 87, 3, true),
        z("pad", 1019, 638, 50, 38, -22, 2, true),
        z("boot", 767, 691, 39, 18, 31, 3),
        z("boot", 1008, 717, 37, 19, -8, 4),
      ],
    ],
    [
      [1261, 175, 437, 598],
      [
        z("pad", 1427, 649, 46, 28, 4, 1),
        z("strap", 1527, 535, 30, 16, 78, 2),
        z("strap", 1508, 530, 22, 12, 78, 3, true),
        z("pad", 1580, 644, 48, 38, -21, 2, true),
        z("boot", 1385, 700, 36, 17, 31, 3),
        z("boot", 1586, 724, 37, 19, -19, 4),
      ],
    ],
  ],
  raven: [
    [
      [17, 106, 541, 725],
      [
        z("pad", 218, 687, 53, 34, 22, 1),
        z("strap", 226, 478, 36, 18, 34, 2),
        z("strap", 463, 472, 31, 15, -16, 3, true),
        z("pad", 452, 669, 60, 42, -20, 2, true),
        z("boot", 157, 751, 44, 22, 23, 3),
        z("boot", 435, 743, 43, 22, -5, 4),
        z("fabric", 248, 616, 47, 34, 60, 3, true),
      ],
    ],
    [
      [581, 108, 596, 723],
      [
        z("pad", 837, 696, 54, 34, 29, 1),
        z("strap", 1149, 417, 30, 18, 81, 2),
        z("strap", 804, 514, 32, 14, 30, 3, true),
        z("pad", 1105, 676, 60, 42, -20, 2, true),
        z("boot", 770, 754, 44, 22, 33, 3),
        z("boot", 1081, 751, 43, 22, -5, 4),
        z("fabric", 886, 632, 44, 34, 60, 3, true),
      ],
    ],
    [
      [1219, 113, 538, 718],
      [
        z("pad", 1447, 685, 53, 34, 12, 1),
        z("strap", 1556, 543, 32, 18, 74, 2),
        z("strap", 1537, 535, 24, 13, 74, 3, true),
        z("pad", 1625, 681, 58, 42, -15, 2, true),
        z("boot", 1379, 753, 44, 22, 28, 3),
        z("boot", 1619, 747, 43, 22, -6, 4),
        z("fabric", 1434, 599, 42, 31, 58, 3, true),
      ],
    ],
  ],
  valkyrie: [
    [
      [14, 7, 523, 878],
      [
        z("pad", 163, 701, 57, 36, 18, 1),
        z("fabric", 164, 452, 38, 22, 33, 2),
        z("strap", 415, 443, 32, 18, -18, 3, true),
        z("pad", 425, 697, 68, 46, -22, 2, true),
        z("boot", 118, 771, 43, 22, 24, 3),
        z("boot", 422, 786, 43, 23, -15, 4),
      ],
    ],
    [
      [651, 8, 583, 874],
      [
        z("pad", 798, 685, 60, 39, 29, 1),
        z("fabric", 814, 378, 40, 23, 84, 2),
        z("strap", 816, 534, 32, 18, 24, 3, true),
        z("pad", 1099, 708, 68, 46, -25, 2, true),
        z("boot", 756, 773, 45, 22, 27, 3),
        z("boot", 1132, 789, 44, 23, -27, 4),
      ],
    ],
    [
      [1286, 38, 479, 845],
      [
        z("pad", 1438, 688, 56, 37, 14, 1),
        z("fabric", 1405, 505, 38, 22, 80, 2),
        z("strap", 1436, 518, 30, 18, 80, 3, true),
        z("pad", 1611, 718, 66, 46, -27, 2, true),
        z("boot", 1395, 773, 44, 22, 11, 3),
        z("boot", 1681, 790, 43, 23, -25, 4),
      ],
    ],
  ],
  viper: [
    [
      [2, 13, 547, 855],
      [
        z("pad", 196, 676, 58, 37, 15, 1),
        z("strap", 146, 747, 40, 18, 20, 2),
        z("boot", 114, 741, 27, 14, 16, 3, true),
        z("pad", 441, 668, 68, 48, -22, 2, true),
        z("boot", 457, 744, 41, 21, -8, 3),
        z("boot", 113, 794, 40, 23, 18, 4),
      ],
    ],
    [
      [593, 21, 587, 843],
      [
        z("pad", 785, 688, 58, 37, 24, 1),
        z("strap", 723, 750, 40, 18, 29, 2),
        z("boot", 696, 739, 27, 14, 28, 3, true),
        z("pad", 1038, 671, 66, 46, -26, 2, true),
        z("boot", 1045, 743, 41, 21, -8, 3),
        z("boot", 686, 793, 40, 23, 26, 4),
      ],
    ],
    [
      [1219, 35, 553, 827],
      [
        z("pad", 1378, 660, 58, 37, 16, 1),
        z("strap", 1334, 731, 40, 18, 19, 2),
        z("boot", 1311, 719, 27, 14, 16, 3, true),
        z("pad", 1544, 699, 70, 48, -18, 2, true),
        z("boot", 1608, 768, 41, 21, -24, 3),
        z("boot", 1309, 782, 40, 23, 14, 4),
      ],
    ],
  ],
  ember: [
    [
      [7, 47, 555, 792],
      [
        z("pad", 165, 672, 52, 32, 25, 1),
        z("strap", 161, 476, 35, 18, 30, 2),
        z("strap", 466, 459, 30, 15, -16, 3, true),
        z("pad", 434, 677, 62, 42, -27, 2, true),
        z("boot", 135, 730, 44, 21, 21, 3),
        z("boot", 465, 753, 44, 22, -22, 4),
      ],
    ],
    [
      [565, 67, 623, 772],
      [
        z("pad", 814, 675, 52, 32, 26, 1),
        z("strap", 1128, 397, 32, 18, 77, 2),
        z("strap", 759, 510, 28, 14, 27, 3, true),
        z("pad", 1068, 689, 64, 44, -25, 2, true),
        z("boot", 747, 745, 44, 21, 29, 3),
        z("boot", 1101, 749, 44, 22, -25, 4),
      ],
    ],
    [
      [1193, 62, 573, 779],
      [
        z("pad", 1389, 681, 51, 32, 9, 1),
        z("strap", 1433, 525, 32, 18, 80, 2),
        z("strap", 1415, 520, 22, 13, 80, 3, true),
        z("pad", 1571, 689, 62, 44, -27, 2, true),
        z("boot", 1345, 746, 43, 21, 23, 3),
        z("boot", 1633, 763, 43, 22, -29, 4),
      ],
    ],
  ],
  atlas: [
    [
      [42, 44, 506, 814],
      [
        z("pad", 162, 682, 53, 35, 13, 1),
        z("strap", 158, 432, 38, 19, 32, 2),
        z("strap", 445, 443, 31, 17, -18, 3, true),
        z("pad", 429, 698, 68, 46, -21, 2, true),
        z("boot", 142, 754, 45, 21, 9, 3),
        z("boot", 473, 775, 43, 23, -23, 4),
      ],
    ],
    [
      [619, 43, 538, 814],
      [
        z("pad", 762, 686, 54, 35, 23, 1),
        z("strap", 1054, 389, 31, 18, 78, 2),
        z("strap", 803, 493, 29, 17, 82, 3, true),
        z("pad", 1048, 669, 64, 44, -28, 2, true),
        z("boot", 695, 752, 44, 21, 25, 3),
        z("boot", 1049, 768, 43, 23, -6, 4),
      ],
    ],
    [
      [1269, 46, 469, 811],
      [
        z("pad", 1424, 707, 56, 36, 10, 1),
        z("strap", 1507, 520, 34, 18, 81, 2),
        z("strap", 1555, 557, 30, 17, 65, 3, true),
        z("pad", 1639, 666, 64, 44, -28, 2, true),
        z("boot", 1352, 769, 44, 21, 31, 3),
        z("boot", 1638, 772, 43, 23, -6, 4),
      ],
    ],
  ],
  seraph: [
    [
      [19, 5, 539, 869],
      [
        z("pad", 179, 690, 58, 35, 20, 1),
        z("fabric", 167, 465, 36, 22, 21, 2),
        z("strap", 491, 488, 30, 17, -16, 3, true),
        z("pad", 446, 712, 68, 46, -24, 2, true),
        z("boot", 152, 766, 42, 22, 10, 3),
        z("boot", 486, 790, 43, 23, -24, 4),
      ],
    ],
    [
      [581, 11, 591, 861],
      [
        z("pad", 813, 708, 59, 37, 27, 1),
        z("fabric", 1090, 458, 36, 22, 79, 2),
        z("strap", 823, 535, 29, 17, 77, 3, true),
        z("pad", 1057, 691, 66, 46, -26, 2, true),
        z("boot", 734, 774, 44, 22, 32, 3),
        z("boot", 1063, 791, 43, 23, -11, 4),
      ],
    ],
    [
      [1220, 6, 542, 867],
      [
        z("pad", 1477, 697, 57, 36, 5, 1),
        z("fabric", 1522, 557, 35, 21, 84, 2),
        z("strap", 1544, 559, 27, 16, 84, 3, true),
        z("pad", 1618, 717, 66, 46, -23, 2, true),
        z("boot", 1416, 770, 43, 22, 19, 3),
        z("boot", 1651, 793, 43, 23, -22, 4),
      ],
    ],
  ],
  lynx: [
    [
      [44, 57, 480, 798],
      [
        z("pad", 170, 720, 48, 28, 16, 1),
        z("strap", 193, 501, 38, 19, 31, 2),
        z("strap", 468, 516, 31, 17, -14, 3, true),
        z("pad", 426, 711, 58, 40, -19, 2, true),
        z("boot", 137, 775, 40, 20, 20, 3),
        z("boot", 430, 785, 40, 21, -6, 4),
      ],
    ],
    [
      [637, 68, 537, 785],
      [
        z("pad", 762, 737, 47, 28, 27, 1),
        z("strap", 1109, 467, 31, 18, 79, 2),
        z("strap", 771, 572, 26, 16, 20, 3, true),
        z("pad", 1061, 711, 58, 40, -23, 2, true),
        z("boot", 713, 782, 40, 20, 26, 3),
        z("boot", 1058, 787, 40, 21, -7, 4),
      ],
    ],
    [
      [1288, 81, 480, 775],
      [
        z("pad", 1416, 728, 48, 28, 9, 1),
        z("strap", 1445, 551, 34, 18, 84, 2),
        z("strap", 1465, 556, 25, 15, 84, 3, true),
        z("pad", 1625, 711, 58, 40, -22, 2, true),
        z("boot", 1366, 784, 40, 20, 26, 3),
        z("boot", 1625, 785, 40, 21, -8, 4),
      ],
    ],
  ],
  tempest: [
    [
      [13, 79, 569, 781],
      [
        z("pad", 198, 696, 54, 32, 17, 1),
        z("strap", 193, 519, 34, 18, 30, 2),
        z("strap", 502, 525, 29, 16, -20, 3, true),
        z("pad", 458, 702, 64, 44, -22, 2, true),
        z("boot", 173, 772, 42, 20, 11, 3),
        z("boot", 494, 791, 43, 22, -24, 4),
      ],
    ],
    [
      [590, 86, 615, 777],
      [
        z("pad", 821, 701, 53, 32, 21, 1),
        z("strap", 1141, 478, 30, 17, 80, 2),
        z("strap", 789, 537, 26, 16, 80, 3, true),
        z("pad", 1067, 719, 60, 42, -28, 2, true),
        z("boot", 747, 775, 42, 20, 26, 3),
        z("boot", 1107, 798, 43, 22, -26, 4),
      ],
    ],
    [
      [1216, 99, 545, 763],
      [
        z("pad", 1468, 708, 53, 32, 8, 1),
        z("strap", 1507, 589, 31, 18, 67, 2),
        z("strap", 1524, 593, 22, 14, 67, 3, true),
        z("pad", 1607, 726, 60, 42, -27, 2, true),
        z("boot", 1410, 782, 42, 20, 23, 3),
        z("boot", 1627, 798, 43, 22, -21, 4),
      ],
    ],
  ],
  onyx: [
    [
      [16, 48, 521, 824],
      [
        z("pad", 175, 706, 51, 33, 18, 1),
        z("strap", 173, 460, 36, 19, 33, 2),
        z("strap", 487, 504, 30, 17, -20, 3, true),
        z("pad", 425, 699, 64, 44, -22, 2, true),
        z("boot", 146, 778, 42, 21, 13, 3),
        z("boot", 447, 792, 42, 23, -18, 4),
      ],
    ],
    [
      [590, 50, 545, 818],
      [
        z("pad", 768, 705, 53, 33, 24, 1),
        z("strap", 1078, 448, 30, 18, 78, 2),
        z("strap", 789, 544, 28, 16, 24, 3, true),
        z("pad", 1028, 685, 62, 44, -26, 2, true),
        z("boot", 685, 779, 42, 21, 31, 3),
        z("boot", 1012, 792, 42, 23, -5, 4),
      ],
    ],
    [
      [1189, 91, 568, 779],
      [
        z("pad", 1411, 719, 54, 33, 8, 1),
        z("strap", 1480, 570, 31, 18, 81, 2),
        z("strap", 1500, 575, 24, 15, 81, 3, true),
        z("pad", 1580, 716, 60, 44, -24, 2, true),
        z("boot", 1356, 788, 42, 21, 29, 3),
        z("boot", 1618, 801, 42, 23, -24, 4),
      ],
    ],
  ],
};

/** Centres and dimensions in the actual pose rectangle, in source pixels. */
export function sdGearWearAnchors(actor, frame = 0) {
  const frames = sheets[actor];
  const index = Number.isInteger(frame) ? frame : sdSpriteFrame(frame);
  if (!frames || index < 0 || index > 2) return null;
  const [[left, top, width, height], zones] = frames[index];
  return {
    actor,
    frame: index,
    source: { x: left, y: top, width, height },
    viewBox: [width, height],
    palette: { ...palettes[actor] },
    zones: [...zones, ...(garments[actor]?.[index] || [])].map((zone) => ({
      ...(zone.kind === "garment" ? garmentMaterials[actor] : null),
      ...zone,
      ...materials[actor]?.[zone.kind],
      x: zone.x - left,
      y: zone.y - top,
    })),
  };
}
