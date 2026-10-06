import { getCard, getCardCost, WRESTLERS } from "./game.js";
import { getCardDetail } from "./card-library.js";
import {
  techniqueEffectProfile,
  artworkProjection,
  projectedArtworkPoint,
} from "./technique-effects.js";

// Presentation reads engine snapshots. It never changes combat or save data.
export const FIGHTER_STATES = {
  normal: {
    id: "normal",
    label: "보통",
    subtitle: "READY",
    rule: "체력 50% 초과 · 열기 0–2 · 압박 60 미만",
    description: "차분한 표정과 안정적인 가드",
  },
  excited: {
    id: "excited",
    label: "흥분",
    subtitle: "HYPED",
    rule: "체력 50% 초과 · 열기 3–5 · 압박 60 미만",
    description: "자신감 있는 미소와 올라간 가드",
  },
  fiery: {
    id: "fiery",
    label: "열혈",
    subtitle: "ON FIRE",
    rule: "체력 50% 초과 · 열기 6 이상 · 압박 60 미만",
    description: "투지의 표정과 강하게 쥔 주먹",
  },
  frustrated: {
    id: "frustrated",
    label: "좌절",
    subtitle: "UNDER PRESSURE",
    rule: "체력 50% 초과 · 압박 60 이상",
    description: "걱정스러운 표정과 흐트러진 가드",
  },
  tired: {
    id: "tired",
    label: "지침",
    subtitle: "FATIGUED",
    rule: "체력 25% 초과–50% 이하",
    description: "처진 어깨와 지친 표정",
  },
  groggy: {
    id: "groggy",
    label: "그로기",
    subtitle: "GROGGY",
    rule: "체력 25% 이하",
    description: "고개가 처지고 가드가 무너진 자세",
  },
};

export function selectFighterState(fighter, { enemy = false } = {}) {
  if (!fighter) return FIGHTER_STATES.normal;
  const maxHp =
    Number.isFinite(fighter.maxHp) && fighter.maxHp > 0 ? fighter.maxHp : 1;
  const hp = Number.isFinite(fighter.hp) ? fighter.hp : maxHp;
  const ratio = hp / maxHp;
  if (ratio <= 0.25) return FIGHTER_STATES.groggy;
  if (ratio <= 0.5) return FIGHTER_STATES.tired;
  if ((fighter.stress || 0) >= 60 || (enemy && (fighter.weak || 0) >= 2))
    return FIGHTER_STATES.frustrated;
  if ((fighter.hype || 0) >= 6) return FIGHTER_STATES.fiery;
  if ((fighter.hype || 0) >= 3) return FIGHTER_STATES.excited;
  return FIGHTER_STATES.normal;
}

export function fighterPoseArt(actor, condition = "normal") {
  const id = Object.hasOwn(WRESTLERS, actor) ? actor : "nova";
  const requested = typeof condition === "string" ? condition : condition?.id;
  const state = Object.hasOwn(FIGHTER_STATES, requested) ? requested : "normal";
  return `fighters/states/${id}-${state}.webp`;
}

