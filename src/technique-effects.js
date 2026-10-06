// Every replay is a finite choreography of the complete card illustration.
// Normalized focal points were reviewed against each 1024×683 card image.
// Throw targets mark the visible/anticipated mat contact; grip marks the hands.
// These overlays describe a technique, never resolve damage or mutate a run.
const profile = (family, variant, label, target, extra = {}) => ({
  family,
  variant,
  label,
  target,
  direction: 1,
  strength: 1,
  ...extra,
});

export const CARD_EFFECT_PROFILES = {
  wristlock: profile(
    "submission",
    "wristlock",
    "손목 제압 · 다음 기술 할인",
    [0.43, 0.43],
  ),
  hammerlock: profile(
    "submission",
    "hammerlock",
    "등 뒤 팔 고정 · 가드와 드로우",
    [0.5, 0.43],
  ),
  omoplata: profile(
    "submission",
    "omoplata",
    "어깨 제압 · 큰 기술 준비",
    [0.52, 0.47],
  ),
  octopushold: profile(
    "submission",
    "octopus",
    "팔과 다리 고정 · 행동력 회복",
    [0.53, 0.39],
  ),
  surfboard: profile(
    "submission",
    "surfboard",
    "양팔 제어 · 다음 패 확보",
    [0.52, 0.44],
  ),
  stf: profile(
    "submission",
    "stf",
    "상체와 다리 봉쇄 · 행동력 회복",
    [0.54, 0.51],
  ),
  toehold: profile(
    "submission",
    "toehold",
    "발목 제압 · 가벼운 패 순환",
    [0.51, 0.54],
  ),
  calfslicer: profile(
    "submission",
    "calfslicer",
    "하체 봉쇄 · 할인과 드로우",
    [0.52, 0.54],
  ),
  bowandarrow: profile(
    "submission",
    "bow-and-arrow",
    "등과 팔다리 제어 · 행동력 확보",
    [0.5, 0.49],
  ),
  abdominalstretch: profile(
    "submission",
    "abdominal",
    "측면 홀드 · 열기와 드로우",
    [0.53, 0.46],
  ),
  strike: profile("strike", "elbow", "짧은 팔꿈치 타격", [0.59, 0.19]),
  redline: profile("strike", "running", "돌진 · 팔뚝 타격", [0.65, 0.2], {
    strength: 1.35,
  }),
  shoulder: profile(
    "strike",
    "tackle",
    "중심을 무너뜨리는 충돌",
    [0.63, 0.27],
    {
      strength: 1.2,
      angle: 12,
    },
  ),
  flashstep: profile(
    "strike",
    "sidestep",
    "사이드 스텝 · 빠른 타격",
    [0.63, 0.24],
    { direction: 1, strength: 0.8 },
  ),
  doubletap: profile("strike", "one-two", "잽 → 스트레이트", [0.68, 0.22], {
    angle: -6,
  }),
  dropkick: profile("strike", "dropkick", "도약 · 양발 타격", [0.755, 0.27], {
    angle: -18,
    strength: 1.3,
  }),
  finisher: profile("strike", "flying-knee", "도약 · 플라잉 니", [0.6, 0.29], {
    angle: -28,
    strength: 1.5,
  }),
  moonsault: profile("grapple", "aerial", "공중 회전 → 착지", [0.62, 0.9], {
    grip: [0.4, 0.25],
    direction: -1,
    strength: 1.3,
  }),
  championship: profile(
    "grapple",
    "driver",
    "양어깨에 싣기 → 드라이버",
    [0.6, 0.93],
    { grip: [0.525, 0.25], strength: 1.55 },
  ),
  suplex: profile(
    "grapple",
    "suplex",
    "허리 잠금 → 뒤로 넘기기",
    [0.73, 0.89],
    { grip: [0.54, 0.43], direction: -1 },
  ),
  powerbomb: profile(
    "grapple",
    "powerbomb",
    "높이 들기 → 매트 충돌",
    [0.49, 0.94],
    { grip: [0.485, 0.385], strength: 1.35 },
  ),
  sitoutpowerbomb: profile(
    "grapple",
    "sitout",
    "들어 올리기 → 앉아 내리꽂기",
    [0.625, 0.86],
    { grip: [0.5, 0.46], strength: 1.15 },
  ),
  jackknifepowerbomb: profile(
    "grapple",
    "jackknife",
    "최고점 → 수직 낙하",
    [0.55, 0.84],
    { grip: [0.48, 0.48], strength: 1.55 },
  ),
  popuppowerbomb: profile(
    "grapple",
    "popup",
    "위로 띄우기 → 받아 내리꽂기",
    [0.48, 0.94],
    { grip: [0.49, 0.35], strength: 1.3 },
  ),
  gutwrenchpowerbomb: profile(
    "grapple",
    "gutwrench",
    "복부 잠금 → 회전 낙하",
    [0.29, 0.92],
    { grip: [0.475, 0.31], direction: -1, strength: 1.2 },
  ),
  foldingpowerbomb: profile(
    "grapple",
    "folding",
    "내리꽂기 → 접어 누르기",
    [0.38, 0.82],
    { grip: [0.515, 0.57], strength: 1.4 },
  ),
  bodyslam: profile("grapple", "bodyslam", "들어 뒤집기 → 슬램", [0.6, 0.94], {
    grip: [0.535, 0.3],
    strength: 0.85,
  }),
  powerslam: profile("grapple", "powerslam", "회전 → 파워 슬램", [0.38, 0.83], {
    grip: [0.53, 0.48],
    strength: 1.25,
  }),
  sidewalkslam: profile(
    "grapple",
    "sidewalk",
    "옆으로 싣기 → 슬램",
    [0.25, 0.82],
    { grip: [0.58, 0.42], direction: -1, strength: 0.9 },
  ),
  spinebuster: profile(
    "grapple",
    "spinebuster",
    "허리 진입 → 매트 충돌",
    [0.64, 0.93],
    { grip: [0.6, 0.47], strength: 1.3 },
  ),
  bellysuplex: profile(
    "grapple",
    "belly-suplex",
    "정면 잠금 → 머리 위로 넘기기",
    [0.78, 0.92],
    { grip: [0.55, 0.32], direction: -1, strength: 1.15 },
  ),
  snapsuplex: profile(
    "grapple",
    "snap",
    "짧게 들기 → 빠른 수플렉스",
    [0.37, 0.88],
    { direction: -1, grip: [0.45, 0.36], strength: 0.9 },
  ),
  samoandrop: profile(
    "grapple",
    "samoan",
    "어깨에 싣기 → 함께 낙하",
    [0.59, 0.94],
    { grip: [0.55, 0.33], direction: 1, strength: 1.25 },
  ),
  armdrag: profile(
    "grapple",
    "armdrag",
    "팔을 당겨 중심 넘기기",
    [0.27, 0.83],
    { direction: -1, grip: [0.73, 0.4], strength: 0.75 },
  ),
  grapple: profile("grapple", "clinch", "목과 팔의 주도권 다툼", [0.5, 0.3], {
    grounded: true,
  }),
  collartie: profile(
    "grapple",
    "collar-tie",
    "목 뒤를 잡아 거리 통제",
    [0.46, 0.24],
    { grounded: true },
  ),
  waistlock: profile(
    "grapple",
    "waist-lock",
    "허리를 감아 다음 기술 준비",
    [0.54, 0.385],
    { grounded: true },
  ),
  headlock: profile(
    "submission",
    "headlock",
    "머리 · 목 주변 고정",
    [0.435, 0.3],
    { pressure: 0.95 },
  ),
  armbar: profile("submission", "armbar", "팔꿈치 관절 고정", [0.68, 0.71], {
    pressure: 1.15,
    angle: -18,
  }),
  kimura: profile(
    "submission",
    "kimura",
    "어깨 관절 · 안쪽 회전",
    [0.41, 0.5],
    { direction: -1, angle: -24 },
  ),
  americana: profile(
    "submission",
    "americana",
    "어깨 관절 · 바깥쪽 회전",
    [0.24, 0.65],
    { angle: 24 },
  ),
  anklelock: profile("submission", "anklelock", "발목 관절 고정", [0.34, 0.4], {
    pressure: 1.1,
    angle: 10,
  }),
  kneebar: profile("submission", "kneebar", "무릎 관절 고정", [0.39, 0.48], {
    pressure: 1.2,
    angle: -16,
  }),
  heelhook: profile(
    "submission",
    "heelhook",
    "뒤꿈치 고정 · 회전 압박",
    [0.645, 0.38],
    { direction: -1, angle: -32 },
  ),
  figurefour: profile(
    "submission",
    "figure-four",
    "두 다리 교차 · 관절 압박",
    [0.515, 0.49],
    { pressure: 1.2, angle: 18 },
  ),
  bostoncrab: profile(
    "submission",
    "boston-crab",
    "양다리 고정 · 허리 압박",
    [0.435, 0.655],
    { pressure: 0.9 },
  ),
  sharpshooter: profile(
    "submission",
    "sharpshooter",
    "다리 교차 · 지속 압박",
    [0.34, 0.45],
    { pressure: 1.4, strength: 1.4 },
  ),
  crossface: profile(
    "submission",
    "crossface",
    "팔을 묶고 상체 고정",
    [0.515, 0.475],
    { angle: -14 },
  ),
  ironclad: profile(
    "submission",
    "iron-clutch",
    "팔을 고정하고 가드 확보",
    [0.525, 0.32],
    { pressure: 1.1 },
  ),
  reversal: profile(
    "submission",
    "counter-lock",
    "되잡기 → 역전 홀드",
    [0.37, 0.405],
    { direction: -1, angle: 22 },
  ),
  guard: profile("defense", "brace", "가드 세우기", [0.33, 0.29]),
  steelwill: profile(
    "defense",
    "steel-will",
    "가드 · 호흡 안정",
    [0.55, 0.31],
    {
      calm: true,
    },
  ),
  ringcraft: profile(
    "defense",
    "ringcraft",
    "거리 계산 · 다음 공격 준비",
    [0.34, 0.32],
    { setup: true },
  ),
  comeback: profile(
    "defense",
    "comeback",
    "일어서기 · 가드 재정비",
    [0.35, 0.36],
    { strength: 1.35 },
  ),
  focus: profile("tactics", "breath", "호흡 · 다음 수 찾기", [0.49, 0.32], {
    calm: true,
    draw: true,
  }),
  spotlight: profile(
    "tactics",
    "spotlight",
    "관중의 시선 · 열기 확보",
    [0.47, 0.34],
    { crowd: true, draw: true },
  ),
  rally: profile("tactics", "rally", "응원 · 자신감 회복", [0.5, 0.31], {
    crowd: true,
    calm: true,
  }),
  quickdraw: profile(
    "tactics",
    "quickdraw",
    "템포 · 에너지 확보",
    [0.42, 0.3],
    {
      draw: true,
      direction: -1,
    },
  ),
  encore: profile("tactics", "encore", "관중 호응 · 손패 보충", [0.28, 0.34], {
    crowd: true,
    draw: true,
  }),
  nightmare: profile(
    "nightmare",
    "release",
    "악몽을 걷어내고 진정",
    [0.555, 0.64],
    { calm: true },
  ),
};

