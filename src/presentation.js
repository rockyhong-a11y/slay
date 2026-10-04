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

const timings = {
  strike: 1050,
  aerial: 1250,
  throw: 1300,
  submission: 1200,
  grapple: 1100,
  defense: 1000,
  tactics: 1000,
  nightmare: 1350,
};
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
    duration: card.type === "finisher" ? 1700 : timings[detail.disciplineSlug],
    damage,
    absorbed,
    results,
    announcement: `${card.name}. ${results.map((result) => result.text).join(". ")}.`,
  };
}