const shotTimes = [0, 0.18, 0.36, 0.47, 0.55, 0.59, 0.64, 0.78, 1];
const cameraShots = {
  strike: {
    x: [-30, -12, -10, -10, 30, -5, 3, 0, 0],
    y: [5, 0, 0, 0, -3, 2, -2, 0, 0],
    scale: [0.9, 0.97, 1.02, 1.02, 1.1, 1.04, 1.07, 1.02, 1.02],
    rotate: [-2, -1, 0, 0, 1.5, -1, 0.6, 0, 0],
    phases: ["SET", "STRIKE", "IMPACT"],
    impacts: [0.55],
    duration: 2350,
  },
  combo: {
    times: [0, 0.2, 0.34, 0.39, 0.5, 0.59, 0.65, 0.82, 1],
    x: [-18, -4, 18, -10, -6, 24, -4, 0, 0],
    y: [5, 0, -3, 2, 0, -5, 1, 0, 0],
    scale: [0.91, 0.99, 1.07, 1.02, 1.03, 1.13, 1.07, 1.03, 1.03],
    rotate: [-1, 0, 1, -1, 0, 2, -0.6, 0, 0],
    phases: ["ONE", "TWO", "FOLLOW THROUGH"],
    impacts: [0.34, 0.59],
    duration: 2650,
  },
  powerbomb: {
    x: [-12, -6, 0, 0, 2, -6, 3, 0, 0],
    y: [24, -20, -44, -44, 30, 36, 20, 8, 8],
    scale: [0.88, 0.96, 1.03, 1.03, 1.14, 1.15, 1.1, 1.02, 1.02],
    rotate: [0, -2, -2, -2, 2, -1, 1, 0, 0],
    phases: ["LIFT", "DRIVE", "MAT IMPACT"],
    impacts: [0.55],
    duration: 2900,
    heavy: true,
  },
  slam: {
    x: [-28, -20, -8, -8, 20, 13, 3, 0, 0],
    y: [-14, -22, -24, -24, 34, 36, 20, 8, 8],
    scale: [0.9, 0.97, 1.02, 1.02, 1.13, 1.1, 1.06, 1.02, 1.02],
    rotate: [-8, -6, -4, -4, 8, 4, 0, 0, 0],
    phases: ["LOAD", "FALL", "MAT IMPACT"],
    impacts: [0.55],
    duration: 2600,
    heavy: true,
  },
  throw: {
    x: [-34, -22, 0, 24, 38, 33, 22, 8, 8],
    y: [20, 4, -26, -38, 22, 30, 14, 6, 6],
    scale: [0.9, 0.97, 1.01, 1.04, 1.12, 1.09, 1.06, 1.02, 1.02],
    rotate: [-4, -7, -10, -10, 6, 3, 1, 0, 0],
    phases: ["GRIP", "ARC", "LANDING"],
    impacts: [0.55],
    duration: 2750,
    heavy: true,
  },
  aerial: {
    x: [-15, -8, 0, 0, 14, -5, 3, 0, 0],
    y: [-36, -48, -55, -55, 28, 34, 14, 2, 2],
    scale: [0.86, 0.94, 1.02, 1.02, 1.14, 1.1, 1.06, 1.02, 1.02],
    rotate: [3, 2, 0, 0, -3, 1, -0.5, 0, 0],
    phases: ["TAKE OFF", "AIRTIME", "LANDING"],
    impacts: [0.55],
    duration: 2800,
    heavy: true,
  },
  hold: {
    x: [0, -5, -8, -8, -7, -9, -7, -8, -8],
    y: [5, 4, 2, 0, -1, 0, -1, 0, 0],
    scale: [0.88, 0.99, 1.08, 1.13, 1.14, 1.15, 1.16, 1.16, 1.16],
    rotate: [0, -1, -1, -1, -0.5, -1, -0.5, -0.6, -0.6],
    phases: ["LOCK", "PRESSURE", "CONTROL"],
    impacts: [0.55],
    duration: 2650,
    pressure: true,
  },
  clinch: {
    x: [-12, -5, 0, 0, 5, -3, 2, 0, 0],
    y: [3, 2, 0, 0, 2, 0, 1, 0, 0],
    scale: [0.92, 1, 1.06, 1.06, 1.1, 1.07, 1.1, 1.09, 1.09],
    rotate: [-2, -1, 0, 0, 1, -1, 0.5, 0, 0],
    phases: ["CLOSE", "GRIP", "CONTROL"],
    impacts: [0.55],
    duration: 2400,
    pressure: true,
  },
  guard: {
    x: [0, 0, 0, 0, -5, 2, 0, 0, 0],
    y: [8, 2, 0, 0, 2, -2, 0, 0, 0],
    scale: [0.93, 0.99, 1.02, 1.02, 1.08, 1.03, 1.06, 1.04, 1.04],
    rotate: [0, 0, 0, 0, -1, 0.5, 0, 0, 0],
    phases: ["BRACE", "ABSORB", "RESET"],
    impacts: [0.55],
    duration: 2200,
  },
  focus: {
    x: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    y: [12, 6, 0, 0, -3, -3, -3, 0, 0],
    scale: [0.94, 0.98, 1, 1, 1.02, 1.02, 1.02, 1.03, 1.03],
    rotate: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    phases: ["COMPOSE", "RESET", "READY"],
    impacts: [],
    duration: 2100,
  },
  nightmare: {
    x: [-8, 4, -3, -3, 5, -5, 2, 0, 0],
    y: [4, -2, 3, 3, -1, 1, 0, 0, 0],
    scale: [0.91, 0.98, 1.04, 1.04, 1.1, 1.08, 1.1, 1.07, 1.07],
    rotate: [-2, 1, -1, -1, 1, 0, -1, 0, 0],
    phases: ["PRESSURE", "BREAK", "RECOVER"],
    impacts: [0.55],
    duration: 2600,
    pressure: true,
  },
};