const fallbackFamilies = { throw: "grapple", aerial: "grapple" };
export function techniqueEffectProfile(cardId, discipline = "tactics") {
  const found =
    CARD_EFFECT_PROFILES[cardId] ||
    profile(
      fallbackFamilies[discipline] || discipline,
      "ready",
      "기술 준비",
      [0.5, 0.5],
    );
  // A cue owns its arrays: consumers cannot change the next replay.
  return {
    id: `${cardId}-${found.variant}`,
    cardId,
    ...found,
    target: [...found.target],
    ...(found.grip ? { grip: [...found.grip] } : {}),
  };
}

export const TECHNIQUE_EFFECT_MOTION = {
  ease: [0.22, 1, 0.36, 1],
  scoreScale: [0.65, 0.65, 1.12, 1, 1],
  scoreY: [15, 15, 0, -3, -18],
  scoreOpacity: [0, 0, 1, 1, 0],
};

/** Match object-fit/object-position without assuming the viewport's aspect. */
export function artworkProjection(
  width,
  height,
  fit = "contain",
  position = [0.5, 0.5],
) {
  if (!(width > 0 && height > 0))
    return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
  const scale = (fit === "cover" ? Math.max : Math.min)(
    width / 1024,
    height / 683,
  );
  const scaleX = (1024 * scale) / width;
  const scaleY = (683 * scale) / height;
  return {
    scaleX,
    scaleY,
    offsetX: (1 - scaleX) * position[0],
    offsetY: (1 - scaleY) * position[1],
  };
}

