import { approach, artSeed, blinkAt, clamp, fitArt } from "./motion-config.js";

export const PUPPET_PARTS = [
  "body",
  "head",
  "backHair",
  "frontHair",
  "leftArm",
  "rightArm",
];
export const PUPPET_POSES = {
  normal: {
    body: 0,
    head: 0,
    leftArm: 0,
    rightArm: 0,
    scaleY: 1,
    breath: 1,
    tempo: 1,
    eyes: 1,
    smile: 0.12,
    brow: 0,
    mouth: 0.04,
  },
  excited: {
    body: 0.025,
    head: -0.055,
    leftArm: 0.17,
    rightArm: -0.17,
    scaleY: 1,
    breath: 1.1,
    tempo: 1.22,
    eyes: 1.05,
    smile: 0.85,
    brow: -0.12,
    mouth: 0.18,
  },
  fiery: {
    body: 0.09,
    head: -0.12,
    leftArm: 0.25,
    rightArm: -0.24,
    scaleY: 1,
    breath: 1.25,
    tempo: 1.12,
    eyes: 0.8,
    smile: 0.05,
    brow: 0.85,
    mouth: 0.5,
  },
  frustrated: {
    body: -0.035,
    head: 0.1,
    leftArm: -0.15,
    rightArm: 0.12,
    scaleY: 0.98,
    breath: 0.8,
    tempo: 0.82,
    eyes: 0.8,
    smile: -0.65,
    brow: -0.72,
    mouth: 0.02,
  },
  tired: {
    body: 0.07,
    head: 0.17,
    leftArm: -0.24,
    rightArm: 0.22,
    scaleY: 0.97,
    breath: 1.65,
    tempo: 0.75,
    eyes: 0.45,
    smile: -0.2,
    brow: -0.35,
    mouth: 0.32,
  },
  groggy: {
    body: 0.105,
    head: 0.23,
    leftArm: -0.3,
    rightArm: 0.28,
    scaleY: 0.91,
    breath: 1.35,
    tempo: 0.63,
    eyes: 0.26,
    smile: -0.38,
    brow: -0.6,
    mouth: 0.23,
  },
};

const manifests = new Map();
const images = new Map();
const actors = new Map();