const techniqueCameras = {
  strike: ["strike", { pan: 0.75, origin: "58% 42%" }],
  redline: ["strike", { pan: 1.3, origin: "60% 42%" }],
  shoulder: ["strike", { lift: 0.65, origin: "60% 56%" }],
  flashstep: ["strike", { pan: -0.7, rotation: 0.4 }],
  doubletap: ["combo"],
  dropkick: ["aerial", { origin: "58% 52%" }],
  moonsault: ["aerial", { rotation: -3, origin: "50% 44%", duration: 3000 }],
  finisher: ["strike", { heavy: true, lift: 2, duration: 3100 }],
  championship: ["slam", { duration: 3200, pan: 0.8 }],
  suplex: ["throw"],
  powerbomb: ["powerbomb"],
  sitoutpowerbomb: ["powerbomb", { lift: 1.05 }],
  jackknifepowerbomb: ["powerbomb", { rotation: 1.8, duration: 3100 }],
  popuppowerbomb: ["powerbomb", { lift: 1.22, pan: 0.5 }],
  gutwrenchpowerbomb: ["powerbomb", { rotation: -2.3, pan: -1 }],
  foldingpowerbomb: ["powerbomb", { zoom: 1.035, duration: 3150 }],
  bodyslam: ["slam"],
  powerslam: ["slam", { pan: 1.3, rotation: 1.5 }],
  sidewalkslam: ["slam", { pan: -1.2, rotation: -0.5 }],
  spinebuster: ["slam", { rotation: 0.2, zoom: 1.025 }],
  bellysuplex: ["throw", { pan: -1, rotation: -0.8 }],
  snapsuplex: ["throw", { lift: 0.75, duration: 2400 }],
  samoandrop: ["slam", { lift: 1.1, rotation: -1 }],
  headlock: ["hold", { origin: "52% 34%" }],
  armbar: ["hold", { origin: "54% 58%" }],
  kimura: ["hold", { origin: "56% 44%", pan: -0.6 }],
  americana: ["hold", { origin: "50% 45%", pan: 0.65 }],
  anklelock: ["hold", { origin: "54% 72%", lift: -0.8 }],
  kneebar: ["hold", { origin: "50% 67%", pan: -0.5 }],
  heelhook: ["hold", { origin: "55% 74%", pan: 0.5 }],
  figurefour: ["hold", { origin: "50% 64%", rotation: -1 }],
  bostoncrab: ["hold", { origin: "55% 58%", pan: -1 }],
  sharpshooter: ["hold", { origin: "55% 64%", zoom: 1.02 }],
  crossface: ["hold", { origin: "58% 36%", lift: 0.5 }],
  grapple: ["clinch"],
  collartie: ["clinch", { origin: "52% 34%" }],
  armdrag: ["throw", { duration: 2400, lift: 0.55, rotation: 0.55 }],
  waistlock: ["clinch", { origin: "55% 54%", pan: -0.8 }],
  reversal: ["hold", { pan: -0.75, rotation: -1.8, origin: "53% 45%" }],
  guard: ["guard"],
  ironclad: ["hold", { zoom: 1.03, origin: "53% 44%" }],
  comeback: ["guard", { lift: 1.25, heavy: true }],
  focus: ["focus"],
  steelwill: ["guard", { zoom: 1.03 }],
  spotlight: ["focus", { lift: 1.6, origin: "50% 32%" }],
  rally: ["focus", { lift: 1.4 }],
  ringcraft: ["guard", { pan: 1.4 }],
  quickdraw: ["focus", { pan: -1.4 }],
  encore: ["focus", { lift: 0.65 }],
  nightmare: ["nightmare"],
};