export function projectedArtworkPoint(point, projection) {
  return [
    point[0] * projection.scaleX + projection.offsetX,
    point[1] * projection.scaleY + projection.offsetY,
  ];
}

const layer = (
  kind,
  center,
  width,
  times,
  opacity,
  channels = {},
  extra = {},
) => ({
  kind,
  center: [...center],
  width,
  times,
  opacity,
  ...channels,
  ...extra,
});

/** Normalized, finite effect timelines share the cue's camera clock. */
export function techniqueEffectLayers(
  effect,
  camera,
  { attacking = false, damage = 0 } = {},
) {
  if (!effect || !camera) return [];
  const p = effect;
  const target = p.target;
  const layers = [];
  const blocked = attacking && damage === 0;
  // At most two discrete contact flares; pressure effects are sustained light.
  const contacts = camera.impacts.length ? camera.impacts.slice(0, 2) : [0.55];
  const at = contacts.at(-1);
  const end = Math.min(0.98, at + 0.24);
  const direction = p.direction;

  if (p.family === "strike") {
    for (let index = 0; index < 3; index++) {
      const contactIndex = Math.min(index, contacts.length - 1);
      const impact = contacts[contactIndex];
      const width = 46 - index * 8;
      const angle = p.angle ?? -8;
      const radians = (angle * Math.PI) / 180;
      // The flame's tip is 46% of its width from its center. Place that
      // endpoint at the reviewed contact rather than across the victim's face.
      const reach = width * 0.0046;
      layers.push(
        layer(
          "streak",
          [
            target[0] +
              contactIndex * 0.025 -
              reach * Math.cos(radians) * direction,
            target[1] -
              reach * Math.sin(radians) * (1024 / 683) * direction +
              (index - 1) * 0.012,
          ],
          width,
          [
            0,
            Math.max(0.01, impact - 0.18),
            impact,
            Math.min(0.99, impact + 0.07),
            1,
          ],
          [0, 0, 0.8, 0, 0],
          {
            x: [
              -80 * direction,
              -80 * direction,
              0,
              35 * direction,
              35 * direction,
            ],
            scaleX: [0.1, 0.1, 1, 0.6, 0.6],
          },
          { angle, direction },
        ),
      );
    }
    contacts.forEach((contact, index) =>
      layers.push(
        layer(
          blocked ? "shield" : "burst",
          [target[0] + index * 0.025, target[1]],
          25 * p.strength,
          [
            0,
            Math.max(0.01, contact - 0.015),
            contact,
            Math.min(0.98, contact + 0.055),
            Math.min(0.99, contact + 0.15),
            1,
          ],
          [0, 0, blocked ? 0.85 : 0.95, 0.9, 0, 0],
          {
            scale: [0.3, 0.3, 1, 1.05, 1.5, 1.5],
            rotate: [
              0,
              0,
              index * 18,
              index * 18,
              index * 18 + 8,
              index * 18 + 8,
            ],
          },
          { contact, flashing: !blocked },
        ),
      ),
    );
  } else if (p.family === "grapple") {
    for (const sign of [-1, 1])
      if (p.variant !== "aerial")
        layers.push(
          layer(
            "grip",
            [(p.grip || target)[0] + sign * 0.11, (p.grip || target)[1]],
            21,
            [0, 0.12, 0.25, 0.4, 0.58, 1],
            [0, 0.75, 0.95, 0.9, p.grounded ? 0.7 : 0, 0],
            {
              x: [sign * 35, sign * 18, 0, 0, 0, 0],
              scale: [1.15, 1.1, 1, 1, 0.95, 0.95],
            },
            { side: sign },
          ),
        );
    if (p.grounded) {
      layers.push(
        layer(
          "tension",
          target,
          42,
          [0, 0.22, 0.4, 0.65, 0.84, 1],
          [0, 0, 0.6, 0.75, 0.45, 0],
          {
            scaleX: [1.2, 1.2, 0.88, 0.76, 0.76, 0.76],
            scaleY: [0.8, 0.8, 1, 1.04, 1.04, 1.04],
          },
        ),
      );
    } else {
      const lifting = camera.kind === "powerbomb";
      layers.push(
        layer(
          lifting ? "lift" : "arc",
          [0.5, 0.5],
          100,
          [0, at * 0.24, at * 0.56, at * 0.87, at + 0.06, 1],
          [0, 0.5, 0.85, 0.9, 0, 0],
          { pathLength: [0, 0.04, 0.6, 1, 1, 1] },
          { direction },
        ),
      );
      for (let index = 0; index < 2; index++) {
        const start = at + index * 0.03;
        layers.push(
          layer(
            blocked ? "shield" : "mat",
            [target[0], Math.max(0.7, target[1])],
            46 * p.strength,
            [
              0,
              start - 0.01,
              start,
              Math.min(0.99, start + 0.14),
              Math.min(0.995, start + 0.27),
              1,
            ],
            [0, 0, index ? 0.65 : 0.9, 0.55, 0, 0],
            blocked
              ? { scale: [0.3, 0.3, 0.8, 1.2, 1.5, 1.5] }
              : {
                  scaleX: [0.3, 0.3, 0.65, 1.5, 2.1, 2.1],
                  scaleY: [0.1, 0.1, 0.2, 0.4, 0.5, 0.5],
                },
          ),
        );
      }
      if (!blocked)
        for (let index = 0; index < 3; index++)
          layers.push(
            layer(
              "dust",
              [target[0] + (index - 1) * 0.1, Math.max(0.71, target[1])],
              18,
              [0, at - 0.01, at, end, 1],
              [0, 0, 0.55, 0, 0],
              {
                x: [0, 0, 0, (index - 1) * 48, (index - 1) * 48],
                y: [0, 0, 0, -22 - index * 7, -22 - index * 7],
                scale: [0.3, 0.3, 0.45, 1.7, 1.7],
              },
            ),
          );
    }
  } else if (p.family === "submission") {
    for (const sign of [-1, 1])
      layers.push(
        layer(
          "clamp",
          [target[0] + sign * 0.08, target[1]],
          16,
          [0, 0.16, 0.32, 0.53, 0.72, 0.9, 1],
          [0, 0.4, 0.9, 0.9, 0.85, 0.6, 0],
          {
            x: [
              sign * 35,
              sign * 25,
              0,
              -sign * 4,
              -sign * 6,
              -sign * 6,
              -sign * 6,
            ],
            scaleX: [1.1, 1.1, 0.9, 0.85, 0.8, 0.8, 0.8],
          },
          { side: sign, angle: p.angle || 0 },
        ),
      );
    layers.push(
      layer(
        "target",
        target,
        12,
        [0, 0.25, 0.38, 0.76, 0.9, 1],
        [0, 0, 0.8, 0.8, 0.65, 0],
        {
          rotate: [0, 0, 0, 24 * direction, 32 * direction, 32 * direction],
          scale: [1.2, 1.2, 1, 0.92, 0.92, 0.92],
        },
      ),
    );
    for (let index = 0; index < 2; index++) {
      const start = 0.3 + index * 0.09;
      layers.push(
        layer(
          "pressure",
          target,
          18,
          [
            0,
            start,
            start + 0.08,
            start + 0.2,
            start + 0.29,
            start + 0.4,
            start + 0.5,
            0.96,
            1,
          ],
          [0, 0.15, 0.75, 0.5, 0.8, 0.5, 0.7, 0.25, 0],
          {
            scale: [1.35, 1.35, 1, 0.82, 1.03, 0.8, 0.97, 0.75, 0.75].map(
              (v) => v * (p.pressure || 1),
            ),
          },
        ),
      );
    }
    if (blocked)
      layers.push(
        layer(
          "shield",
          target,
          23,
          [0, 0.5, 0.6, 0.85, 1],
          [0, 0, 0.65, 0.55, 0],
          { scale: [0.8, 0.8, 1, 1, 1] },
        ),
      );
  } else if (p.family === "defense") {
    layers.push(
      layer(
        "shield",
        target,
        38,
        [0, 0.12, 0.28, 0.64, 0.86, 1],
        [0, 0.4, 0.75, 0.65, 0.35, 0],
        { scale: [0.8, 0.9, 1, 1.04, 1.07, 1.07], y: [16, 8, 0, 0, 0, 0] },
      ),
    );
    for (const sign of [-1, 1])
      layers.push(
        layer(
          "guard-rail",
          [0.5 + sign * 0.22, 0.5],
          8,
          [0, 0.16, 0.36, 0.7, 1],
          [0, 0.35, 0.65, 0.6, 0],
          { y: [22, 12, 0, -3, -3], scaleY: [0.2, 0.6, 1, 1, 1] },
          { side: sign },
        ),
      );
    if (p.setup)
      layers.push(
        layer(
          "target",
          target,
          18,
          [0, 0.45, 0.6, 0.88, 1],
          [0, 0, 0.7, 0.5, 0],
          { rotate: [0, 0, 0, 30, 30] },
        ),
      );
    if (p.calm)
      layers.push(
        layer(
          "breath",
          target,
          62,
          [0, 0.22, 0.55, 0.82, 1],
          [0, 0.15, 0.35, 0.2, 0],
          { scale: [0.65, 0.75, 1.1, 1.2, 1.2] },
        ),
      );
  } else if (p.family === "nightmare") {
    for (const sign of [-1, 1])
      layers.push(
        layer(
          "veil",
          [0.5 + sign * 0.25, 0.5],
          60,
          [0, 0.2, 0.4, 0.7, 1],
          [0.5, 0.65, 0.5, 0.1, 0],
          { x: [0, -sign * 10, sign * 25, sign * 80, sign * 100] },
          { side: sign },
        ),
      );
    layers.push(
      layer(
        "release",
        target,
        75,
        [0, 0.25, 0.5, 0.78, 1],
        [0, 0.1, 0.55, 0.3, 0],
        { scale: [0.4, 0.65, 1, 1.2, 1.3] },
      ),
    );
  } else {
    layers.push(
      layer(
        p.crowd ? "spotlight" : "breath",
        target,
        p.crowd ? 100 : 66,
        [0, 0.18, 0.4, 0.73, 1],
        [0, 0.18, 0.5, 0.35, 0],
        { scale: [0.75, 0.85, 1, 1.1, 1.15] },
      ),
    );
    if (p.draw)
      for (let index = 0; index < 3; index++)
        layers.push(
          layer(
            "card-echo",
            [0.4 + index * 0.1, 0.67],
            12,
            [
              0,
              0.25 + index * 0.06,
              0.42 + index * 0.06,
              0.8 + index * 0.03,
              1,
            ],
            [0, 0, 0.6, 0.15, 0],
            {
              y: [20, 20, 0, -35, -35],
              rotate: [
                0,
                0,
                (index - 1) * 10,
                (index - 1) * 16,
                (index - 1) * 16,
              ],
            },
          ),
        );
  }
  // Arcade accents occupy the same contact coordinates as the illustration.
  // There are no ambient loops: every particle exits on the replay clock.
  if (p.family === "strike" && !blocked) {
    contacts.forEach((contact, index) => {
      layers.push(
        layer(
          "embers",
          [target[0] + index * 0.025, target[1]],
          34 * p.strength,
          [
            0,
            contact - 0.014,
            contact,
            contact + 0.08,
            Math.min(0.96, contact + 0.26),
            1,
          ],
          [0, 0, 0.95, 0.7, 0, 0],
          {
            scale: [0.1, 0.1, 0.4, 1, 1.7, 1.7],
            rotate: [0, 0, 0, direction * 8, direction * 18, direction * 18],
          },
          { angle: p.angle || 0, contact, direction },
        ),
      );
    });
  }
  if (p.family === "grapple" && !p.grounded && !blocked) {
    layers.push(
      layer(
        "mat-crack",
        [target[0], target[1]],
        42 * p.strength,
        [0, at - 0.01, at, at + 0.07, Math.min(0.97, at + 0.31), 1],
        [0, 0, 0.78, 0.65, 0, 0],
        {
          scaleX: [0.3, 0.3, 0.75, 1.15, 1.35, 1.35],
          scaleY: [0.15, 0.15, 0.35, 0.5, 0.5, 0.5],
        },
        { contact: at },
      ),
    );
    for (const side of [-1, 1])
      layers.push(
        layer(
          "debris",
          target,
          22,
          [0, at - 0.01, at, at + 0.12, Math.min(0.98, at + 0.33), 1],
          [0, 0, 0.9, 0.85, 0, 0],
          {
            x: [0, 0, side * 5, side * 46, side * 88, side * 88],
            y: [0, 0, 0, -55, 12, 12],
            rotate: [0, 0, 0, side * 38, side * 95, side * 95],
            scale: [0.2, 0.2, 0.6, 1, 0.55, 0.55],
          },
          { side, contact: at },
        ),
      );
  }
  if (p.family === "submission" || (p.family === "grapple" && p.grounded)) {
    for (const side of [-1, 1])
      layers.push(
        layer(
          "pressure-sparks",
          target,
          16 * (p.pressure || 1),
          [0, 0.18, 0.34, 0.48, 0.62, 0.78, 0.93, 1],
          [0, 0.12, 0.6, 0.85, 0.65, 0.9, 0.4, 0],
          {
            rotate: [
              0,
              0,
              side * 12,
              side * 20,
              side * 28,
              side * 36,
              side * 42,
              side * 42,
            ],
            scale: [1.25, 1.25, 1.1, 1, 0.94, 0.89, 0.85, 0.85],
          },
          { side, angle: p.angle || 0, direction },
        ),
      );
  }
  if (p.family === "defense") {
    layers.push(
      layer(
        "brace-streaks",
        target,
        54,
        [0, 0.12, 0.3, 0.6, 0.88, 1],
        [0, 0.12, 0.6, 0.45, 0.2, 0],
        { scale: [0.5, 0.65, 0.9, 1.06, 1.2, 1.2] },
      ),
    );
  }
  if (p.family === "tactics" || (p.family === "defense" && p.calm)) {
    for (const side of [-1, 1])
      layers.push(
        layer(
          "rising-motes",
          [target[0] + side * 0.1, Math.min(0.84, target[1] + 0.28)],
          26,
          [0, 0.16, 0.35, 0.67, 0.9, 1],
          [0, 0.2, 0.8, 0.65, 0.2, 0],
          {
            y: [25, 20, 0, -46, -75, -75],
            scale: [0.55, 0.65, 0.9, 1, 0.9, 0.9],
          },
          { side },
        ),
      );
  }
  if (p.family === "nightmare") {
    layers.push(
      layer(
        "stress-slash",
        target,
        90,
        [0, 0.15, 0.35, 0.56, 0.83, 1],
        [0, 0.18, 0.7, 0.8, 0.25, 0],
        { scale: [0.6, 0.8, 1, 1.12, 1.5, 1.6] },
      ),
    );
  }
  return layers.map((value, index) => ({
    ...value,
    id: `${p.id}-${value.kind}-${index}`,
  }));
}
