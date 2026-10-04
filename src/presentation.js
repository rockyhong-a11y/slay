import { getCard } from "./game.js";
import { getCardDetail } from "./card-library.js";

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
  const id = ["raven", "valkyrie", "nova", "viper", "ember"].includes(actor)
    ? actor
    : "nova";
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
  reversal: ["guard", { pan: -2, rotation: -1.8 }],
  guard: ["guard"],
  ironclad: ["guard", { zoom: 1.03 }],
  comeback: ["guard", { lift: 1.25, heavy: true }],
  focus: ["focus"],
  steelwill: ["focus", { zoom: 1.03 }],
  spotlight: ["focus", { lift: 1.6, origin: "50% 32%" }],
  rally: ["focus", { lift: 1.4 }],
  ringcraft: ["focus", { pan: 1.4 }],
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
  armbar: { field: 0.88, center: [0.4, 0.42] },
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
  const portrait = portraitFocus[cardId] || {
    field: portraitFields[kind],
    center: [0.5, 0.45],
  };
  const scaleChannel = (values, multiplier = 1) =>
    values.map((value) => (value === 0 ? 0 : value * multiplier));
  return {
    id: `${cardId}-${kind}`,
    kind,
    times: [...(shot.times || shotTimes)],
    x: scaleChannel(shot.x, variation.pan),
    y: scaleChannel(shot.y, variation.lift),
    scale: scaleChannel(shot.scale, variation.zoom),
    rotate: scaleChannel(shot.rotate, variation.rotation),
    origin: variation.origin || "50% 50%",
    phases: [...shot.phases],
    impacts: [...shot.impacts],
    heavy: variation.heavy ?? shot.heavy ?? finisher,
    pressure: !!shot.pressure,
    portrait: { field: portrait.field, center: [...portrait.center] },
    duration:
      variation.duration ||
      (finisher ? Math.max(3100, shot.duration) : shot.duration),
  };
}
const difference = (a, b) => Math.max(0, (a || 0) - (b || 0));

export function createCardCue(before, after, instance) {
  if (!before || !after || before === after) return null;
  const card = getCard(instance);
  const detail = getCardDetail(instance);
  if (!card || !detail) return null;
  const results = [];
  const damage = difference(before.enemy?.hp, after.enemy?.hp);
  const absorbed = difference(before.enemy?.block, after.enemy?.block);
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
  if (card.effects.damage)
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
  if (card.effects.energy) {
    const gained = Math.min(
      card.effects.energy,
      Math.max(0, after.energy - (before.energy - card.cost)),
    );
    if (gained)
      results.push({
        kind: "energy",
        value: gained,
        text: `에너지 +${gained}`,
      });
  }
  if (card.effects.nextAttack)
    results.push({
      kind: "setup",
      value: card.effects.nextAttack,
      text: `다음 공격 +${card.effects.nextAttack}`,
    });
  if (card.exhaust) results.push({ kind: "exhaust", text: "소멸" });
  const camera = techniqueShot(
    card.id,
    detail.disciplineSlug,
    card.type === "finisher",
  );
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
    attacking: !!card.effects.damage,
    duration: camera.duration,
    camera,
    damage,
    absorbed,
    results,
    announcement: `${card.name}. ${results.map((result) => result.text).join(". ")}.`,
  };
}