// A phone crops only the complete illustration. Wider throws retain both bodies;
// the upright headlock can use a closer field around faces and the contact point.
const portraitFields = {
  strike: 0.68,
  combo: 0.72,
  powerbomb: 0.68,
  slam: 0.8,
  throw: 0.82,
  aerial: 0.82,
  hold: 0.8,
  clinch: 0.72,
  guard: 0.7,
  focus: 0.7,
  nightmare: 0.72,
};
const portraitFocus = {
  headlock: { field: 0.6, center: [0.51, 0.36] },
  armbar: { field: 0.88, center: [0.6, 0.62] },
  sidewalkslam: { field: 0.8, center: [0.44, 0.4] },
};

/** Finite camera movement of the complete illustration; no subject deformation. */
export function techniqueShot(cardId, disciplineSlug, finisher = false) {
  const fallback = {
    strike: "strike",
    aerial: "aerial",
    throw: "throw",
    submission: "hold",
    grapple: "clinch",
    defense: "guard",
    tactics: "focus",
    nightmare: "nightmare",
  };
  const [kind, variation = {}] = techniqueCameras[cardId] || [
    fallback[disciplineSlug] || "focus",
  ];
  const shot = cameraShots[kind];
  const effect = techniqueEffectProfile(cardId, disciplineSlug);
  const focalPoint = effect.grip || effect.target;
  const portrait = portraitFocus[cardId] || {
    field: portraitFields[kind],
    center: [0.5, 0.45],
  };
  const scaleChannel = (values, multiplier = 1) =>
    values.map((value) => (value === 0 ? 0 : value * multiplier));
  const camera = {
    id: `${cardId}-${kind}`,
    kind,
    times: [...(shot.times || shotTimes)],
    x: scaleChannel(shot.x, variation.pan),
    y: scaleChannel(shot.y, variation.lift),
    scale: scaleChannel(shot.scale, variation.zoom),
    rotate: scaleChannel(shot.rotate, variation.rotation),
    origin: focalPoint.map((value) => `${Math.round(value * 100)}%`).join(" "),
    phases: [...shot.phases],
    impacts: [...shot.impacts],
    heavy: variation.heavy ?? shot.heavy ?? finisher,
    pressure: !!shot.pressure,
    portrait: { field: portrait.field, center: [...portrait.center] },
    duration:
      variation.duration ||
      (finisher ? Math.max(3100, shot.duration) : shot.duration),
  };
  // Arcade anticipation, impact punch-in and recoil stay on one intact image.
  // The joint-lock camera deliberately uses a steadier, sustained squeeze.
  if (!camera.pressure && camera.impacts.length) {
    const force = camera.heavy ? 1.3 : 1.15;
    camera.x = camera.x.map((value) => value * force);
    camera.y = camera.y.map((value) => value * force);
    camera.scale = camera.scale.map((value) =>
      Math.min(1.25, Math.max(0.8, 1 + (value - 1) * 1.35)),
    );
    camera.rotate = camera.rotate.map((value) => value * 1.12);
  }
  // Hold the complete frame at contact, then release into recoil. The engine
  // has already resolved the action; this hitstop affects only the camera.
  camera.hitstop = camera.pressure ? 0 : camera.heavy ? 100 : 80;
  if (camera.hitstop) {
    for (const contact of camera.impacts) {
      const index = camera.times.indexOf(contact);
      if (index < 0 || index === camera.times.length - 1) continue;
      const holdUntil = Math.min(
        contact + camera.hitstop / camera.duration,
        camera.times[index + 1] - 0.001,
      );
      camera.times.splice(index + 1, 0, holdUntil);
      for (const channel of ["x", "y", "scale", "rotate"])
        camera[channel].splice(index + 1, 0, camera[channel][index]);
    }
  }
  return camera;
}

/** Follow the mat at landing without moving the technique's contact marker. */
export function frameTechniqueCamera(camera, effect, viewport) {
  if (
    !viewport?.width ||
    !viewport?.height ||
    effect?.family !== "grapple" ||
    effect.grounded
  )
    return camera;
  const { width, height, fit = "contain", position = [0.5, 0.5] } = viewport;
  const projection = artworkProjection(width, height, fit, position);
  const target = projectedArtworkPoint(effect.target, projection);
  const origin = projectedArtworkPoint(
    effect.grip || effect.target,
    projection,
  );
  const contact = camera.impacts[0] ?? 1;
  const y = camera.y.map((pan, index) => {
    if (camera.times[index] < contact) return pan;
    const angle = (camera.rotate[index] * Math.PI) / 180;
    const dx = (target[0] - origin[0]) * width * camera.scale[index];
    const dy = (target[1] - origin[1]) * height * camera.scale[index];
    const landing =
      origin[1] * height + dx * Math.sin(angle) + dy * Math.cos(angle) + pan;
    return pan - Math.max(0, landing - height * 0.87);
  });
  return {
    ...camera,
    y,
    origin: origin.map((value) => `${value * 100}%`).join(" "),
  };
}
const difference = (a, b) => Math.max(0, (a || 0) - (b || 0));

