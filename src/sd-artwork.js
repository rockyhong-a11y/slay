// Complete illustration sprites: exact whole-pose rectangles, equal-cell fallback.
const ATTACK = new Set(["strike", "grapple", "slam", "submission"]);
const HURT = new Set(["hurt", "groggy"]);
const number = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

export function sdSpriteFrame(pose = "idle") {
  return ATTACK.has(pose) ? 1 : HURT.has(pose) ? 2 : 0;
}

export function sdSpriteGeometry(width, height, pose = "idle", frames) {
  const imageWidth = Math.max(3, number(width, 2048));
  const imageHeight = Math.max(1, number(height, 1024));
  const cellWidth = imageWidth / 3;
  const frame = sdSpriteFrame(pose);
  const equal = [0, 1, 2].map((index) => ({
    x: index * cellWidth,
    y: 0,
    width: cellWidth,
    height: imageHeight,
  }));
  const valid =
    Array.isArray(frames) &&
    frames.length === 3 &&
    frames.every(
      (r) =>
        [r?.x, r?.y, r?.width, r?.height].every(Number.isFinite) &&
        r.x >= 0 &&
        r.y >= 0 &&
        r.width > 0 &&
        r.height > 0 &&
        r.x + r.width <= imageWidth + 0.01 &&
        r.y + r.height <= imageHeight + 0.01,
    );
  const rectangles = valid ? frames : equal;
  const source = rectangles[frame];
  const shared = {
    width: Math.max(...rectangles.map((r) => r.width)),
    height: Math.max(...rectangles.map((r) => r.height)),
  };
  const px =
    imageWidth === source.width
      ? 0
      : (source.x / (imageWidth - source.width)) * 100;
  const py =
    imageHeight === source.height
      ? 0
      : (source.y / (imageHeight - source.height)) * 100;
  return {
    frame,
    cellRatio: source.width / source.height,
    sharedRatio: shared.width / shared.height,
    shared,
    source,
    backgroundSize: `${(imageWidth / source.width) * 100}% ${(imageHeight / source.height) * 100}%`,
    backgroundPosition: `${px}% ${py}%`,
    exact: valid,
  };
}

export function sdArtworkRect(
  width,
  height,
  cellRatio,
  {
    portrait = false,
    center = [0.55, 0.3],
    cropWidth = 0.68,
    source,
    shared,
  } = {},
) {
  const w = Math.max(0, number(width));
  const h = Math.max(0, number(height));
  const ratio = Math.max(0.1, number(cellRatio, 2 / 3));
  if (portrait) {
    const imageWidth = w / Math.max(0.1, number(cropWidth, 0.68));
    const imageHeight = imageWidth / ratio;
    return {
      width: imageWidth,
      height: imageHeight,
      left: w / 2 - number(center[0], 0.5) * imageWidth,
      top: h / 2 - number(center[1], 0.2) * imageHeight,
    };
  }
  if (source && shared) {
    const unit = Math.min(w / shared.width, h / shared.height);
    const imageWidth = source.width * unit,
      imageHeight = source.height * unit;
    return {
      width: imageWidth,
      height: imageHeight,
      left: (w - imageWidth) / 2,
      top: h - imageHeight,
    };
  }
  const imageWidth = Math.min(w, h * ratio);
  const imageHeight = imageWidth / ratio;
  return {
    width: imageWidth,
    height: imageHeight,
    left: (w - imageWidth) / 2,
    top: (h - imageHeight) / 2,
  };
}

export function sdBodyBounds(body, ratio = 2 / 3) {
  const scale = Math.max(0.1, number(body?.scale, 1));
  const angle = number(body?.rz);
  const halfHeight = 1.5 * scale;
  const halfWidth = halfHeight * Math.max(0.1, number(ratio, 2 / 3));
  const ex =
    Math.abs(Math.cos(angle)) * halfWidth +
    Math.abs(Math.sin(angle)) * halfHeight;
  const ey =
    Math.abs(Math.sin(angle)) * halfWidth +
    Math.abs(Math.cos(angle)) * halfHeight;
  const x = number(body?.x),
    y = number(body?.y, 1.5);
  return { left: x - ex, right: x + ex, bottom: y - ey, top: y + ey };
}

// Fit complete rotated silhouettes, including a lifted powerbomb and landing.
export function sdSceneProjection(
  width,
  height,
  frame,
  ratios = [2 / 3, 2 / 3],
  cinematic = false,
) {
  const w = Math.max(1, number(width, 1)),
    h = Math.max(1, number(height, 1));
  const boxes = [
    sdBodyBounds(frame?.player, ratios[0]),
    sdBodyBounds(frame?.enemy, ratios[1]),
  ];
  const left = Math.min(...boxes.map((b) => b.left)),
    right = Math.max(...boxes.map((b) => b.right));
  const bottom = Math.min(...boxes.map((b) => b.bottom)),
    top = Math.max(...boxes.map((b) => b.top));
  const fieldWidth = Math.max(cinematic ? 3.8 : 5.5, right - left);
  const fieldHeight = Math.max(cinematic ? 3.25 : 3.4, top - bottom);
  const zoom = Math.max(1, number(frame?.camera?.zoom, 1));
  // The larger arena can frame the wrestlers more closely during a live turn.
  // Replays retain their existing camera, and the safe fit still reserves space
  // for every complete rotated or elevated silhouette.
  const preferred =
    Math.min(
      (w * (cinematic ? 0.83 : 0.92)) / fieldWidth,
      (h * (cinematic ? 0.85 : 0.91)) / fieldHeight,
    ) * zoom;
  const safe = Math.min((w * 0.94) / fieldWidth, (h * 0.94) / fieldHeight);
  const centerX = cinematic
    ? (left + right) / 2
    : Math.max(right - fieldWidth / 2, Math.min(left + fieldWidth / 2, 0));
  const centerY = cinematic
    ? (bottom + top) / 2
    : Math.max(top - fieldHeight / 2, Math.min(bottom + fieldHeight / 2, 1.65));
  return {
    width: w,
    height: h,
    unit: Math.min(preferred, safe),
    centerX,
    centerY,
    shakeX: number(frame?.camera?.shakeX),
    shakeY: number(frame?.camera?.shakeY),
  };
}

export function sdScreenPoint(x, y, p) {
  return {
    x: p.width / 2 + (number(x) - p.centerX + p.shakeX) * p.unit,
    y: p.height / 2 - (number(y) - p.centerY + p.shakeY) * p.unit,
  };
}