export function multiplyMatrix(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

export function transformPoint(matrix, point) {
  return [
    matrix[0] * point[0] + matrix[2] * point[1] + matrix[4],
    matrix[1] * point[0] + matrix[3] * point[1] + matrix[5],
  ];
}

export function validatePuppet(config) {
  if (!config?.atlas || !Array.isArray(config.parts))
    throw new Error("Puppet atlas and actual layer metadata are required");
  const byId = new Map(config.parts.map((part) => [part.id, part]));
  if (
    byId.size !== config.parts.length ||
    PUPPET_PARTS.some((id) => !byId.has(id))
  )
    throw new Error("Puppet requires six distinct body/head/hair/arm parts");
  const tuple = (values, length) =>
    Array.isArray(values) &&
    values.length === length &&
    values.every(Number.isFinite);
  for (const part of config.parts) {
    if (
      !tuple(part.source, 4) ||
      part.source.some((v) => v < 0 || v > 1) ||
      part.source[2] <= 0 ||
      part.source[3] <= 0 ||
      part.source[0] + part.source[2] > 1.00001 ||
      part.source[1] + part.source[3] > 1.00001
    )
      throw new Error(`Invalid atlas source for ${part.id}`);
    if (
      !tuple(part.bounds, 4) ||
      part.bounds[2] <= 0 ||
      part.bounds[3] <= 0 ||
      !tuple(part.pivot, 2) ||
      part.pivot.some((v) => v < 0 || v > 1)
    )
      throw new Error(`Invalid destination or pivot for ${part.id}`);
    if (
      part.sourceClip &&
      (!Array.isArray(part.sourceClip) ||
        !part.sourceClip.length ||
        !part.sourceClip.every(
          (rect) =>
            tuple(rect, 4) &&
            rect.every((v) => v >= 0 && v <= 1) &&
            rect[2] > 0 &&
            rect[3] > 0 &&
            rect[0] + rect[2] <= 1.00001 &&
            rect[1] + rect[3] <= 1.00001,
        ))
    )
      throw new Error(`Invalid local source clips for ${part.id}`);
    const visited = new Set([part.id]);
    let parent = part.parent;
    while (parent) {
      if (visited.has(parent) || !byId.has(parent))
        throw new Error(`Invalid parent hierarchy for ${part.id}`);
      visited.add(parent);
      parent = byId.get(parent).parent;
    }
  }
  if (
    !config.face?.eyes?.length ||
    !config.face.eyes.every(
      (eye) => tuple(eye, 4) && eye[2] > 0 && eye[3] > 0,
    ) ||
    !tuple(config.face.mouth, 4) ||
    config.face.mouth[2] <= 0 ||
    config.face.mouth[3] <= 0
  )
    throw new Error(
      "Measured eyes and mouth are required for expressive faces",
    );
  return config;
}

export function springStep(state, target, delta) {
  let { value = 0, velocity = 0 } = state;
  const steps = Math.max(1, Math.ceil(Math.min(delta, 0.05) * 120));
  const dt = Math.min(delta, 0.05) / steps;
  for (let step = 0; step < steps; step++) {
    velocity += ((target - value) * 78 - velocity * 12) * dt;
    value += velocity * dt;
  }
  return { value: clamp(value, -0.48, 0.48), velocity: clamp(velocity, -5, 5) };
}

export function blendPose(current, target, delta, immediate = false) {
  const result = {};
  for (const key of Object.keys(target))
    result[key] = immediate
      ? target[key]
      : approach(current[key] ?? target[key], target[key], delta, 8);
  return result;
}

export function actionPose(action) {
  if (!action)
    return {
      strength: 0,
      body: 0,
      head: 0,
      leftArm: 0,
      rightArm: 0,
      reach: 0,
      lift: 0,
    };
  const t = clamp(action.time / action.duration, 0, 1);
  const strength = Math.sin(Math.PI * t) ** 2;
  if (action.kind === "hit")
    return {
      strength,
      body: -0.2 * strength,
      head: 0.25 * strength,
      leftArm: -0.18 * strength,
      rightArm: 0.2 * strength,
      reach: -0.025 * strength,
      lift: 0,
    };
  if (action.kind === "aerial")
    return {
      strength,
      body: -0.18 * strength,
      head: 0.06 * strength,
      leftArm: 0.45 * strength,
      rightArm: -0.4 * strength,
      reach: 0.02 * strength,
      lift: -0.055 * strength,
    };
  if (["throw", "grapple", "submission"].includes(action.kind))
    return {
      strength,
      body: 0.13 * strength,
      head: 0.1 * strength,
      leftArm: -0.33 * strength,
      rightArm: 0.6 * strength,
      reach: 0.07 * strength,
      lift: 0,
    };
  if (action.kind === "defense")
    return {
      strength,
      body: -0.05 * strength,
      head: -0.07 * strength,
      leftArm: 0.22 * strength,
      rightArm: -0.22 * strength,
      reach: 0,
      lift: 0,
    };
  if (action.kind === "tactics" || action.kind === "nightmare")
    return {
      strength,
      body: 0.02 * strength,
      head: -0.12 * strength,
      leftArm: -0.16 * strength,
      rightArm: 0.13 * strength,
      reach: 0,
      lift: 0,
    };
  return {
    strength,
    body: 0.16 * strength,
    head: -0.09 * strength,
    leftArm: -0.08 * strength,
    rightArm: -(action.finisher ? 0.95 : 0.75) * strength,
    reach: (action.finisher ? 0.11 : 0.075) * strength,
    lift: 0,
  };
}

export function puppetFrame(
  profile,
  clock,
  activity,
  gaze = [0, 0],
  action = null,
  seed = 0.27,
) {
  const phase = seed * Math.PI * 2;
  const breath = Math.sin(clock * 1.85 + phase) * profile.breath * activity;
  const gesture = actionPose(action);
  return {
    bones: {
      body: {
        angle: profile.body + gesture.body,
        y: gesture.lift,
        sx: 1 + breath * 0.012,
        sy: profile.scaleY + breath * 0.012,
      },
      head: {
        angle:
          profile.head +
          Math.sin(clock * 0.72 + phase) * 0.04 * activity +
          gaze[0] * 0.04 * activity +
          gesture.head,
        x: gaze[0] * 0.004 * activity,
        y: breath * 0.002,
      },
      leftArm: {
        angle:
          profile.leftArm +
          Math.sin(clock * 1.85 + 0.7 + phase) * 0.065 * activity +
          gesture.leftArm,
        x: gesture.reach * 0.3,
      },
      rightArm: {
        angle:
          profile.rightArm +
          Math.sin(clock * 1.85 + 1.1 + phase) * 0.065 * activity +
          gesture.rightArm,
        x: gesture.reach,
        y: -gesture.strength * 0.012,
      },
      backHair: { angle: 0 },
      frontHair: { angle: 0 },
    },
    face: {
      open: clamp(profile.eyes * (1 - blinkAt(clock, seed) * activity), 0, 1.1),
      smile: profile.smile,
      brow:
        profile.brow +
        (action?.kind === "hit" ? -0.35 : 0.4) * gesture.strength,
      mouth: clamp(
        profile.mouth + Math.abs(breath) * 0.1 + gesture.strength * 0.35,
        0,
        1,
      ),
      gaze,
    },
  };
}

export function partMatrices(parts, bones, size = [1000, 1500]) {
  const byId = new Map(parts.map((part) => [part.id, part]));
  const resolved = new Map();
  const get = (id) => {
    if (resolved.has(id)) return resolved.get(id);
    const part = byId.get(id),
      bone = bones[id] || {};
    const pivot = [
      (part.bounds[0] + part.bounds[2] * part.pivot[0]) * size[0],
      (part.bounds[1] + part.bounds[3] * part.pivot[1]) * size[1],
    ];
    const angle = bone.angle || 0,
      c = Math.cos(angle),
      s = Math.sin(angle);
    const sx = bone.sx ?? 1,
      sy = bone.sy ?? 1;
    let matrix = [
      c * sx,
      s * sx,
      -s * sy,
      c * sy,
      pivot[0] + (bone.x || 0) * size[0],
      pivot[1] + (bone.y || 0) * size[1],
    ];
    matrix = multiplyMatrix(matrix, [1, 0, 0, 1, -pivot[0], -pivot[1]]);
    if (part.parent) matrix = multiplyMatrix(get(part.parent), matrix);
    resolved.set(id, matrix);
    return matrix;
  };
  parts.forEach((part) => get(part.id));
  return resolved;
}

function imageFor(url) {
  if (!images.has(url))
    images.set(
      url,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => {
          images.delete(url);
          reject(new Error(`Cannot load puppet part image ${url}`));
        };
        image.src = url;
      }),
    );
  return images.get(url);
}