/** Read resolved damage and guard, never advance time or change engine data. */
export function createArenaImpact(before, after, options = {}) {
  if (!before || !after || before === after) return null;
  const attacker = options.attacker === "enemy" ? "enemy" : "player";
  const target = attacker === "player" ? "enemy" : "player";
  const resolved =
    after.lastImpact?.attacker === attacker ? after.lastImpact : null;
  // HP can change again after contact: a corner can heal on the new turn and
  // pressure can cause self damage. Neither belongs in the physical hit score.
  if (resolved && !resolved.hits) return null;
  if (
    !resolved &&
    attacker === "enemy" &&
    before.enemy?.intent?.type !== "attack"
  )
    return null;
  const damage = Number.isFinite(options.damage)
    ? Math.max(0, options.damage)
    : Number.isFinite(resolved?.damage)
      ? Math.min(
          Math.max(0, before[target]?.hp || 0),
          Math.max(0, resolved.damage),
        )
      : difference(before[target]?.hp, after[target]?.hp);
  let blocked;
  if (Number.isFinite(options.blocked)) blocked = Math.max(0, options.blocked);
  else if (Number.isFinite(resolved?.blocked)) blocked = resolved.blocked;
  else if (attacker === "player")
    blocked = difference(before.enemy?.block, after.enemy?.block);
  else if (before.enemy?.intent?.type === "attack") {
    const incoming =
      before.enemy.weak > 0
        ? Math.floor(before.enemy.intent.value * 0.75)
        : before.enemy.intent.value;
    blocked = Math.min(before.player?.block || 0, incoming);
  } else blocked = 0;
  if (!damage && !blocked) return null;
  const card = options.instance ? getCard(options.instance) : null;
  const finisher = card?.type === "finisher";
  const detail = card ? getCardDetail(card.id) : null;
  const effect = card
    ? techniqueEffectProfile(card.id, detail?.disciplineSlug)
    : null;
  const effectFamily = effect?.family || "strike";
  const pressure = effectFamily === "submission";
  const throwing = effectFamily === "grapple" && !effect.grounded;
  const knockout = (after[target]?.hp ?? 1) <= 0 && damage > 0;
  const hits = Math.max(1, resolved?.hits || card?.effects.hits || 1);
  const combo = attacker === "player" ? after.combo || 0 : hits;
  const heavy = finisher || knockout || damage >= 12 || blocked >= 12;
  const label =
    options.label ||
    (knockout
      ? "K.O."
      : !damage
        ? "GUARD"
        : finisher
          ? "FINISHER"
          : hits > 1
            ? `${hits} HITS`
            : pressure
              ? "LOCKED IN"
              : throwing
                ? "MAT IMPACT"
                : effectFamily === "grapple"
                  ? "GRIP"
                  : heavy
                    ? "HEAVY HIT"
                    : "HIT");
  return {
    attacker,
    target,
    damage,
    blocked,
    hits,
    combo,
    heavy,
    finisher,
    knockout,
    effectFamily,
    pressure,
    throwing,
    label,
    duration: heavy ? 1040 : 880,
    announcement: `${attacker === "player" ? "선수" : "상대"} 공격. ${damage ? `피해 ${damage}` : "가드 성공"}${blocked ? `. 방어 ${blocked}` : ""}${knockout ? ". K.O." : ""}.`,
  };
}

