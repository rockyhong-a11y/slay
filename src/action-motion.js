export const CLASSIC_ACTION_ACTORS = Object.freeze([
  "raven",
  "valkyrie",
  "nova",
  "viper",
  "ember",
  "atlas",
  "seraph",
  "lynx",
  "tempest",
  "onyx",
]);
export const CLASSIC_ACTION_POSES = Object.freeze([
  "ready",
  "windup",
  "elbow",
  "kick",
  "clinch",
  "lift",
  "slam",
  "suplex",
  "armbar",
  "leglock",
  "guard",
  "hurt",
]);
const actorId = (actor) =>
  typeof actor === "string" ? actor : actor?.id || actor?.artKey;
const finite = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
export const hasClassicActionArt = (actor) =>
  CLASSIC_ACTION_ACTORS.includes(actorId(actor));

function sourceClip(value) {
  if (value == null) return undefined;
  const points =
    typeof value === "string" && /^polygon\([\d.% ,+-]+\)$/.test(value)
      ? value
          .slice(8, -1)
          .split(",")
          .map((pair) => {
            const match = pair
              .trim()
              .match(/^([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
            return match ? [Number(match[1]), Number(match[2])] : [];
          })
      : value;
  if (
    !Array.isArray(points) ||
    points.length < 3 ||
    !points.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every((n) => Number.isFinite(n) && n >= 0 && n <= 100),
    )
  )
    return null;
  return `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
}

// Manifest entries are immutable after loading. Validate and normalize all
// polygon paths once, keeping the per-frame lookup independent of vertex count.
const geometryCache = new WeakMap();
function buildGeometry(metadata) {
  if (
    !metadata ||
    !Number.isFinite(metadata.width) ||
    !Number.isFinite(metadata.height) ||
    metadata.width <= 0 ||
    metadata.height <= 0
  )
    return null;
  const frames = metadata.frames;
  const clips = {};
  for (const pose of CLASSIC_ACTION_POSES) {
    const f = frames?.[pose];
    if (
      !f ||
      ![f.x, f.y, f.width, f.height].every(Number.isFinite) ||
      f.x < 0 ||
      f.y < 0 ||
      f.width <= 0 ||
      f.height <= 0 ||
      f.x + f.width > metadata.width ||
      f.y + f.height > metadata.height
    )
      return null;
    clips[pose] = sourceClip(f.clip);
    if (clips[pose] === null) return null;
  }
  const referenceHeight = Math.max(
    1,
    finite(metadata.referenceHeight, frames.ready.height),
  );
  return Object.fromEntries(
    CLASSIC_ACTION_POSES.map((pose) => {
      const source = frames[pose];
      return [
        pose,
        Object.freeze({
          pose,
          source,
          referenceHeight,
          worldWidth: (3 * source.width) / referenceHeight,
          worldHeight: (3 * source.height) / referenceHeight,
          clipPath: clips[pose],
          backgroundSize: `${(metadata.width / source.width) * 100}% ${(metadata.height / source.height) * 100}%`,
          backgroundPosition: `${metadata.width === source.width ? 0 : (source.x / (metadata.width - source.width)) * 100}% ${metadata.height === source.height ? 0 : (source.y / (metadata.height - source.height)) * 100}%`,
        }),
      ];
    }),
  );
}

export function classicActionGeometry(metadata, requestedPose = "ready") {
  if (!metadata || typeof metadata !== "object") return null;
  if (!geometryCache.has(metadata))
    geometryCache.set(metadata, buildGeometry(metadata));
  const poses = geometryCache.get(metadata);
  const pose = CLASSIC_ACTION_POSES.includes(requestedPose)
    ? requestedPose
    : "ready";
  return poses?.[pose] || null;
}

const ARMS = new Set([
  "armbar",
  "kimura",
  "americana",
  "wristlock",
  "hammerlock",
  "omoplata",
  "surfboard",
  "crossface",
  "octopushold",
  "octopus",
  "bowandarrow",
  "bow-and-arrow",
]);
const LEGS = new Set([
  "anklelock",
  "kneebar",
  "heelhook",
  "figurefour",
  "figure-four",
  "bostoncrab",
  "boston-crab",
  "sharpshooter",
  "toehold",
  "calfslicer",
  "stf",
]);
const CLINCH = new Set([
  "headlock",
  "grapple",
  "collartie",
  "waistlock",
  "armdrag",
  "abdominalstretch",
  "abdominal",
  "clinch",
]);
const POWERBOMBS = new Set([
  "powerbomb",
  "sitoutpowerbomb",
  "jackknifepowerbomb",
  "popuppowerbomb",
  "gutwrenchpowerbomb",
  "foldingpowerbomb",
  "championship",
  "driver",
  "sitout",
  "jackknife",
  "popup",
  "gutwrench",
  "folding",
]);
const SUPLEX = new Set([
  "suplex",
  "bellysuplex",
  "snapsuplex",
  "belly-suplex",
  "snap",
]);
const SLAMS = new Set([
  "bodyslam",
  "powerslam",
  "sidewalkslam",
  "spinebuster",
  "samoandrop",
  "sidewalk",
  "samoan",
]);
const KICKS = new Set([
  "dropkick",
  "finisher",
  "moonsault",
  "flying-knee",
  "aerial",
]);

export function classicActionKind(cue) {
  const exact = [cue?.cardId, cue?.effect?.variant].filter(Boolean);
  for (const id of exact) {
    if (ARMS.has(id)) return "armbar";
    if (LEGS.has(id)) return "leglock";
    if (CLINCH.has(id)) return "clinch";
    if (POWERBOMBS.has(id)) return "powerbomb";
    if (SUPLEX.has(id)) return "suplex";
    if (SLAMS.has(id)) return "slam";
    if (KICKS.has(id)) return "kick";
  }
  const family = cue?.effect?.family || cue?.effectFamily;
  if (family === "defense") return "guard";
  if (family === "tactics") return "focus";
  if (family === "nightmare") return "hurt";
  if (cue?.camera?.kind === "throw") return "suplex";
  if (cue?.throwing || family === "grapple") return "slam";
  if (cue?.pressure || family === "submission") return "armbar";
  return "elbow";
}

function timing(cue, incoming) {
  const contacts = incoming
    ? [0.29]
    : (cue?.camera?.impacts || []).filter(
        (value) => Number.isFinite(value) && value > 0 && value < 0.92,
      );
  const first = contacts.length ? Math.min(...contacts) : 0.55;
  const last = contacts.length ? Math.max(...contacts) : 0.55;
  const hold = Math.min(
    0.1,
    Math.max(0, finite(cue?.camera?.hitstop, 80)) /
      Math.max(300, finite(cue?.duration, 2600)),
  );
  const recover = Math.min(0.88, Math.max(last + hold + 0.16, 0.73));
  return {
    first,
    last,
    recover,
    hold,
    contacts: contacts.length ? contacts : [first],
  };
}
function attacking(cue) {
  return cue?.attacking === undefined
    ? finite(cue?.damage) > 0 || finite(cue?.blocked) > 0
    : !!cue.attacking;
}
function attackerSide(cue, incoming) {
  return ["player", "enemy"].includes(cue?.attacker)
    ? cue.attacker
    : incoming
      ? "enemy"
      : "player";
}

export function classicActionPose(
  cue,
  progress,
  { side = "player", incoming = false, still = false } = {},
) {
  const p = clamp(finite(progress), 0, 1);
  if (!cue || p >= 1 || still) return "ready";
  const { first, recover, hold, contacts } = timing(cue, incoming);
  const kind = classicActionKind(cue);
  const attacker = attackerSide(cue, incoming);
  if (p < 0.035 || p > 0.94) return "ready";
  if (side !== attacker) {
    if (["focus", "guard", "hurt"].includes(kind)) return "ready";
    if (!attacking(cue) || finite(cue.damage) <= 0) return "guard";
    return p >= first * (kind === "elbow" || kind === "kick" ? 1 : 0.55) &&
      p < recover + 0.07
      ? "hurt"
      : "guard";
  }
  if (kind === "focus") return p < recover ? "windup" : "ready";
  if (kind === "guard" || kind === "hurt") return p < recover ? kind : "ready";
  if (p > recover + 0.07) return "ready";
  if (["armbar", "leglock"].includes(kind) && p > recover) return kind;
  if (p > recover)
    return kind === "elbow" || kind === "kick" ? "windup" : "clinch";
  if (["armbar", "leglock", "clinch"].includes(kind))
    return p < first * 0.62 ? "clinch" : kind;
  if (kind === "powerbomb")
    return p < first * 0.35 ? "clinch" : p < first * 0.94 ? "lift" : "slam";
  if (kind === "suplex")
    return p < first * 0.4 ? "clinch" : p < first + hold ? "suplex" : "slam";
  if (kind === "slam")
    return p < first * 0.45 ? "clinch" : p < first * 0.86 ? "lift" : "slam";
  return contacts.some((at) => p >= at - 0.13 && p < at + hold + 0.15)
    ? kind
    : "windup";
}

// Replace only complete illustrated poses. The authored bent/horizontal poses
// already express their joint angles and must never receive a second 90° turn.
export function applyClassicActionFrame(
  baseFrame,
  cue,
  progress,
  {
    actors = [],
    metadata = [],
    bodyRatios = [],
    still = false,
    incoming = false,
  } = {},
) {
  const frame = {
    ...baseFrame,
    player: { ...baseFrame.player },
    enemy: { ...baseFrame.enemy },
    contact: { ...baseFrame.contact },
  };
  const active = !!cue && progress < 1 && !still;
  const kind = classicActionKind(cue);
  const attacker = attackerSide(cue, incoming);
  const direction = attacker === "player" ? 1 : -1;
  const { first, recover } = timing(cue, incoming);
  const engage = smooth(
    (progress - 0.035) / Math.max(0.01, first * 0.62 - 0.035),
  );
  const reset = smooth((progress - recover) / (1 - recover));
  const utilityHold =
    active && !attacking(cue) && ["armbar", "leglock", "clinch"].includes(kind);
  for (const [index, side] of ["player", "enemy"].entries()) {
    if (
      !hasClassicActionArt(actors[index]) ||
      metadata[index]?.id !== actorId(actors[index])
    )
      continue;
    const body = frame[side];
    const pose = classicActionPose(cue, progress, { side, incoming, still });
    const geometry = classicActionGeometry(metadata[index], pose);
    if (!geometry || !active) continue;
    body.actionPose = pose;
    body.drawWidth = geometry.worldWidth;
    body.drawHeight = geometry.worldHeight;
    const owner = side === attacker;
    if (utilityHold) {
      const targetX = (owner ? -0.5 : 0.74) * direction;
      body.x = mix(body.x, targetX, engage * (1 - reset));
      body.pose = owner ? kind : "guard";
      frame.contact.visible = false;
      frame.contact.strength = 0;
    }
    if (owner) {
      body.rz = ["slam", "suplex", "armbar", "leglock"].includes(pose)
        ? 0
        : clamp(body.rz, -0.14, 0.14);
      const airborne =
        pose === "kick" ? Math.max(0, baseFrame[side].y - 1.5) : 0;
      body.y =
        geometry.worldHeight / 2 + airborne + (pose === "lift" ? 0.04 : 0);
      // Authored suplex and seated slams travel through different sides of the
      // clinch, while the shoulder lift stays vertically aligned to its target.
      if (pose === "suplex") body.x -= direction * 0.18;
      if (pose === "slam" && kind === "powerbomb") body.x += direction * 0.16;
    } else {
      // A defender's airborne rotation is still physical, while standing hurt
      // and guard poses use the pose's real height and remain above the mat.
      const halfHeight = geometry.worldHeight / 2;
      const halfWidth = geometry.worldWidth / 2;
      const rotated =
        (Math.abs(Math.cos(body.rz)) * halfHeight +
          Math.abs(Math.sin(body.rz)) * halfWidth) *
        (body.scale || 1);
      const priorRotated =
        (Math.abs(Math.cos(body.rz)) * 1.5 +
          Math.abs(Math.sin(body.rz)) *
            1.5 *
            (metadata[index].readyRatio || 0.55)) *
        (body.scale || 1);
      const lift = Math.max(0, body.y - priorRotated);
      body.y = rotated + lift;
    }
  }
  if (
    active &&
    ["armbar", "leglock"].includes(kind) &&
    frame.player.actionPose &&
    frame.enemy.actionPose
  ) {
    const defender = attacker === "player" ? "enemy" : "player";
    const attackIndex = attacker === "player" ? 0 : 1;
    const defendIndex = 1 - attackIndex;
    const a = frame[attacker];
    const b = frame[defender];
    const lower = smooth((progress - first * 0.36) / (first * 0.5));
    const release = smooth((progress - (recover - 0.045)) / 0.11);
    const blend = lower * (1 - release);
    const holding = classicActionGeometry(metadata[attackIndex], kind);
    // Use the destination seated drawing as the lowering target throughout the
    // transition; changing from the tall clinch frame cannot jerk the partner.
    const grip = classicActionJointPoint(
      {
        ...a,
        drawWidth: holding.worldWidth,
        drawHeight: holding.worldHeight,
        y: holding.worldHeight / 2,
        rz: 0,
      },
      classicActionGrip(actors[attackIndex], kind),
      attacker === "enemy",
    );
    const joint = classicSubmissionTarget(kind, utilityHold);
    const turn = ((kind === "leglock" ? -1 : 1) * direction * Math.PI) / 2;
    const width = b.drawWidth || 3 * (bodyRatios[defendIndex] || 2 / 3);
    const height = b.drawHeight || 3;
    const target = {
      ...b,
      x: 0,
      y: 0,
      rz: turn,
      drawWidth: width,
      drawHeight: height,
    };
    const offset = classicActionJointPoint(target, joint, defender === "enemy");
    const half =
      ((Math.abs(Math.cos(turn)) * height + Math.abs(Math.sin(turn)) * width) *
        (b.scale || 1)) /
      2;
    b.x = mix(b.x, grip.x - offset.x, blend);
    b.y = mix(b.y, Math.max(half + 0.02, grip.y - offset.y), blend);
    b.rz = mix(b.rz, turn, blend);
    b.depth = -1;
    a.depth = 1;
    if (utilityHold) {
      b.pose = "guard";
      frame.contact.visible = false;
      frame.contact.strength = 0;
    }
  }
  return frame;
}

// Measured grip locations within the independently authored seated drawings.
// They align whole-body illustrations; no limb is moved or reconstructed.
const GRIPS = {
  raven: { armbar: [0.47, 0.48], leglock: [0.5, 0.62] },
  valkyrie: { armbar: [0.43, 0.46], leglock: [0.44, 0.62] },
  nova: { armbar: [0.44, 0.49], leglock: [0.23, 0.69] },
  viper: { armbar: [0.4, 0.44], leglock: [0.52, 0.72] },
  ember: { armbar: [0.44, 0.45], leglock: [0.25, 0.66] },
  atlas: { armbar: [0.481, 0.564], leglock: [0.301, 0.59] },
  seraph: { armbar: [0.466, 0.565], leglock: [0.301, 0.591] },
  lynx: { armbar: [0.472, 0.564], leglock: [0.301, 0.59] },
  tempest: { armbar: [0.466, 0.557], leglock: [0.3, 0.59] },
  onyx: { armbar: [0.48, 0.565], leglock: [0.3, 0.59] },
};
export const classicActionGrip = (actor, kind) =>
  GRIPS[actorId(actor)]?.[kind] || [0.45, 0.5];
export const classicSubmissionTarget = (kind, utility = false) =>
  kind === "leglock" ? [0.25, 0.91] : utility ? [0.53, 0.29] : [0.52, 0.27];
export function classicActionJointPoint(body, [u, v], mirrored = false) {
  const scale = body.scale || 1;
  const x = (u - 0.5) * (body.drawWidth || 2) * (mirrored ? -1 : 1) * scale;
  const y = (0.5 - v) * (body.drawHeight || 3) * scale;
  const angle = body.rz || 0;
  return {
    x: body.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: body.y + x * Math.sin(angle) + y * Math.cos(angle),
  };
}
