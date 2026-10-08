import {
  CLASSIC_ACTION_POSES,
  applyClassicActionFrame,
  classicActionGeometry,
  classicActionKind,
  hasClassicActionArt,
} from "./action-motion.js";
import { classicBodyBounds, classicCombatFrame } from "./classic-combat.js";
import { actionLandmarks } from "./action-landmarks.js";

const CHANNELS = ["x", "y", "rz", "scale"];
const SIDES = ["player", "enemy"];
const finite = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value, low = 0, high = 1) =>
  Math.max(low, Math.min(high, value));
const mix = (a, b, t) => a + (b - a) * t;
const actorId = (actor) =>
  typeof actor === "string" ? actor : actor?.id || actor?.artKey;
export const fluidEase = (value) => {
  const t = clamp(value);
  return t * t * t * (10 + t * (-15 + 6 * t));
};

const visiblePoseCache = new WeakMap();
function poseLayout(metadata, actor, pose) {
  // Arena and cinematic mounts wrap the same immutable atlas frames in new
  // readiness objects. Keep their pair planning warm across both renderers.
  const identity = metadata.frames || metadata;
  let cache = visiblePoseCache.get(identity);
  if (!cache) {
    cache = new Map();
    visiblePoseCache.set(identity, cache);
  }
  const key = `${actor}:${pose}:${metadata.width}:${metadata.height}:${metadata.referenceHeight}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = fixedCanvas(actor, metadata);
  const geometry = classicActionGeometry(metadata, pose);
  const width = geometry.worldWidth / canvas.width;
  const height = geometry.worldHeight / canvas.height;
  const left = (1 - width) / 2,
    top = 1 - height;
  const points = actionLandmarks(actor, pose).map(([x, y]) => [
    left + x * width,
    top + y * height,
  ]);
  points.push([0, 0], [1, 0], [0, 1], [1, 1]);
  const layout = {
    width,
    height,
    left,
    top,
    points,
    box: { left, right: left + width, top, bottom: 1 },
    pairs: new Map(),
  };
  cache.set(key, layout);
  return layout;
}

// Match the connected 24×30 GPU surface. Similarity MLS is linear in the target
// landmarks; its mesh bounds at both endpoints conservatively interpolate for
// every intermediate blend. Expensive work is cached once per immutable pair.
function warpedBox(source, target) {
  if (source === target) return source.box;
  if (source.pairs.has(target)) return source.pairs.get(target);
  const box = {
    left: Infinity,
    right: -Infinity,
    top: Infinity,
    bottom: -Infinity,
  };
  const weights = new Float64Array(source.points.length);
  for (let row = 0; row <= 30; row++)
    for (let column = 0; column <= 24; column++) {
      const px = source.left + (column / 24) * source.width;
      const py = source.top + (row / 30) * source.height;
      let sx = 0,
        sy = 0,
        tx = 0,
        ty = 0,
        total = 0;
      for (let i = 0; i < source.points.length; i++) {
        const dx = px - source.points[i][0],
          dy = py - source.points[i][1];
        const distance = dx * dx + dy * dy;
        const weight = 1 / Math.max(0.000001, distance * distance);
        weights[i] = weight;
        sx += source.points[i][0] * weight;
        sy += source.points[i][1] * weight;
        tx += target.points[i][0] * weight;
        ty += target.points[i][1] * weight;
        total += weight;
      }
      sx /= total;
      sy /= total;
      tx /= total;
      ty /= total;
      let a = 0,
        b = 0,
        spread = 0;
      for (let i = 0; i < source.points.length; i++) {
        const x = source.points[i][0] - sx,
          y = source.points[i][1] - sy;
        const u = target.points[i][0] - tx,
          v = target.points[i][1] - ty;
        a += weights[i] * (x * u + y * v);
        b += weights[i] * (x * v - y * u);
        spread += weights[i] * (x * x + y * y);
      }
      a /= Math.max(spread, 0.000001);
      b /= Math.max(spread, 0.000001);
      const x = tx + a * (px - sx) - b * (py - sy);
      const y = ty + b * (px - sx) + a * (py - sy);
      box.left = Math.min(box.left, x);
      box.right = Math.max(box.right, x);
      box.top = Math.min(box.top, y);
      box.bottom = Math.max(box.bottom, y);
    }
  source.pairs.set(target, Object.freeze(box));
  return box;
}

export function fluidVisibleBodyBounds(
  body,
  actor,
  metadata,
  mirrored = false,
  ratio = 2 / 3,
) {
  if (!body.fluid || !metadata || !hasClassicActionArt(actor))
    return classicBodyBounds(body, ratio);
  const from = poseLayout(metadata, actor, body.fluid.from);
  const to = poseLayout(metadata, actor, body.fluid.to);
  const t = clamp(body.fluid.mix);
  const boxes = [];
  const interpolate = (a, b) =>
    Object.fromEntries(
      ["left", "right", "top", "bottom"].map((key) => [
        key,
        mix(a[key], b[key], t),
      ]),
    );
  if (1 - t >= 0.0001) boxes.push(interpolate(from.box, warpedBox(from, to)));
  if (t >= 0.0001) boxes.push(interpolate(warpedBox(to, from), to.box));
  if (!boxes.length) boxes.push(from.box);
  const box = {
    left: clamp(Math.min(...boxes.map((b) => b.left))),
    right: clamp(Math.max(...boxes.map((b) => b.right))),
    top: clamp(Math.min(...boxes.map((b) => b.top))),
    bottom: clamp(Math.max(...boxes.map((b) => b.bottom))),
  };
  const result = {
    left: Infinity,
    right: -Infinity,
    bottom: Infinity,
    top: -Infinity,
  };
  const cosine = Math.cos(body.rz),
    sine = Math.sin(body.rz),
    scale = body.scale || 1;
  for (const u of [box.left, box.right])
    for (const v of [box.top, box.bottom]) {
      const x = (u - 0.5) * body.drawWidth * scale * (mirrored ? -1 : 1);
      const y = (0.5 - v) * body.drawHeight * scale;
      const px = body.x + x * cosine - y * sine;
      const py = body.y + x * sine + y * cosine;
      result.left = Math.min(result.left, px);
      result.right = Math.max(result.right, px);
      result.bottom = Math.min(result.bottom, py);
      result.top = Math.max(result.top, py);
    }
  // Covers the renderer's subtle weight shift, filtering and floating-point
  // differences without framing transparent padding from unrelated poses.
  return {
    left: result.left - 0.035,
    right: result.right + 0.035,
    bottom: result.bottom - 0.035,
    top: result.top + 0.035,
  };
}

function cueTimes(cue, incoming, duration) {
  const list = incoming
    ? [0.29]
    : (cue?.camera?.impacts || []).filter(
        (at) => Number.isFinite(at) && at > 0 && at < 0.92,
      );
  const contacts = [...new Set(list)].sort((a, b) => a - b).slice(0, 2);
  const physical =
    cue?.attacking === undefined
      ? finite(cue?.damage) > 0 || finite(cue?.blocked) > 0
      : !!cue.attacking;
  const first = contacts[0] ?? 0.55;
  const last = contacts.at(-1) ?? first;
  // Presentation hitstop stays within two 60 Hz frames. Event timestamps and
  // cue duration remain unchanged; a hold never delays game resolution.
  const hold = physical
    ? Math.min(1000 / 30, Math.max(0, finite(cue?.camera?.hitstop, 24))) /
      duration
    : 0;
  return {
    contacts: physical ? (contacts.length ? contacts : [first]) : [],
    first,
    last,
    hold,
    recover: Math.min(0.89, Math.max(last + hold + 0.15, 0.74)),
  };
}

function fixedCanvas(actor, metadata) {
  if (!hasClassicActionArt(actor) || metadata?.id !== actorId(actor))
    return null;
  const ready = classicActionGeometry(metadata, "ready");
  if (!ready) return null;
  const poses = CLASSIC_ACTION_POSES.map((pose) =>
    classicActionGeometry(metadata, pose),
  );
  return Object.freeze({
    width: Math.max(...poses.map((pose) => pose.worldWidth)),
    height: Math.max(...poses.map((pose) => pose.worldHeight)),
    referenceHeight: ready.referenceHeight,
  });
}

function baseFrame(cue, progress, options) {
  return applyClassicActionFrame(
    classicCombatFrame(cue, progress, options),
    cue,
    progress,
    options,
  );
}

// Rebase a tight crop into a fixed canvas, preserving the exact world location
// of its boot/bottom anchor under both mirroring and whole-body rotation.
function reframe(body, canvas) {
  if (!canvas) return body;
  const height = body.drawHeight || 3;
  const shift = ((canvas.height - height) * (body.scale || 1)) / 2;
  return {
    ...body,
    x: body.x - Math.sin(body.rz || 0) * shift,
    y: body.y + Math.cos(body.rz || 0) * shift,
    drawWidth: canvas.width,
    drawHeight: canvas.height,
  };
}

function poseWindows(kind, times, duration, defender = false, damaged = true) {
  const windows = [];
  let pose = "ready",
    previousEnd = 0;
  const add = (to, finish, milliseconds = 260) => {
    const end = clamp(Math.max(previousEnd, finish));
    if (to === pose || end <= previousEnd) return;
    const start = Math.max(previousEnd, end - milliseconds / duration);
    windows.push(Object.freeze({ from: pose, to, start, end }));
    pose = to;
    previousEnd = end;
  };
  const { first, last, recover, contacts } = times;
  if (defender) {
    if (["focus", "guard", "hurt"].includes(kind)) return windows;
    add("guard", Math.min(first * 0.5, 0.25), 240);
    if (damaged) add("hurt", first, 220);
    add("guard", Math.min(0.94, recover + 0.075), 280);
  } else if (["elbow", "kick"].includes(kind)) {
    const windup = Math.min(first * 0.55, 350 / duration);
    if (windup * duration >= 180) add("windup", windup, 280);
    const hits = contacts.length ? contacts : [first];
    hits.forEach((at, index) => {
      add(kind, at, 240);
      const next = hits[index + 1];
      if (next && (next - at) * duration > 420)
        add("windup", (at + next) / 2, 200);
    });
    add("windup", Math.min(0.93, recover + 0.065), 260);
  } else if (["powerbomb", "slam", "suplex"].includes(kind)) {
    add("clinch", first * 0.34, 280);
    add(
      kind === "suplex" ? "suplex" : "lift",
      first * (kind === "slam" ? 0.72 : 0.76),
      300,
    );
    add("slam", first, 300);
    add("clinch", Math.min(0.93, recover + 0.075), 300);
  } else if (["armbar", "leglock", "clinch"].includes(kind)) {
    add("clinch", first * 0.4, 280);
    add(kind, first, 320);
    add("clinch", Math.min(0.93, Math.max(last + 0.1, recover + 0.075)), 300);
  } else {
    add(kind === "focus" ? "windup" : kind, Math.min(first, 0.32), 280);
  }
  add("ready", 1, 280);
  return Object.freeze(windows);
}

export function fluidPoseBlend(windows, progress) {
  let current = "ready";
  for (const window of windows) {
    if (progress < window.start) return { from: current, to: current, mix: 0 };
    if (progress <= window.end)
      return {
        from: window.from,
        to: window.to,
        mix: fluidEase(
          (progress - window.start) / Math.max(1e-9, window.end - window.start),
        ),
      };
    current = window.to;
  }
  return { from: current, to: current, mix: 0 };
}

function sampleKnots(knots, values, stopTimes) {
  return knots.map((at, i) => {
    const stop =
      stopTimes.some((time) => Math.abs(time - at) < 1e-9) ||
      i === 0 ||
      i === knots.length - 1;
    const channels = {};
    for (const channel of CHANNELS) {
      const value = values[i][channel];
      let velocity = 0,
        acceleration = 0;
      if (!stop) {
        const before = (value - values[i - 1][channel]) / (at - knots[i - 1]);
        const after = (values[i + 1][channel] - value) / (knots[i + 1] - at);
        // Monotone slopes avoid overshoot when a planted foot changes direction.
        velocity =
          before * after > 0 ? (2 * before * after) / (before + after) : 0;
        acceleration = (2 * (after - before)) / (knots[i + 1] - knots[i - 1]);
        acceleration = clamp(acceleration, -180, 180);
      }
      channels[channel] = Object.freeze({ value, velocity, acceleration });
    }
    return Object.freeze({ at, channels });
  });
}

// Quintic Hermite interpolation shares position, velocity and acceleration at
// both ends, so no new motion clock or discrete pose-size step is introduced.
export function sampleFluidTrack(track, progress) {
  const p = clamp(finite(progress));
  if (p <= track[0].at)
    return Object.fromEntries(
      CHANNELS.map((key) => [key, track[0].channels[key].value]),
    );
  let right = track.findIndex((knot) => knot.at >= p);
  if (right < 0) right = track.length - 1;
  const a = track[Math.max(0, right - 1)],
    b = track[right];
  const span = b.at - a.at;
  const u = span > 0 ? (p - a.at) / span : 1;
  const result = {};
  for (const key of CHANNELS) {
    const start = a.channels[key],
      end = b.channels[key];
    const delta = end.value - start.value;
    const v0 = start.velocity * span,
      v1 = end.velocity * span;
    const a0 = start.acceleration * span * span,
      a1 = end.acceleration * span * span;
    const c3 = 10 * delta - 6 * v0 - 4 * v1 - 1.5 * a0 + 0.5 * a1;
    const c4 = -15 * delta + 8 * v0 + 7 * v1 + 1.5 * a0 - a1;
    const c5 = 6 * delta - 3 * v0 - 3 * v1 - 0.5 * a0 + 0.5 * a1;
    result[key] =
      start.value +
      v0 * u +
      0.5 * a0 * u * u +
      c3 * u ** 3 +
      c4 * u ** 4 +
      c5 * u ** 5;
  }
  return result;
}

export function createFluidCombatTimeline(cue, options = {}) {
  const duration = Math.max(300, finite(cue?.duration, 2600));
  const actors = options.actors || [];
  const metadata = options.metadata || [];
  const fixed = actors.map((actor, i) => fixedCanvas(actor, metadata[i]));
  const times = cueTimes(cue, options.incoming, duration);
  const sourceCue = cue
    ? { ...cue, camera: { ...cue.camera, hitstop: times.hold * duration } }
    : null;
  const kind = classicActionKind(cue);
  // Both damaging and utility holds lower the opponent along the same controlled
  // path. Starting from the old damage-only quarter-turn and then changing its
  // sign for a leglock caused a needless half-spin through the mat.
  const motionCue =
    sourceCue && ["armbar", "leglock"].includes(kind)
      ? {
          ...sourceCue,
          attacking: false,
          damage: 0,
          blocked: 0,
          effect: { ...sourceCue.effect, family: "tactics" },
          camera: { ...sourceCue.camera, impacts: [] },
        }
      : sourceCue;
  const attacker = ["player", "enemy"].includes(cue?.attacker)
    ? cue.attacker
    : options.incoming
      ? "enemy"
      : "player";
  const windows = SIDES.map((side) =>
    poseWindows(
      kind,
      times,
      duration,
      side !== attacker,
      finite(cue?.damage) > 0,
    ),
  );
  const raw = (p) => {
    const frame = baseFrame(motionCue, clamp(p), options);
    return SIDES.map((side, i) => reframe(frame[side], fixed[i]));
  };
  const filterWidth = Math.min(0.09, 120 / duration);
  const hitWindow = Math.min(0.11, 155 / duration);
  const nearHit = (p) =>
    times.contacts.some(
      (at) => p > at - hitWindow && p < at + times.hold + hitWindow,
    );
  const stepCount = Math.max(18, Math.ceil(duration / 75));
  const candidates = [0, 1];
  for (let i = 1; i < stepCount; i++)
    if (!nearHit(i / stepCount)) candidates.push(i / stepCount);
  const stops = [0, 1];
  for (const at of times.contacts) {
    candidates.push(
      clamp(at - hitWindow),
      at,
      at + times.hold,
      clamp(at + times.hold + hitWindow),
    );
    stops.push(at, at + times.hold);
  }
  const knots = [
    ...new Set(candidates.map((p) => Math.round(p * 1e9) / 1e9)),
  ].sort((a, b) => a - b);
  const smoothed = knots.map((p) => {
    const exact = p === 0 || p === 1;
    const contact = times.contacts.find(
      (at) => p >= at - 1e-8 && p <= at + times.hold + 1e-8,
    );
    if (exact || contact !== undefined) return raw(contact ?? p);
    const accum = SIDES.map(() =>
      Object.fromEntries(CHANNELS.map((key) => [key, 0])),
    );
    let total = 0;
    for (let sample = -4; sample <= 4; sample++) {
      const offset = sample / 4;
      const weight = Math.exp(-offset * offset * 2.6);
      const values = raw(p + offset * filterWidth);
      values.forEach((value, side) =>
        CHANNELS.forEach((key) => {
          accum[side][key] +=
            finite(value[key], key === "scale" ? 1 : 0) * weight;
        }),
      );
      total += weight;
    }
    return accum.map((channels) =>
      Object.fromEntries(CHANNELS.map((key) => [key, channels[key] / total])),
    );
  });
  const tracks = SIDES.map((_, i) =>
    Object.freeze(
      sampleKnots(
        knots,
        smoothed.map((pair) => pair[i]),
        stops,
      ),
    ),
  );
  const timeline = {
    cue,
    sourceCue,
    options,
    duration,
    kind,
    attacker,
    fixed,
    times,
    windows,
    knots: Object.freeze(knots),
    tracks: Object.freeze(tracks),
  };
  // Frame the actual connected pose surfaces, rather than transparent padding
  // from the largest unrelated pose in the fixed rendering canvas.
  const bounds = {
    left: Infinity,
    right: -Infinity,
    bottom: Infinity,
    top: -Infinity,
  };
  for (let step = 0; step <= 120; step++) {
    const frame = fluidCombatFrame(timeline, step / 120);
    SIDES.forEach((side, i) => {
      const box = fluidVisibleBodyBounds(
        frame[side],
        actors[i],
        metadata[i],
        i === 1,
        options.bodyRatios?.[i],
      );
      bounds.left = Math.min(bounds.left, box.left);
      bounds.right = Math.max(bounds.right, box.right);
      bounds.bottom = Math.min(bounds.bottom, box.bottom);
      bounds.top = Math.max(bounds.top, box.top);
    });
  }
  timeline.bounds = Object.freeze(bounds);
  return Object.freeze(timeline);
}

export function fluidCombatFrame(timeline, progress, { still = false } = {}) {
  const p = clamp(finite(progress));
  const options = { ...timeline.options, still };
  const frame = baseFrame(timeline.cue, p, options);
  if (still || !timeline.cue) return frame;
  const accent = baseFrame(timeline.sourceCue, p, options);
  frame.contact = accent.contact;
  frame.camera = accent.camera;
  SIDES.forEach((side, i) => {
    const canvas = timeline.fixed[i];
    if (!canvas) return;
    const transform = sampleFluidTrack(timeline.tracks[i], p);
    const blend = fluidPoseBlend(timeline.windows[i], p);
    const contact = timeline.times.contacts.find(
      (at) => p >= at && p <= at + timeline.times.hold,
    );
    const clock = contact ?? p;
    const envelope =
      fluidEase(clock / 0.09) * (1 - fluidEase((clock - 0.88) / 0.12));
    const paired = ["armbar", "leglock"].includes(timeline.kind);
    frame[side] = {
      ...frame[side],
      ...transform,
      drawWidth: canvas.width,
      drawHeight: canvas.height,
      actionPose: blend.mix < 0.5 ? blend.from : blend.to,
      fluid: {
        ...blend,
        referenceHeight: canvas.referenceHeight,
        anchor: "feet",
        sway:
          Math.sin(clock * Math.PI * 4 + i * Math.PI) *
          envelope *
          (paired ? 0.003 : 0.012),
        compress:
          Math.sin(clock * Math.PI * 2) ** 2 *
          envelope *
          (paired ? 0.003 : 0.01),
      },
    };
  });
  return frame;
}