/** Whole-image motion channels. Reduced motion has no transform or flash. */
export function fighterImpactFrames(impact, side, still = false) {
  if (!impact || still || ![impact.attacker, impact.target].includes(side))
    return null;
  const attacking = impact.attacker === side;
  const guarded = !attacking && !impact.damage;
  const direction = impact.attacker === "player" ? 1 : -1;
  const force = impact.heavy ? 1.4 : 1;
  const pressure = impact.pressure && impact.damage > 0;
  const slam = impact.throwing && impact.damage > 0;
  const grip = impact.effectFamily === "grapple" && !slam && impact.damage > 0;
  const horizontal = pressure
    ? attacking
      ? [0, -2, 5, 5, 4, 2, 0]
      : [0, 0, 2, 2, 4, 1, 0]
    : grip
      ? attacking
        ? [0, -8, 18, 18, 10, 3, 0]
        : [0, 0, -8, -8, 9, 2, 0]
      : attacking
        ? [0, -10, 35, 35, 14, 3, 0]
        : guarded
          ? [0, 0, 4, 4, 7, 2, 0]
          : [0, 0, 29, 29, 42, 14, 0];
  const vertical = pressure
    ? [0, 0, -1, -1, 1, 0, 0]
    : slam
      ? attacking
        ? [0, 5, -8, -8, 6, 0, 0]
        : [0, -28, 16, 16, 24, 6, 0]
      : attacking
        ? [0, -2, -5, -5, 0, 0, 0]
        : guarded
          ? [0, 0, 1, 1, 0, 0, 0]
          : [0, 0, -4, -4, 5, 2, 0];
  const rotation = pressure
    ? attacking
      ? [0, -1, 2, 2, 3, 1, 0]
      : [0, 0, 3, 3, 6, 2, 0]
    : slam
      ? attacking
        ? [0, -3, 4, 4, 2, 0, 0]
        : [0, -12, 8, 8, 14, 3, 0]
      : attacking
        ? [0, -1, 2, 2, 0, 0, 0]
        : guarded
          ? [0, 0, 1, 1, 1, 0, 0]
          : [0, 0, 6, 6, 9, 2, 0];
  return {
    x: horizontal.map((value) => value * direction * force),
    y: vertical,
    rotate: rotation.map((value) => value * direction),
    filter: pressure
      ? [
          "brightness(1)",
          "brightness(1.05)",
          "brightness(1.15)",
          "brightness(1.15)",
          "brightness(1.2)",
          "brightness(1.08)",
          "brightness(1)",
        ]
      : !attacking && impact.damage
        ? [
            "brightness(1)",
            "brightness(1)",
            "brightness(1.8)",
            "brightness(1.8)",
            "brightness(1.12)",
            "brightness(1)",
            "brightness(1)",
          ]
        : [
            "brightness(1)",
            "brightness(1)",
            "brightness(1.15)",
            "brightness(1.15)",
            "brightness(1)",
            "brightness(1)",
            "brightness(1)",
          ],
    transition: {
      duration: impact.duration / 1000,
      times: [0, 0.14, 0.29, 0.39, 0.57, 0.8, 1],
      ease: "linear",
    },
  };
}