function manifestFor(root) {
  if (!manifests.has(root))
    manifests.set(
      root,
      fetch(`${root}fighters/puppet-manifest.json`)
        .then((response) => {
          if (!response.ok) throw new Error("Puppet manifest is unavailable");
          return response.json();
        })
        .catch((error) => {
          manifests.delete(root);
          throw error;
        }),
    );
  return manifests.get(root);
}

function assetFor(actor, root, wake) {
  const key = root + actor;
  if (!actors.has(key)) {
    const record = { ready: false };
    actors.set(key, record);
    manifestFor(root)
      .then((manifest) => {
        const config = validatePuppet(manifest.fighters?.[actor]);
        return Promise.all([
          imageFor(root + config.atlas),
          imageFor(root + (config.base || `fighters/${actor}.webp`)),
        ]).then(([atlas, base]) => {
          Object.assign(record, {
            config,
            atlas,
            size: config.size || [base.width, base.height],
            ready: true,
          });
        });
      })
      .catch((error) => {
        record.error = error.message;
      })
      .finally(wake);
  }
  return actors.get(key);
}

function drawFace(context, face, pose, size) {
  const skin = face.skin || "#f4c4ad",
    ink = face.ink || "#241c28",
    iris = face.iris || "#64b8ca";
  const [width, height] = size;
  face.eyes.forEach(([u, v, ru, rv], index) => {
    const x = u * width,
      y = v * height,
      rx = ru * width,
      ry = rv * height;
    context.fillStyle = skin;
    context.beginPath();
    context.ellipse(x, y - ry * 0.45, rx * 1.35, ry * 1.8, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = Math.max(1.5, rx * 0.13);
    context.lineCap = "round";
    if (pose.open < 0.13) {
      context.beginPath();
      context.moveTo(x - rx, y);
      context.quadraticCurveTo(x, y + ry * 0.7, x + rx, y);
      context.stroke();
    } else {
      const openness = ry * pose.open;
      context.save();
      context.beginPath();
      context.moveTo(x - rx, y);
      context.quadraticCurveTo(x, y - openness * 1.55, x + rx, y);
      context.quadraticCurveTo(x, y + openness * 1.05, x - rx, y);
      context.closePath();
      context.fillStyle = "#fff8f0";
      context.fill();
      context.stroke();
      context.clip();
      const px = x + clamp(pose.gaze[0], -1, 1) * rx * 0.25,
        py = y + clamp(pose.gaze[1], -1, 1) * ry * 0.16;
      context.fillStyle = iris;
      context.beginPath();
      context.ellipse(px, py, rx * 0.39, ry * 0.92, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = ink;
      context.beginPath();
      context.ellipse(px, py, rx * 0.2, ry * 0.75, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.ellipse(
        px - rx * 0.12,
        py - ry * 0.3,
        rx * 0.12,
        ry * 0.24,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }
    const slope = (index ? -1 : 1) * pose.brow * ry * 0.55;
    context.lineWidth = Math.max(2, rx * 0.18);
    context.beginPath();
    context.moveTo(x - rx * 0.92, y - ry * 1.65 - slope);
    context.quadraticCurveTo(
      x,
      y - ry * 1.9,
      x + rx * 0.92,
      y - ry * 1.65 + slope,
    );
    context.stroke();
  });
  const [u, v, wu, hv] = face.mouth,
    x = u * width,
    y = v * height,
    w = wu * width,
    h = hv * height;
  context.fillStyle = skin;
  context.beginPath();
  context.ellipse(x, y, w * 0.7, h * 1.15, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.5, w * 0.06);
  const opening = clamp(pose.mouth, 0, 1),
    curve = pose.smile * h * 0.6;
  context.beginPath();
  context.moveTo(x - w * 0.48, y);
  context.quadraticCurveTo(x, y + curve - opening * h * 0.5, x + w * 0.48, y);
  context.quadraticCurveTo(x, y + curve + opening * h * 1.7, x - w * 0.48, y);
  context.closePath();
  context.fillStyle = "#482137";
  context.fill();
  context.stroke();
  context.save();
  context.clip();
  context.globalAlpha = clamp(opening * 4, 0, 1);
  context.fillStyle = "#fff7ed";
  context.fillRect(x - w * 0.45, y - h * 0.12, w * 0.9, h * 0.32);
  context.restore();
}

export function portraitDestination(
  head,
  matrix,
  size,
  width,
  height,
  mirrored = false,
) {
  const center = transformPoint(matrix, [
    (head[0] + head[2] * 0.5) * size[0],
    (head[1] + head[3] * 0.5) * size[1],
  ]);
  if (mirrored) center[0] = size[0] - center[0];
  const portraitWidth = (width * 0.88) / head[2];
  const portraitHeight = (portraitWidth * size[1]) / size[0];
  return {
    width: portraitWidth,
    height: portraitHeight,
    x: width / 2 - (portraitWidth * center[0]) / size[0],
    y: height / 2 - (portraitHeight * center[1]) / size[1],
  };
}

function renderPuppet(entry, asset, frame, options) {
  const context = entry.canvas.getContext("2d"),
    scale = Math.min(window.devicePixelRatio || 1, 1.75);
  const width = Math.max(1, Math.round(entry.bounds.width * scale)),
    height = Math.max(1, Math.round(entry.bounds.height * scale));
  if (entry.canvas.width !== width || entry.canvas.height !== height) {
    entry.canvas.width = width;
    entry.canvas.height = height;
  }
  context.clearRect(0, 0, width, height);
  const size = asset.size,
    config = asset.config;
  const matrices = partMatrices(config.parts, frame.bones, size);
  const facing =
    options.side === "enemy"
      ? -1
      : options.side === "player"
        ? 1
        : config.facing || 1;
  const mirrored = facing !== (config.facing || 1);
  const destination = fitArt(
    width * 0.88,
    height * 0.94,
    ...size,
    options.fit || "contain",
    options.position || [0.5, 1],
  );
  destination.x += width * 0.06;
  destination.y += height * 0.03;
  if (options.portrait) {
    const head = config.parts.find((part) => part.id === "head").bounds;
    Object.assign(
      destination,
      portraitDestination(
        head,
        matrices.get("head"),
        size,
        width,
        height,
        mirrored,
      ),
    );
  }
  context.save();
  context.translate(destination.x, destination.y);
  context.scale(destination.width / size[0], destination.height / size[1]);
  if (mirrored) {
    context.translate(size[0], 0);
    context.scale(-1, 1);
  }
  const parts = [...config.parts].sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const part of parts) {
    context.save();
    context.transform(...matrices.get(part.id));
    const [sx, sy, sw, sh] = part.source,
      [dx, dy, dw, dh] = part.bounds;
    if (part.sourceClip) {
      context.beginPath();
      part.sourceClip.forEach(([x, y, w, h]) =>
        context.rect(
          (dx + x * dw) * size[0],
          (dy + y * dh) * size[1],
          w * dw * size[0],
          h * dh * size[1],
        ),
      );
      context.clip();
    }
    context.drawImage(
      asset.atlas,
      sx * asset.atlas.width,
      sy * asset.atlas.height,
      sw * asset.atlas.width,
      sh * asset.atlas.height,
      dx * size[0],
      dy * size[1],
      dw * size[0],
      dh * size[1],
    );
    if (part.id === "head") drawFace(context, config.face, frame.face, size);
    context.restore();
  }
  context.restore();
  entry.canvas.dataset.renderer = "layered-canvas";
  entry.canvas.dataset.parts = String(parts.length);
  entry.canvas.dataset.frame = String(++entry.frames);
}

/** Drawn by live-art-renderer's one shared RAF, never by a second puppet loop. */
export function createFighterController(root, provideAsset = assetFor) {
  let profile,
    actor,
    requestedActor,
    previousCast,
    previousHit = null,
    action = null;
  let back = { value: 0, velocity: 0 },
    front = { value: 0, velocity: 0 };
  return {
    draw(entry, { delta, now, animate, reduced, pointer, wake }) {
      const options = entry.options();
      const id = options.art
        .split("/")
        .pop()
        .replace(/\.webp$/, "");
      if (requestedActor && requestedActor !== id) {
        entry.ready = false;
        profile = null;
        action = null;
        previousCast = options.cast?.id ?? options.cast?.cardId ?? options.cast;
        previousHit = options.hit ? (options.hitId ?? true) : null;
        back = { value: 0, velocity: 0 };
        front = { value: 0, velocity: 0 };
        entry.canvas
          .getContext("2d")
          .clearRect(0, 0, entry.canvas.width, entry.canvas.height);
      }
      requestedActor = id;
      const asset = provideAsset(id, root, wake);
      if (!asset.ready) {
        entry.canvas.dataset.liveState = asset.error
          ? "atlas-error"
          : "loading-atlas";
        return { needsFrame: false };
      }
      const target = PUPPET_POSES[options.condition] || PUPPET_POSES.normal;
      if (!profile || actor !== id) {
        profile = { ...target };
        actor = id;
        entry.seed = artSeed(id);
      }
      profile = blendPose(
        profile,
        target,
        delta,
        reduced || !animate || options.still,
      );
      const moving = animate && !options.still;
      entry.activity = moving ? approach(entry.activity, 1, delta, 8) : 0;
      const cue = options.cast,
        castKey = cue?.id ?? cue?.cardId ?? cue,
        hitKey = options.hit ? (options.hitId ?? true) : null;
      if (
        action &&
        ((action.source === "cast" && action.key !== castKey) ||
          (action.source === "hit" && action.key !== hitKey))
      )
        action = null;
      if (castKey && castKey !== previousCast && moving)
        action = {
          kind: cue.disciplineSlug || "strike",
          finisher: cue.finisher,
          source: "cast",
          key: castKey,
          time: 0,
          duration: Math.max(
            0.001,
            (options.castDuration ?? cue.duration ?? 1000) / 1000,
          ),
        };
      if (hitKey && hitKey !== previousHit && moving)
        action = {
          kind: "hit",
          source: "hit",
          key: hitKey,
          time: 0,
          duration: 0.66,
        };
      previousCast = castKey;
      previousHit = hitKey;
      if (moving) entry.clock += delta * profile.tempo;
      if (action) {
        action.time += delta;
        if (action.time >= action.duration || !moving) action = null;
      }
      const rect = entry.bounds;
      entry.gaze[0] = approach(
        entry.gaze[0],
        clamp(
          ((pointer[0] - rect.left) / Math.max(1, rect.width)) * 2 - 1,
          -1,
          1,
        ),
        delta,
        4,
      );
      entry.gaze[1] = approach(
        entry.gaze[1],
        clamp(
          ((pointer[1] - rect.top) / Math.max(1, rect.height)) * 2 - 1,
          -1,
          1,
        ),
        delta,
        4,
      );
      const native = asset.config.facing || 1;
      const facing =
        options.side === "enemy" ? -1 : options.side === "player" ? 1 : native;
      const localGaze = [
        entry.gaze[0] * (facing === native ? 1 : -1),
        entry.gaze[1],
      ];
      const frame = puppetFrame(
        profile,
        entry.clock,
        entry.activity,
        localGaze,
        action,
        entry.seed,
      );
      if (native < 0) {
        frame.bones.body.angle *= -1;
        frame.bones.head.angle *= -1;
        const left = frame.bones.leftArm,
          right = frame.bones.rightArm;
        frame.bones.leftArm = {
          ...right,
          angle: -right.angle,
          x: -(right.x || 0),
        };
        frame.bones.rightArm = {
          ...left,
          angle: -left.angle,
          x: -(left.x || 0),
        };
      }
      const arms = asset.config.parts
        .filter((part) => part.id === "leftArm" || part.id === "rightArm")
        .sort(
          (a, b) =>
            a.bounds[0] + a.bounds[2] / 2 - (b.bounds[0] + b.bounds[2] / 2),
        );
      if (arms[0].id === "rightArm")
        [frame.bones.leftArm, frame.bones.rightArm] = [
          frame.bones.rightArm,
          frame.bones.leftArm,
        ];
      const phase = entry.seed * Math.PI * 2;
      const backTarget =
        Math.sin(entry.clock * 1.25 - 0.9 + phase) * 0.23 * entry.activity +
        frame.bones.head.angle * 0.5;
      const frontTarget =
        Math.sin(entry.clock * 1.7 - 0.5 + phase) * 0.2 * entry.activity +
        frame.bones.head.angle * 0.25;
      const beginAtRest = reduced || !moving;
      back = beginAtRest
        ? { value: backTarget, velocity: 0 }
        : springStep(back, backTarget, delta);
      front = beginAtRest
        ? { value: frontTarget, velocity: 0 }
        : springStep(front, frontTarget, delta);
      frame.bones.backHair.angle = back.value;
      frame.bones.frontHair.angle = front.value;
      renderPuppet(entry, asset, frame, options);
      if (!entry.ready) {
        entry.ready = true;
        entry.onReady();
      }
      entry.canvas.dataset.liveState = moving ? "running" : "still";
      entry.canvas.dataset.action = action?.kind || "idle";
      entry.canvas.dataset.expression = options.condition || "normal";
      const changing = Object.keys(target).some(
        (key) => Math.abs(profile[key] - target[key]) > 0.001,
      );
      const settling =
        Math.abs(back.velocity) + Math.abs(front.velocity) > 0.01 ||
        Math.abs(back.value - backTarget) +
          Math.abs(front.value - frontTarget) >
          0.001;
      return {
        needsFrame:
          moving ||
          changing ||
          (!reduced && (entry.activity > 0.005 || settling)),
      };
    },
    refresh() {
      const key = root + requestedActor;
      if (actors.get(key)?.error) actors.delete(key);
    },
  };
}
