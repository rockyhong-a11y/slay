// Wear is presentation only: no mutation, random numbers, or saved damage state.
export const WEAR_ACTORS = [
  "raven",
  "valkyrie",
  "nova",
  "viper",
  "ember",
  "atlas",
  "seraph",
  "lynx",
  "onyx",
  "tempest",
];
export const WEAR_STATES = [
  "normal",
  "excited",
  "fiery",
  "frustrated",
  "tired",
  "groggy",
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
const previewHealth = {
  normal: 1,
  excited: 0.85,
  fiery: 0.8,
  frustrated: 0.72,
  tired: 0.4,
  groggy: 0.18,
};
const exertion = {
  normal: 0,
  excited: 1,
  fiery: 2,
  frustrated: 2,
  tired: 2,
  groggy: 3,
};

export function parseFighterArt(art) {
  if (typeof art !== "string") return null;
  const match = art.match(/^fighters\/states\/([a-z]+)-([a-z]+)\.webp$/);
  if (
    !match ||
    !WEAR_ACTORS.includes(match[1]) ||
    !WEAR_STATES.includes(match[2])
  )
    return null;
  return {
    actor: match[1],
    condition: match[2],
    key: `${match[1]}-${match[2]}`,
  };
}

export function fighterWearProfile(condition = "normal", vitals) {
  const state = WEAR_STATES.includes(condition) ? condition : "normal";
  const liveHealth =
    Number.isFinite(vitals?.hp) &&
    Number.isFinite(vitals?.maxHp) &&
    vitals.maxHp > 0;
  const ratio = liveHealth
    ? clamp(vitals.hp / vitals.maxHp, 0, 1)
    : previewHealth[state];
  const stress = clamp(
    finite(vitals?.stress, state === "frustrated" ? 75 : 0),
    0,
    100,
  );
  const hype = clamp(
    finite(vitals?.hype, state === "fiery" ? 6 : state === "excited" ? 3 : 0),
    0,
    20,
  );
  const sweat = Math.max(
    exertion[state],
    ratio <= 0.25 ? 3 : ratio <= 0.5 ? 2 : ratio <= 0.85 ? 1 : 0,
    stress >= 60 || hype >= 6 ? 2 : hype >= 3 ? 1 : 0,
  );
  const abrasion = ratio <= 0.25 ? 3 : ratio <= 0.5 ? 2 : ratio <= 0.7 ? 1 : 0;
  const bruise = ratio <= 0.25 ? 2 : ratio <= 0.5 ? 1 : 0;
  const blood = ratio <= 0.1 ? 2 : ratio <= 0.25 ? 1 : 0;
  return {
    condition: state,
    ratio,
    sweat,
    abrasion,
    bruise,
    blood,
    visible: sweat + abrasion + bruise + blood > 0,
  };
}

// Offsets from the existing portrait crop centres to the facial skin plane.
// Fatigued heads lean independently of the body; these offsets were checked
// against the complete source illustrations, not a generic skeleton.
const faceAdjustments = {
  raven: { default: [-5, -9, -7], tired: [-7, -15, -8], groggy: [5, -8, -9] },
  valkyrie: {
    default: [-2, -7, -8],
    tired: [-20, -11, -13],
    groggy: [0, 0, -14],
  },
  nova: {
    default: [-5, -12, -5],
    tired: [-10, -22, -9],
    groggy: [-7, -25, -16],
  },
  viper: { default: [-5, -5, 6], tired: [-12, 4, 18], groggy: [-6, -12, 13] },
  ember: {
    default: [-5, -8, -7],
    tired: [-10, -32, -11],
    groggy: [-19, -25, -11],
  },
  atlas: {
    default: [-1, -8, -9],
    tired: [0, -0.5, -14],
    groggy: [0, 0.5, -13],
  },
  seraph: {
    default: [-2, -4, -5],
    tired: [-7, -11, -13],
    groggy: [2, -19, -13],
  },
  lynx: {
    default: [0, -12, 8],
    fiery: [6, -26, 7],
    tired: [0, -0.5, 11],
    groggy: [0, 0, 13],
  },
  onyx: {
    default: [-9, -12, 9],
    excited: [-33, -12, 9],
    frustrated: [-32, -5, 9],
    tired: [-13, -7, 15],
    groggy: [-8, -14, 17],
  },
  tempest: {
    default: [-3, 5, 8],
    frustrated: [-18, 5, 8],
    fiery: [32, 16, 7],
    tired: [4, -3, 12],
    groggy: [-33, -28, 11],
  },
};

// Bare shoulder surfaces, in the original 1000 × 1500 illustration coordinates.
// Upright / tired / groggy placements keep sweat off clothing and hanging hair.
const shoulders = {
  raven: [
    [400, 275, 660, 335],
    [391, 310, 660, 330],
    [389, 333, 665, 285],
  ],
  valkyrie: [
    [380, 275, 625, 315],
    [373, 317, 650, 295],
    [325, 321, 604, 254],
  ],
  nova: [
    [360, 290, 650, 291],
    [345, 318, 644, 284],
    [289, 335, 633, 254],
  ],
  viper: [
    [352, 309, 620, 330],
    [355, 307, 616, 339],
    [394, 266, 685, 327],
  ],
  ember: [
    [350, 322, 640, 325],
    [337, 326, 659, 306],
    [305, 358, 637, 284],
  ],
  atlas: [
    [377, 279, 656, 301],
    [333, 291, 668, 290],
    [365, 282, 684, 285],
  ],
  seraph: [
    [361, 297, 651, 299],
    [329, 325, 626, 307],
    [306, 334, 615, 326],
  ],
  lynx: [
    [356, 282, 600, 310],
    [351, 285, 637, 311],
    [357, 279, 645, 309],
  ],
  onyx: [
    [363, 288, 620, 318],
    [385, 318, 630, 316],
    [383, 322, 645, 342],
  ],
  tempest: [
    [351, 316, 610, 345],
    [376, 313, 651, 342],
    [368, 332, 642, 335],
  ],
};

export function fighterWearAnchors(art, crop) {
  const parsed = parseFighterArt(art);
  if (
    !parsed ||
    !Array.isArray(crop?.center) ||
    crop.center.length !== 2 ||
    !crop.center.every(Number.isFinite)
  )
    return null;
  const { actor, condition } = parsed;
  const adjustments = faceAdjustments[actor];
  const [dx, dy, tilt] = adjustments[condition] || adjustments.default;
  const points =
    actor === "viper" && condition === "excited"
      ? [345, 303, 592, 317]
      : shoulders[actor][
          condition === "groggy" ? 2 : condition === "tired" ? 1 : 0
        ];
  return {
    ...parsed,
    face: [crop.center[0] * 1000 + dx, crop.center[1] * 1500 + dy],
    tilt,
    faceScaleX: actor === "onyx" ? 0.6 : actor === "tempest" ? 0.8 : 1,
    shoulders: [
      [points[0], points[1]],
      [points[2], points[3]],
    ],
    // Deeper, warmer scuffs remain legible on the darker cartoon skin palettes.
    palette: actor === "onyx" || actor === "tempest" ? "warm" : "light",
  };
}

// The SVG and image share this rectangle. Outer Artwork mirroring then flips
// them together once; neither portrait nor enemy needs a second coordinate map.
export function artworkImageRect({
  width,
  height,
  fit = "contain",
  position = [0.5, 0.5],
  portrait = false,
  crop,
}) {
  if (!(width > 0) || !(height > 0)) return null;
  if (portrait) {
    const field =
      Number.isFinite(crop?.width) && crop.width > 0.05 && crop.width <= 1
        ? crop.width
        : 0.28;
    const center = crop?.center?.length === 2 ? crop.center : [0.5, 0.14];
    const renderedWidth = width / field;
    const renderedHeight = renderedWidth * 1.5;
    return {
      left: width / 2 - center[0] * renderedWidth,
      top: height / 2 - center[1] * renderedHeight,
      width: renderedWidth,
      height: renderedHeight,
    };
  }
  if (fit === "fill") return { left: 0, top: 0, width, height };
  let scale =
    fit === "cover"
      ? Math.max(width / 1000, height / 1500)
      : Math.min(width / 1000, height / 1500);
  if (fit === "none") scale = 1;
  if (fit === "scale-down") scale = Math.min(1, scale);
  const renderedWidth = 1000 * scale;
  const renderedHeight = 1500 * scale;
  return {
    left: (width - renderedWidth) * position[0],
    top: (height - renderedHeight) * position[1],
    width: renderedWidth,
    height: renderedHeight,
  };
}

export function projectWearPoint(
  point,
  rect,
  { mirrored = false, containerWidth = rect?.width } = {},
) {
  if (!rect) return null;
  const x = rect.left + (point[0] * rect.width) / 1000;
  const y = rect.top + (point[1] * rect.height) / 1500;
  return [mirrored ? containerWidth - x : x, y];
}