export function createCardCue(before, after, instance) {
  if (!before || !after || before === after) return null;
  const card = getCard(instance);
  const detail = getCardDetail(instance);
  if (!card || !detail) return null;
  const results = [];
  const attacking = !!card.effects.damage;
  const damage = attacking ? difference(before.enemy?.hp, after.enemy?.hp) : 0;
  const absorbed = attacking
    ? difference(before.enemy?.block, after.enemy?.block)
    : 0;
  const guard = difference(after.player.block, before.player.block);
  const heal = difference(after.player.hp, before.player.hp);
  const selfDamage = difference(before.player.hp, after.player.hp);
  const calm = difference(before.player.stress, after.player.stress);
  const pressure = difference(after.player.stress, before.player.stress);
  const heat = (after.player.hype || 0) - (before.player.hype || 0);
  const weak = difference(after.enemy?.weak, before.enemy?.weak);
  const vulnerable = difference(
    after.enemy?.vulnerable,
    before.enemy?.vulnerable,
  );
  if (attacking)
    results.push({
      kind: "damage",
      value: damage,
      text: damage ? `피해 ${damage}` : "공격 방어됨",
    });
  if (absorbed)
    results.push({
      kind: "blocked",
      value: absorbed,
      text: `상대 방어 −${absorbed}`,
    });
  if (guard)
    results.push({ kind: "guard", value: guard, text: `방어 +${guard}` });
  if (heal) results.push({ kind: "heal", value: heal, text: `회복 +${heal}` });
  if (selfDamage)
    results.push({
      kind: "self-damage",
      value: selfDamage,
      text: `멘탈 붕괴 · 체력 −${selfDamage}`,
    });
  if (selfDamage)
    results.push({
      kind: "pressure",
      value: after.player.stress,
      text: `붕괴 후 압박 ${after.player.stress}`,
    });
  else if (calm)
    results.push({ kind: "calm", value: calm, text: `압박 −${calm}` });
  if (pressure)
    results.push({
      kind: "pressure",
      value: pressure,
      text: `압박 +${pressure}`,
    });
  if (heat)
    results.push({
      kind: "hype",
      value: heat,
      text: `열기 ${heat > 0 ? "+" : "−"}${Math.abs(heat)}`,
    });
  if (weak) results.push({ kind: "weak", value: weak, text: `약화 +${weak}` });
  if (vulnerable)
    results.push({
      kind: "vulnerable",
      value: vulnerable,
      text: `취약 +${vulnerable}`,
    });
  const oldHand = new Set(
    before.hand.filter((c) => c.uid !== instance.uid).map((c) => c.uid),
  );
  const drawn = after.hand.filter((c) => !oldHand.has(c.uid)).length;
  if (drawn)
    results.push({ kind: "draw", value: drawn, text: `드로우 ${drawn}` });
  // Printed effects and character passives share the same resolved snapshots.
  // Compare energy after paying the card's cost, so a refund is visible even
  // when the final energy is lower than the starting value.
  const paidCost = getCardCost(before, instance);
  const energyGained = difference(after.energy, before.energy - paidCost);
  if (energyGained)
    results.push({
      kind: "energy",
      value: energyGained,
      text: `행동력(에너지) +${energyGained}`,
    });
  // A printed paid card spends the old discount even when its payable cost is
  // zero. A naturally free card retains it. Report the new final discount,
  // including a paid utility that spends one discount and grants another.
  const retainedDiscount =
    card.cost > 0 ? 0 : before.status?.nextCardDiscount || 0;
  const grantedDiscount = after.status?.nextCardDiscount || 0;
  if (card.effects.nextCardDiscount && grantedDiscount > retainedDiscount)
    results.push({
      kind: "discount",
      value: grantedDiscount,
      text: `이번 턴 다음 1코스트 이상 카드 비용 −${grantedDiscount}`,
    });
  // An attack consumes the old next-attack bonus before a passive can grant a
  // new one. Non-attacks retain it; the retained amount is not a fresh gain.
  const setupBaseline = card.effects.damage
    ? 0
    : before.status?.nextAttack || 0;
  const setupGained = difference(after.status?.nextAttack, setupBaseline);
  if (setupGained)
    results.push({
      kind: "setup",
      value: setupGained,
      text: `다음 공격 +${setupGained}`,
    });
  if (card.exhaust) results.push({ kind: "exhaust", text: "소멸" });
  const camera = techniqueShot(
    card.id,
    detail.disciplineSlug,
    card.type === "finisher",
  );
  const effect = techniqueEffectProfile(card.id, detail.disciplineSlug);
  if (card.utility) {
    // Keep the joint-lock illustration and its close-up, but use the existing
    // setup feedback in both renderers and audio. No impact, hurt pose or hitstop
    // should imply damage when the card only creates room for the next action.
    camera.impacts = [];
    camera.hitstop = 0;
    camera.heavy = false;
    camera.pressure = false;
    camera.phases = ["SETUP", "CONTROL", "READY"];
    effect.family = "tactics";
    effect.variant = "utility-control";
    effect.label = "주도권 확보 · 다음 기술 준비";
    effect.draw = drawn > 0;
  }
  return {
    cardId: card.id,
    name: card.name,
    nameEn: card.nameEn,
    type: card.type,
    art: detail.art,
    alt: detail.alt,
    discipline: detail.discipline,
    disciplineSlug: detail.disciplineSlug,
    finisher: card.type === "finisher",
    attacking,
    utility: !!card.utility,
    duration: camera.duration,
    camera,
    effect,
    damage,
    absorbed,
    hits: card.effects.hits || 1,
    knockout: damage > 0 && after.enemy?.hp <= 0,
    results,
    announcement: `${card.name}. ${results.map((result) => result.text).join(". ")}.`,
  };
}
