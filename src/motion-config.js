export const motionTokens = {
  duration: { instant: 0.08, fast: 0.18, normal: 0.35, slow: 0.6 },
  easing: { smooth: [0.22, 1, 0.36, 1] },
  art: { transition: 0.55, maximumDelta: 0.05, framesPerSecond: 30 },
};

export const CONDITION_MOTION = {
  normal: { breath: 1, head: 0.65, hair: 0.8, tempo: 1 },
  excited: { breath: 1.2, head: 1, hair: 1.1, tempo: 1.15 },
  fiery: { breath: 1.45, head: 1.15, hair: 1.25, tempo: 1.2 },
  frustrated: { breath: 0.85, head: 0.8, hair: 0.7, tempo: 0.8 },
  tired: { breath: 1.65, head: 0.45, hair: 0.45, tempo: 0.7 },
  groggy: { breath: 1.25, head: 0.25, hair: 0.3, tempo: 0.6 },
};

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const smoothstep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
export const approach = (current, target, delta, speed = 6) =>
  current + (target - current) * (1 - Math.exp(-speed * delta));
export const artSeed = (key) =>
  Array.from(key).reduce(
    (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0,
    7,
  ) / 4294967295;

export function blinkAt(time, seed = 0) {
  const cycle = 3.7 + seed * 2.1;
  const local = (time + seed * 9) % cycle;
  if (local > 0.22) return 0;
  return Math.sin((Math.PI * local) / 0.22) ** 2;
}

export function motionAt(
  time,
  seed,
  profile = CONDITION_MOTION.normal,
  gaze = [0, 0],
) {
  const phase = seed * Math.PI * 2;
  const pace = time * 1.75;
  return {
    breath: Math.sin(pace + phase) * profile.breath,
    head:
      (Math.sin(time * 0.68 + phase) * 0.45 + gaze[0] * 0.55) * profile.head,
    nod:
      (Math.sin(time * 0.54 + phase + 1.2) * 0.4 + gaze[1] * 0.35) *
      profile.head,
    hair:
      (Math.sin(time * 0.68 + phase - 0.75) * 0.55 +
        Math.sin(time * 1.31 + phase) * 0.2 +
        gaze[0] * 0.25) *
      profile.hair,
    arm: Math.sin(pace + phase + 0.7) * profile.breath,
    aura: Math.sin(time * 0.7 + phase),
    blink: blinkAt(time, seed),
  };
}

export function partVector(part, frame) {
  const signal = frame[part.motion] || 0;
  const dx = (part.amount?.[0] || 0) * signal;
  const dy =
    (part.amount?.[1] || 0) * (part.motion === "head" ? frame.nod : signal);
  return [
    dx,
    dy,
    (part.twist || 0) * signal,
    part.motion === "breath" ? signal * 0.008 : 0,
  ];
}

// The same local deformation powers WebGL and the Canvas fallback.
export function deformPoint(point, parts, vectors) {
  let x = point[0],
    y = point[1];
  parts.forEach((part, index) => {
    const nx = (point[0] - part.center[0]) / part.radius[0];
    const ny = (point[1] - part.center[1]) / part.radius[1];
    const weight = Math.max(0, 1 - Math.hypot(nx, ny)) ** 2;
    const vector = vectors[index];
    x +=
      weight *
      (vector[0] -
        (point[1] - part.center[1]) * vector[2] +
        (point[0] - part.center[0]) * vector[3]);
    y += weight * (vector[1] + (point[0] - part.center[0]) * vector[2]);
  });
  return [x, y];
}

export function fitArt(
  width,
  height,
  sourceWidth,
  sourceHeight,
  fit = "contain",
  position = [0.5, 0.5],
) {
  const ratio =
    fit === "cover"
      ? Math.max(width / sourceWidth, height / sourceHeight)
      : Math.min(width / sourceWidth, height / sourceHeight);
  const w = sourceWidth * ratio,
    h = sourceHeight * ratio;
  return {
    x: (width - w) * position[0],
    y: (height - h) * position[1],
    width: w,
    height: h,
  };
}
