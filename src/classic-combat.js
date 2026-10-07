import { sdActorId, sdCombatFrame } from "./sd-combat.js";
import { sdBodyBounds, sdScreenPoint } from "./sd-artwork.js";

// Union of the six 1000×1500 illustrations for each actor, measured at alpha
// >16 with an eight-pixel safety margin. Only transparent gutters are reframed;
// every illustration and its wear layers remain one intact drawing.
export const CLASSIC_BODY_CROPS = Object.freeze({
  viper: [78, 4, 858, 1496],
  raven: [161, 0, 776, 1498],
  nova: [189, 0, 749, 1500],
  valkyrie: [152, 1, 784, 1499],
  ember: [161, 1, 759, 1497],
  atlas: [108, 1, 836, 1498],
  seraph: [134, 0, 773, 1500],
  lynx: [98, 0, 854, 1500],
  tempest: [122, 0, 786, 1500],
  onyx: [173, 0, 733, 1500],
});
const finite = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function classicBodyRatio(actor) {
  const [, , width, height] = CLASSIC_BODY_CROPS[sdActorId(actor)];
  return width / height;
}

export function classicArtworkStyle(actor, mirrored = false) {
  const [x, y, width, height] = CLASSIC_BODY_CROPS[sdActorId(actor)];
  const left = mirrored ? 1000 - x - width : x;
  return {
    width: `${(1000 / width) * 100}%`,
    height: `${(1500 / height) * 100}%`,
    left: `${(-left / width) * 100}%`,
    top: `${(-y / height) * 100}%`,
  };
}

export function classicCombatFrame(cue, progress, options = {}) {
  const frame = sdCombatFrame(cue, progress, options);
  const width = Math.max(1, finite(options.width, 600));
  const height = Math.max(1, finite(options.height, 400));
  // Rest at the arena's quarter points, filling its height. On engagement the
  // actors close into the same physical choreography as SD, then return home.
  const home = clamp((width / height) * 0.8, 0.94, 2.9);
  const contacts = options.incoming
    ? [0.29]
    : (cue?.camera?.impacts || []).filter(
        (value) => Number.isFinite(value) && value > 0 && value < 0.92,
      );
  const first = contacts.length ? Math.min(...contacts) : 0.55;
  const last = contacts.length ? Math.max(...contacts) : 0.55;
  const duration = Math.max(300, finite(cue?.duration, 2600));
  const hold = Math.min(
    0.1,
    Math.max(0, finite(cue?.camera?.hitstop, 80)) / duration,
  );
  const recovery = Math.min(0.88, Math.max(last + hold + 0.16, 0.73));
  const engage = smooth(
    (finite(progress) - 0.02) / Math.max(0.01, first * 0.5 - 0.02),
  );
  const reset = smooth((finite(progress) - recovery) / (1 - recovery));
  const physical = cue && !["idle", "guard", "focus"].includes(frame.phase);
  const homeWeight = !physical || options.still ? 1 : 1 - engage * (1 - reset);
  frame.player.x -= (home - 1.55) * homeWeight;
  frame.enemy.x += (home - 1.55) * homeWeight;
  return frame;
}

// The complete rotated silhouettes determine safe camera bounds. Tall original
// bodies use the arena height rather than the wider SD atlas field width.
export function classicSceneProjection(
  width,
  height,
  frame,
  ratios,
  cinematic = false,
) {
  const w = Math.max(1, finite(width, 1));
  const h = Math.max(1, finite(height, 1));
  const boxes = [
    sdBodyBounds(frame?.player, ratios?.[0] || 2 / 3),
    sdBodyBounds(frame?.enemy, ratios?.[1] || 2 / 3),
  ];
  const left = Math.min(...boxes.map((box) => box.left));
  const right = Math.max(...boxes.map((box) => box.right));
  const bottom = Math.min(0, ...boxes.map((box) => box.bottom));
  const top = Math.max(3, ...boxes.map((box) => box.top));
  const fieldWidth = Math.max(0.1, right - left);
  const fieldHeight = Math.max(3, top - bottom);
  const shakeX = finite(frame?.camera?.shakeX);
  const shakeY = finite(frame?.camera?.shakeY);
  const safe = Math.min(
    (w * 0.94) / (fieldWidth + Math.abs(shakeX) * 2),
    (h * 0.94) / (fieldHeight + Math.abs(shakeY) * 2),
  );
  const preferred = (h * (cinematic ? 0.9 : 0.94)) / 3;
  return {
    width: w,
    height: h,
    unit: Math.min(
      preferred * Math.max(1, finite(frame?.camera?.zoom, 1)),
      safe,
    ),
    centerX: (left + right) / 2,
    centerY: (bottom + top) / 2,
    shakeX,
    shakeY,
  };
}

export const classicScreenPoint = sdScreenPoint;
