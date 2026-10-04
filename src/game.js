/**
 * SLAY — a deterministic, serializable wrestling deckbuilding rules engine.
 * Every public action returns a fresh state, or the original state if invalid.
 * All randomness comes from the saved seed; restoring a run reproduces its future.
 */

const card = (
  name,
  nameEn,
  type,
  cost,
  description,
  rarity,
  artKey,
  effects,
  upgrade,
  extra = {},
) => ({
  name,
  nameEn,
  type,
  cost,
  description,
  rarity,
  artKey,
  effects,
  upgrade,
  ...extra,
});

export const CARDS = {
  strike: card(
    "엘보 스트라이크",
    "Elbow Strike",
    "attack",
    1,
    "피해 6. 연속 공격으로 열기를 높입니다.",
    "starter",
    "strike",
    { damage: 6 },
    { damage: 9 },
  ),
  guard: card(
    "로프 가드",
    "Rope Guard",
    "skill",
    1,
    "방어 7을 얻습니다.",
    "starter",
    "guard",
    { block: 7 },
    { block: 11 },
  ),
  grapple: card(
    "클린치",
    "Clinch",
    "attack",
    1,
    "피해 4. 방어 4를 얻습니다.",
    "starter",
    "grapple",
    { damage: 4, block: 4 },
    { damage: 6, block: 6 },
    { grapple: true },
  ),
  focus: card(
    "호흡 조절",
    "Center Yourself",
    "skill",
    0,
    "압박 6 감소. 카드 1장을 뽑습니다. 소멸.",
    "starter",
    "focus",
    { calm: 6, draw: 1 },
    { calm: 10, draw: 2 },
    { exhaust: true },
  ),
  finisher: card(
    "피니시 무브",
    "Main Event",
    "finisher",
    2,
    "열기 3 필요. 열기 3을 소모해 피해 26.",
    "starter",
    "finisher",
    { damage: 26, spendHype: 3 },
    { damage: 36, spendHype: 3 },
  ),
  redline: card(
    "레드라인",
    "Redline",
    "attack",
    1,
    "피해 9. 압박 3 증가. 카드 1장을 뽑습니다.",
    "signature",
    "strike",
    { damage: 9, stress: 3, draw: 1 },
    { damage: 13, stress: 2, draw: 1 },
  ),
  ironclad: card(
    "아이언 클러치",
    "Iron Clutch",
    "attack",
    1,
    "피해 5. 방어 8을 얻습니다.",
    "signature",
    "grapple",
    { damage: 5, block: 8 },
    { damage: 8, block: 11 },
    { grapple: true },
  ),
  flashstep: card(
    "플래시 스텝",
    "Flash Step",
    "attack",
    0,
    "피해 4. 카드 1장을 뽑습니다. 소멸.",
    "signature",
    "strike",
    { damage: 4, draw: 1 },
    { damage: 7, draw: 1 },
    { exhaust: true },
  ),
  dropkick: card(
    "드롭킥",
    "Dropkick",
    "attack",
    1,
    "피해 8. 이번 턴에 먼저 공격했다면 피해 +4.",
    "common",
    "strike",
    { damage: 8, comboDamage: 4 },
    { damage: 11, comboDamage: 5 },
  ),
  suplex: card(
    "저먼 수플렉스",
    "German Suplex",
    "attack",
    2,
    "피해 16. 상대에게 취약 2를 부여합니다.",
    "uncommon",
    "grapple",
    { damage: 16, vulnerable: 2 },
    { damage: 21, vulnerable: 2 },
    { grapple: true },
  ),
  reversal: card(
    "카운터 홀드",
    "Counter Hold",
    "attack",
    1,
    "피해 5. 방어 6. 상대가 공격 준비 중이면 방어 +5.",
    "common",
    "grapple",
    { damage: 5, block: 6, counterBlock: 5 },
    { damage: 8, block: 8, counterBlock: 6 },
    { grapple: true },
  ),
  spotlight: card(
    "스포트라이트",
    "Spotlight",
    "skill",
    1,
    "열기 2를 얻고 카드 1장을 뽑습니다.",
    "common",
    "focus",
    { hype: 2, draw: 1 },
    { hype: 3, draw: 1 },
  ),
  rally: card(
    "관중의 함성",
    "Crowd Roar",
    "skill",
    0,
    "열기 1. 압박 4 감소. 소멸.",
    "common",
    "focus",
    { hype: 1, calm: 4 },
    { hype: 2, calm: 7 },
    { exhaust: true },
  ),
  shoulder: card(
    "숄더 태클",
    "Shoulder Tackle",
    "attack",
    1,
    "피해 7. 방어 3을 얻습니다.",
    "common",
    "strike",
    { damage: 7, block: 3 },
    { damage: 10, block: 5 },
  ),
  ringcraft: card(
    "링 위의 계산",
    "Ringcraft",
    "skill",
    1,
    "방어 9. 다음 공격의 피해 +4.",
    "uncommon",
    "guard",
    { block: 9, nextAttack: 4 },
    { block: 13, nextAttack: 6 },
  ),
  headlock: card(
    "헤드록",
    "Headlock",
    "attack",
    1,
    "피해 7. 상대에게 약화 2를 부여합니다.",
    "common",
    "grapple",
    { damage: 7, weak: 2 },
    { damage: 10, weak: 3 },
    { grapple: true },
  ),
  quickdraw: card(
    "템포 스틸",
    "Tempo Steal",
    "skill",
    0,
    "에너지 1. 카드 1장을 뽑습니다. 소멸.",
    "uncommon",
    "focus",
    { energy: 1, draw: 1 },
    { energy: 1, draw: 2 },
    { exhaust: true },
  ),
  moonsault: card(
    "문설트",
    "Moonsault",
    "attack",
    2,
    "피해 18. 열기 1을 얻습니다.",
    "uncommon",
    "strike",
    { damage: 18, hype: 1 },
    { damage: 24, hype: 1 },
  ),
  steelwill: card(
    "강철 의지",
    "Steel Will",
    "skill",
    1,
    "방어 8. 압박 12 감소.",
    "common",
    "guard",
    { block: 8, calm: 12 },
    { block: 12, calm: 16 },
  ),
  doubletap: card(
    "원 투 콤보",
    "One-Two Combo",
    "attack",
    1,
    "피해 5를 두 번. 콤보를 한 번 더 쌓습니다.",
    "uncommon",
    "strike",
    { damage: 5, hits: 2, extraCombo: 1 },
    { damage: 7, hits: 2, extraCombo: 1 },
  ),
  powerbomb: card(
    "파워밤",
    "Powerbomb",
    "attack",
    2,
    "피해 21. 이번 턴 콤보가 2 이상이면 피해 +7.",
    "rare",
    "grapple",
    { damage: 21, comboDamage: 7, comboRequired: 2 },
    { damage: 28, comboDamage: 9, comboRequired: 2 },
    { grapple: true },
  ),
  encore: card(
    "앙코르",
    "Encore",
    "skill",
    1,
    "카드 3장을 뽑습니다.",
    "uncommon",
    "focus",
    { draw: 3 },
    { draw: 4 },
  ),
  championship: card(
    "챔피언십 드라이브",
    "Championship Drive",
    "finisher",
    2,
    "열기 3 필요. 피해 32. 체력 6 회복. 소멸.",
    "rare",
    "finisher",
    { damage: 32, spendHype: 3, heal: 6 },
    { damage: 42, spendHype: 3, heal: 9 },
    { exhaust: true },
  ),
  comeback: card(
    "네버 세이 다이",
    "Never Say Die",
    "skill",
    1,
    "방어 12. 체력이 절반 이하면 방어 +10.",
    "rare",
    "guard",
    { block: 12, lowHpBlock: 10 },
    { block: 16, lowHpBlock: 14 },
  ),
  nightmare: card(
    "악몽 · 시선",
    "Nightmare: Eyes",
    "nightmare",
    1,
    "손에 들어오면 압박 3 증가. 사용하면 압박 10 감소. 소멸.",
    "nightmare",
    "focus",
    { calm: 10 },
    { calm: 14 },
    { exhaust: true, onDrawStress: 3 },
  ),
};

export const WRESTLERS = {
  raven: {
    id: "raven",
    name: "RAVEN",
    nameKo: "레이븐",
    title: "THE RED REAPER",
    age: 28,
    maxHp: 74,
    signature: "redline",
    passive: "매 턴 첫 공격의 피해 +2",
    description: "한 번의 빈틈도 놓치지 않는 무자비한 스트라이커.",
    accent: "#e54b59",
    artKey: "raven",
  },
  valkyrie: {
    id: "valkyrie",
    name: "VALKYRIE",
    nameKo: "발키리",
    title: "THE IRON QUEEN",
    age: 31,
    maxHp: 82,
    signature: "ironclad",
    passive: "잡기 공격의 피해 +2 · 방어 3 유지",
    description: "링의 중심을 장악하는 압도적인 그래플러.",
    accent: "#dbb970",
    artKey: "valkyrie",
  },
  nova: {
    id: "nova",
    name: "NOVA",
    nameKo: "노바",
    title: "THE MIDNIGHT FLASH",
    age: 26,
    maxHp: 68,
    signature: "flashstep",
    passive: "매 턴 첫 0코스트 카드 사용 시 1장 추가 드로우",
    description: "속도와 변칙적인 리듬으로 경기를 뒤집는 테크니션.",
    accent: "#79a8da",
    artKey: "nova",
  },
};

export const ENEMIES = {
  rookie: {
    id: "nova",
    name: "LUNA",
    title: "THE OPENING ACT",
    maxHp: 36,
    attack: 7,
    taunt: 6,
    artKey: "nova",
    pattern: ["attack", "guard", "attack", "taunt"],
  },
  bruiser: {
    id: "valkyrie",
    name: "IRON ROSE",
    title: "THE ENFORCER",
    maxHp: 43,
    attack: 8,
    taunt: 7,
    artKey: "valkyrie",
    pattern: ["guard", "attack", "attack", "taunt"],
  },
  phantom: {
    id: "nova",
    name: "SABLE",
    title: "THE MIND GAME",
    maxHp: 39,
    attack: 7,
    taunt: 11,
    artKey: "nova",
    pattern: ["taunt", "attack", "guard", "attack"],
  },
  elite: {
    id: "raven",
    name: "SCARLET VIPER",
    title: "THE UNDEFEATED",
    maxHp: 61,
    attack: 11,
    taunt: 10,
    artKey: "raven",
    pattern: ["attack", "taunt", "attack", "guard"],
  },
  boss: {
    id: "valkyrie",
    name: "EMPRESS",
    title: "THE REIGNING CHAMPION",
    maxHp: 120,
    attack: 13,
    taunt: 12,
    artKey: "valkyrie",
    pattern: ["attack", "guard", "taunt", "attack", "attack"],
  },
};

const REWARD_POOL = Object.keys(CARDS).filter((id) =>
  ["common", "uncommon", "rare"].includes(CARDS[id].rarity),
);
const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrestlerFor = (state) => WRESTLERS[state.player.id] || WRESTLERS.raven;

function random(state) {
  state.seed = (Math.imul(1664525, state.seed) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function shuffle(state, cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function addLog(state, message, type = "info") {
  state.log.push(message);
  state.log = state.log.slice(-35);
  state.logEvents ||= [];
  state.logEvents.push({ text: message, type, turn: state.turn });
  state.logEvents = state.logEvents.slice(-35);
}

function makeInstance(state, id, upgraded = false) {
  return { uid: `c${state.nextUid++}`, id, upgraded };
}

export function getCard(instance) {
  const id = typeof instance === "string" ? instance : instance?.id;
  const base = CARDS[id];
  if (!base) return null;
  const upgraded = typeof instance === "object" && !!instance?.upgraded;
  return {
    ...base,
    id,
    uid: typeof instance === "object" ? instance?.uid : undefined,
    upgraded,
    name: base.name + (upgraded ? " +" : ""),
    effects: { ...base.effects, ...(upgraded ? base.upgrade : {}) },
    description: upgraded
      ? describeEffects(base, { ...base.effects, ...base.upgrade })
      : base.description,
  };
}

function describeEffects(base, effects) {
  const parts = [];
  if (effects.spendHype) parts.push(`열기 ${effects.spendHype} 필요`);
  if (effects.damage)
    parts.push(
      `피해 ${effects.damage}${effects.hits > 1 ? ` × ${effects.hits}` : ""}`,
    );
  if (effects.comboDamage) parts.push(`콤보 시 피해 +${effects.comboDamage}`);
  if (effects.block) parts.push(`방어 ${effects.block}`);
  if (effects.counterBlock)
    parts.push(`상대 공격 준비 시 방어 +${effects.counterBlock}`);
  if (effects.lowHpBlock)
    parts.push(`체력 절반 이하 시 방어 +${effects.lowHpBlock}`);
  if (effects.nextAttack) parts.push(`다음 공격 피해 +${effects.nextAttack}`);
  if (effects.hype) parts.push(`열기 +${effects.hype}`);
  if (effects.calm) parts.push(`압박 ${effects.calm} 감소`);
  if (effects.stress) parts.push(`압박 +${effects.stress}`);
  if (effects.draw) parts.push(`${effects.draw}장 드로우`);
  if (effects.energy) parts.push(`에너지 +${effects.energy}`);
  if (effects.heal) parts.push(`체력 ${effects.heal} 회복`);
  if (effects.weak) parts.push(`약화 ${effects.weak}`);
  if (effects.vulnerable) parts.push(`취약 ${effects.vulnerable}`);
  if (base.onDrawStress) parts.unshift(`드로우 시 압박 +${base.onDrawStress}`);
  if (base.exhaust) parts.push("소멸");
  return parts.join(". ") + ".";
}

function gainStress(state, amount) {
  if (amount <= 0) return;
  state.player.stress = clamp(state.player.stress + amount, 0, 100);
  while (
    state.player.stress >= state.nextNightmareAt &&
    state.nextNightmareAt <= 100
  ) {
    const nightmare = makeInstance(state, "nightmare");
    state.deck.push(nightmare);
    state.discard.push(clone(nightmare));
    state.nextNightmareAt += 25;
    addLog(state, "압박이 악몽 카드를 덱에 남겼습니다.", "nightmare");
  }
  if (state.player.stress >= 100) {
    state.player.hp = Math.max(0, state.player.hp - 8);
    state.player.stress = 65;
    state.nextNightmareAt = 85;
    addLog(state, "멘탈 붕괴! 체력 8 감소. 호흡을 되찾으세요.", "nightmare");
    if (state.player.hp === 0) finishDefeat(state);
  }
}

function calm(state, amount) {
  state.player.stress = Math.max(0, state.player.stress - amount);
  // A threshold rearms only after a meaningful recovery, avoiding repeated 35↔34 farming.
  if (state.player.stress < state.nextNightmareAt - 45) {
    state.nextNightmareAt = Math.max(
      35,
      Math.floor(state.player.stress / 25) * 25 + 35,
    );
  }
}

function drawCards(state, amount) {
  for (
    let i = 0;
    i < amount && state.hand.length < 10 && state.phase === "combat";
    i++
  ) {
    if (!state.draw.length && state.discard.length) {
      state.draw = shuffle(state, state.discard.splice(0));
      addLog(state, "버린 카드를 섞어 새 덱을 만들었습니다.");
    }
    if (!state.draw.length) break;
    const instance = state.draw.pop();
    state.hand.push(instance);
    const definition = getCard(instance);
    if (definition.onDrawStress) gainStress(state, definition.onDrawStress);
  }
}

function setIntent(state) {
  const enemy = state.enemy;
  const type = enemy.pattern[(state.turn - 1) % enemy.pattern.length];
  const value =
    type === "attack"
      ? enemy.attack + (state.turn > 4 ? Math.floor((state.turn - 4) / 3) : 0)
      : type === "guard"
        ? 7 + Math.floor(state.floor / 2)
        : enemy.taunt;
  enemy.intent = {
    type,
    value,
    label: type === "attack" ? "공격" : type === "guard" ? "방어" : "도발",
  };
}

function startCombat(state, type = "fight") {
  const isBoss = type === "boss";
  const isElite = type === "elite";
  const enemyId = isBoss
    ? "boss"
    : isElite
      ? "elite"
      : state.floor === 1
        ? "rookie"
        : random(state) > 0.5
          ? "bruiser"
          : "phantom";
  const definition = ENEMIES[enemyId];
  const extraHp = isBoss ? 0 : (state.floor - 1) * (isElite ? 5 : 4);
  state.enemy = {
    ...clone(definition),
    maxHp: definition.maxHp + extraHp,
    hp: definition.maxHp + extraHp,
    block: 0,
    weak: 0,
    vulnerable: 0,
    attack: definition.attack + Math.floor((state.floor - 1) / 3),
    type,
  };
  state.phase = "combat";
  state.turn = 1;
  state.combo = 0;
  state.energy = state.maxEnergy;
  state.player.block = 0;
  state.player.hype = Math.min(state.player.hype, 2);
  state.hand = [];
  state.discard = [];
  state.exhaust = [];
  state.draw = shuffle(state, clone(state.deck));
  state.status = { firstAttack: true, firstZero: true, nextAttack: 0 };
  state.rewards = [];
  state.rewardCoins = 0;
  state.mapNodes = [];
  state.event = null;
  state.shopItems = [];
  setIntent(state);
  addLog(state, `${state.enemy.name}과의 경기가 시작됩니다.`, "encounter");
  drawCards(state, 5);
}

export function newRun(wrestlerId = "raven", seed = 20903) {
  const wrestler = WRESTLERS[wrestlerId] || WRESTLERS.raven;
  const state = {
    version: 1,
    seed: seed >>> 0,
    nextUid: 1,
    player: {
      id: wrestler.id,
      hp: wrestler.maxHp,
      maxHp: wrestler.maxHp,
      block: 0,
      stress: 0,
      hype: 0,
      coins: 80,
    },
    enemy: null,
    hand: [],
    draw: [],
    discard: [],
    exhaust: [],
    deck: [],
    energy: 3,
    maxEnergy: 3,
    turn: 1,
    floor: 1,
    maxFloor: 8,
    phase: "combat",
    combo: 0,
    log: [],
    rewards: [],
    rewardCoins: 0,
    mapNodes: [],
    status: {},
    nextNightmareAt: 35,
    event: null,
    shopItems: [],
    stats: { cardsPlayed: 0, damageDealt: 0, enemiesDefeated: 0, finishers: 0 },
    history: [{ floor: 1, type: "fight", label: "데뷔 매치" }],
    relics: [
      {
        id: `${wrestler.id}-passive`,
        name: wrestler.title,
        description: wrestler.passive,
      },
    ],
  };
  for (const id of [
    "strike",
    "strike",
    "strike",
    "strike",
    "guard",
    "guard",
    "guard",
    "grapple",
    "focus",
    "finisher",
    wrestler.signature,
  ]) {
    state.deck.push(makeInstance(state, id));
  }
  startCombat(state);
  return state;
}

export function canPlayCard(state, instanceOrId) {
  if (state.phase !== "combat") return false;
  const uid =
    typeof instanceOrId === "string" ? instanceOrId : instanceOrId?.uid;
  const instance = state.hand.find((c) => c.uid === uid);
  if (!instance) return false;
  const definition = getCard(instance);
  return (
    state.energy >= definition.cost &&
    state.player.hype >= (definition.effects.spendHype || 0)
  );
}

function dealDamage(state, amount) {
  const blocked = Math.min(state.enemy.block, amount);
  state.enemy.block -= blocked;
  const damage = amount - blocked;
  state.enemy.hp = Math.max(0, state.enemy.hp - damage);
  state.stats.damageDealt += damage;
  return damage;
}

export function playCard(current, instanceId) {
  if (!canPlayCard(current, instanceId)) return current;
  const state = clone(current);
  const index = state.hand.findIndex((c) => c.uid === instanceId);
  const instance = state.hand.splice(index, 1)[0];
  const definition = getCard(instance);
  const effects = definition.effects;
  const wrestler = wrestlerFor(state);
  state.energy -= definition.cost;
  state.stats.cardsPlayed++;
  let dealt = 0;

  if (effects.spendHype) {
    state.player.hype -= effects.spendHype;
    state.stats.finishers++;
  }
  if (effects.damage) {
    let bonus = state.status.nextAttack;
    state.status.nextAttack = 0;
    if (state.status.firstAttack && wrestler.id === "raven") bonus += 2;
    if (definition.grapple && wrestler.id === "valkyrie") bonus += 2;
    if (effects.comboDamage && state.combo >= (effects.comboRequired || 1))
      bonus += effects.comboDamage;
    let amount = effects.damage + bonus;
    if (state.enemy.vulnerable > 0) amount = Math.floor(amount * 1.5);
    for (let hit = 0; hit < (effects.hits || 1); hit++)
      dealt += dealDamage(state, amount);
    state.status.firstAttack = false;
    const previousCombo = state.combo;
    state.combo += 1 + (effects.extraCombo || 0);
    const comboHype =
      Math.floor(state.combo / 2) - Math.floor(previousCombo / 2);
    if (comboHype) {
      state.player.hype = Math.min(9, state.player.hype + comboHype);
      addLog(state, `${state.combo} HIT 콤보! 열기 +${comboHype}.`, "combo");
    }
  }
  if (effects.block) {
    let block = effects.block;
    if (effects.counterBlock && state.enemy.intent.type === "attack")
      block += effects.counterBlock;
    if (effects.lowHpBlock && state.player.hp <= state.player.maxHp / 2)
      block += effects.lowHpBlock;
    state.player.block += block;
  }
  if (effects.nextAttack) state.status.nextAttack += effects.nextAttack;
  if (effects.hype)
    state.player.hype = Math.min(9, state.player.hype + effects.hype);
  if (effects.energy)
    state.energy = Math.min(10, state.energy + effects.energy);
  if (effects.heal)
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + effects.heal,
    );
  if (effects.calm) calm(state, effects.calm);
  if (effects.stress) gainStress(state, effects.stress);
  if (effects.weak) state.enemy.weak += effects.weak;
  if (effects.vulnerable) state.enemy.vulnerable += effects.vulnerable;
  (definition.exhaust ? state.exhaust : state.discard).push(instance);
  addLog(
    state,
    `${definition.name}${dealt ? ` · 피해 ${dealt}` : ""}`,
    definition.type,
  );

  if (state.phase !== "combat") return state;
  if (state.enemy.hp === 0) {
    finishCombat(state);
    return state;
  }
  let draw = effects.draw || 0;
  if (
    wrestler.id === "nova" &&
    definition.cost === 0 &&
    state.status.firstZero
  ) {
    draw++;
    state.status.firstZero = false;
  }
  drawCards(state, draw);
  return state;
}

function finishDefeat(state) {
  state.phase = "defeat";
  addLog(state, "카운트 3. 오늘의 도전은 여기까지입니다.", "defeat");
}

function sampleRewards(state, count = 3, elite = false) {
  const available = elite
    ? REWARD_POOL.filter((id) => CARDS[id].rarity !== "common")
    : REWARD_POOL;
  return shuffle(state, [...available]).slice(0, count);
}

function finishCombat(state) {
  state.stats.enemiesDefeated++;
  const isBoss = state.enemy.type === "boss";
  state.rewardCoins = isBoss ? 120 : state.enemy.type === "elite" ? 65 : 35;
  state.player.coins += state.rewardCoins;
  state.player.block = 0;
  calm(state, 5);
  if (isBoss) {
    state.phase = "victory";
    addLog(state, "AND NEW! 당신이 새로운 챔피언입니다.", "victory");
  } else {
    state.phase = "reward";
    state.rewards = sampleRewards(state, 3, state.enemy.type === "elite");
    addLog(
      state,
      `승리! ${state.rewardCoins} 크레딧을 획득했습니다.`,
      "victory",
    );
  }
}

export function endTurn(current) {
  if (current.phase !== "combat") return current;
  const state = clone(current);
  state.discard.push(...state.hand.splice(0));
  const intent = state.enemy.intent;
  if (intent.type === "attack") {
    const attack =
      state.enemy.weak > 0 ? Math.floor(intent.value * 0.75) : intent.value;
    const blocked = Math.min(state.player.block, attack);
    const damage = attack - blocked;
    state.player.block -= blocked;
    state.player.hp = Math.max(0, state.player.hp - damage);
    addLog(
      state,
      `${state.enemy.name}의 공격 · 피해 ${damage}${blocked ? ` / 방어 ${blocked}` : ""}`,
      "enemy",
    );
    gainStress(state, 2 + Math.ceil(damage / 3));
  } else if (intent.type === "guard") {
    state.enemy.block += intent.value;
    addLog(state, `${state.enemy.name} · 방어 ${intent.value}`, "enemy");
  } else {
    gainStress(state, intent.value);
    state.enemy.block += 3;
    addLog(
      state,
      `${state.enemy.name}의 도발 · 압박 +${intent.value}`,
      "enemy",
    );
  }
  if (state.player.hp <= 0 || state.phase === "defeat") {
    finishDefeat(state);
    return state;
  }
  state.enemy.weak = Math.max(0, state.enemy.weak - 1);
  state.enemy.vulnerable = Math.max(0, state.enemy.vulnerable - 1);
  state.player.block =
    state.player.id === "valkyrie" ? Math.min(3, state.player.block) : 0;
  state.turn++;
  state.energy = state.maxEnergy;
  state.combo = 0;
  state.status = { firstAttack: true, firstZero: true, nextAttack: 0 };
  setIntent(state);
  drawCards(state, 5);
  return state;
}

function openMap(state) {
  state.phase = "map";
  state.rewards = [];
  state.hand = [];
  state.player.block = 0;
  state.mapNodes = mapForFloor(state.floor + 1);
}

export function mapForFloor(floor) {
  if (floor >= 8)
    return [
      {
        index: 0,
        type: "boss",
        label: "챔피언십",
        description: "왕좌의 주인 EMPRESS와 최종 결전",
        icon: "crown",
      },
    ];
  const nodes = [
    {
      index: 0,
      type: "fight",
      label: "싱글 매치",
      description: "승리하여 카드와 크레딧 획득",
      icon: "swords",
    },
  ];
  if ([3, 5, 7].includes(floor))
    nodes.push({
      index: 1,
      type: "elite",
      label: "메인 이벤트",
      description: "강한 상대 · 희귀 카드 보상",
      icon: "flame",
    });
  else
    nodes.push({
      index: 1,
      type: "rest",
      label: "락커룸",
      description: "회복, 멘탈 정비 또는 카드 강화",
      icon: "heart",
    });
  nodes.push({
    index: 2,
    type: floor % 2 === 0 ? "event" : "shop",
    label: floor % 2 === 0 ? "백스테이지" : "프로 숍",
    description:
      floor % 2 === 0
        ? "링 밖에서 마주하는 선택"
        : "카드, 회복과 특별 훈련 구매",
    icon: floor % 2 === 0 ? "sparkles" : "bag",
  });
  if (floor === 7)
    nodes.push({
      index: 3,
      type: "rest",
      label: "최종 준비",
      description: "결승전 전 마지막 휴식",
      icon: "heart",
    });
  return nodes;
}

export function chooseReward(current, cardId = null) {
  if (
    current.phase !== "reward" ||
    (cardId !== null && !current.rewards.includes(cardId))
  )
    return current;
  const state = clone(current);
  if (cardId) {
    state.deck.push(makeInstance(state, cardId));
    addLog(state, `${CARDS[cardId].name}을 덱에 추가했습니다.`, "reward");
  } else addLog(state, "카드 보상을 건너뛰었습니다.");
  openMap(state);
  return state;
}

const EVENTS = [
  {
    id: "press",
    title: "카메라가 켜졌습니다",
    description:
      "방송팀이 당신의 결승전 각오를 기다립니다. 무대 밖에서도 챔피언의 서사는 쓰입니다.",
    choices: [
      {
        id: "promise",
        label: "승리를 약속한다",
        description: "크레딧 +40 · 압박 +10",
        effects: { coins: 40, stress: 10 },
      },
      {
        id: "breathe",
        label: "내 페이스를 지킨다",
        description: "압박 −15 · 체력 +8",
        effects: { calm: 15, heal: 8 },
      },
      {
        id: "rehearse",
        label: "새 기술을 선보인다",
        description: "드롭킥 카드 획득 · 체력 −5",
        effects: { card: "dropkick", damage: 5 },
      },
    ],
  },
  {
    id: "mentor",
    title: "베테랑의 한마디",
    description:
      "빈 링에서 만난 전 챔피언이 기술 하나를 가르쳐 주겠다고 합니다. 대가는 훈련의 흔적입니다.",
    choices: [
      {
        id: "learn",
        label: "훈련을 받아들인다",
        description: "저먼 수플렉스 획득 · 체력 −7",
        effects: { card: "suplex", damage: 7 },
      },
      {
        id: "listen",
        label: "멘탈을 다잡는다",
        description: "압박 −20 · 최대 체력 +4",
        effects: { calm: 20, maxHp: 4 },
      },
      {
        id: "pass",
        label: "다음 경기에 집중한다",
        description: "체력 +12",
        effects: { heal: 12 },
      },
    ],
  },
  {
    id: "sponsor",
    title: "늦은 스폰서 제안",
    description:
      "익명의 후원사가 락커룸 문 아래로 봉투를 밀어 넣었습니다. 링 위의 명성에는 언제나 가격이 붙습니다.",
    choices: [
      {
        id: "accept",
        label: "제안을 받아들인다",
        description: "크레딧 +65 · 압박 +15",
        effects: { coins: 65, stress: 15 },
      },
      {
        id: "decline",
        label: "내 이름을 지킨다",
        description: "압박 −12 · 관중의 함성 획득",
        effects: { calm: 12, card: "rally" },
      },
      {
        id: "negotiate",
        label: "조건을 다시 쓴다",
        description: "크레딧 +25 · 체력 +6",
        effects: { coins: 25, heal: 6 },
      },
    ],
  },
];

function openShop(state) {
  state.shopItems = [
    {
      id: "treatment",
      name: "피지오 테라피",
      description: "체력 24 회복",
      cost: 40,
      kind: "heal",
    },
    {
      id: "clarity",
      name: "멘탈 코칭",
      description: "압박 25 감소 · 악몽 카드 1장 제거",
      cost: 30,
      kind: "cleanse",
    },
    {
      id: "training",
      name: "퍼스널 트레이닝",
      description: "덱의 카드 1장 자동 강화",
      cost: 45,
      kind: "upgrade",
    },
    ...sampleRewards(state).map((id, index) => ({
      id: `card-${index}`,
      cardId: id,
      name: CARDS[id].name,
      description: CARDS[id].description,
      cost: CARDS[id].rarity === "rare" ? 65 : 45,
      kind: "card",
    })),
  ];
  if (!state.relics.some((item) => item.id === "energy-belt"))
    state.shopItems.push({
      id: "energy-belt",
      name: "컨디셔닝 벨트",
      description: "매 턴 에너지 +1",
      cost: 100,
      kind: "relic",
    });
}

export function advanceToNode(current, nodeIndex) {
  if (current.phase !== "map") return current;
  const node = current.mapNodes.find((n) => n.index === Number(nodeIndex));
  if (!node) return current;
  const state = clone(current);
  state.floor++;
  state.history.push({
    floor: state.floor,
    type: node.type,
    label: node.label,
  });
  state.mapNodes = [];
  if (["fight", "elite", "boss"].includes(node.type))
    startCombat(state, node.type);
  else if (node.type === "rest") {
    state.phase = "rest";
    state.enemy = null;
    addLog(state, "락커룸에서 잠시 숨을 고릅니다.");
  } else if (node.type === "shop") {
    state.phase = "shop";
    state.enemy = null;
    openShop(state);
  } else if (node.type === "event") {
    state.phase = "event";
    state.enemy = null;
    state.event = clone(EVENTS[Math.floor(random(state) * EVENTS.length)]);
  }
  return state;
}

function upgradeInPlace(state, uid) {
  const instance = state.deck.find((c) => c.uid === uid);
  if (!instance || instance.upgraded || instance.id === "nightmare")
    return false;
  instance.upgraded = true;
  for (const pile of ["hand", "draw", "discard", "exhaust"]) {
    const copy = state[pile].find((c) => c.uid === uid);
    if (copy) copy.upgraded = true;
  }
  addLog(state, `${CARDS[instance.id].name}을 강화했습니다.`, "upgrade");
  return true;
}

function bestUpgrade(state) {
  return (
    state.deck.find((c) => !c.upgraded && CARDS[c.id].type === "finisher") ||
    state.deck.find((c) => !c.upgraded && CARDS[c.id].rarity === "signature") ||
    state.deck.find((c) => !c.upgraded && c.id !== "nightmare")
  );
}

export function upgradeCard(current, instanceId) {
  if (current.phase !== "rest") return current;
  const instance = current.deck.find((c) => c.uid === instanceId);
  if (!instance || instance.upgraded || instance.id === "nightmare")
    return current;
  const state = clone(current);
  upgradeInPlace(state, instanceId);
  openMap(state);
  return state;
}

export function rest(current, action = "heal") {
  if (
    current.phase !== "rest" ||
    !["heal", "meditate", "upgrade"].includes(action)
  )
    return current;
  if (action === "upgrade") {
    const instance = bestUpgrade(current);
    return instance ? upgradeCard(current, instance.uid) : current;
  }
  const state = clone(current);
  if (action === "heal") {
    const amount = Math.min(
      state.player.maxHp - state.player.hp,
      Math.ceil(state.player.maxHp * 0.3),
    );
    state.player.hp += amount;
    calm(state, 5);
    addLog(state, `재충전 · 체력 ${amount} 회복.`, "heal");
  } else {
    calm(state, 25);
    const nightmare = state.deck.find((c) => c.id === "nightmare");
    if (nightmare)
      state.deck = state.deck.filter((c) => c.uid !== nightmare.uid);
    addLog(state, "압박을 25 낮추고 악몽의 흔적을 지웠습니다.", "heal");
  }
  openMap(state);
  return state;
}

export function buyItem(current, itemOrId) {
  if (current.phase !== "shop") return current;
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  const item = current.shopItems.find((item) => item.id === id && !item.sold);
  if (!item || current.player.coins < item.cost) return current;
  if (item.kind === "upgrade" && !bestUpgrade(current)) return current;
  if (item.kind === "heal" && current.player.hp === current.player.maxHp)
    return current;
  const state = clone(current);
  state.player.coins -= item.cost;
  state.shopItems.find((entry) => entry.id === id).sold = true;
  if (item.kind === "heal")
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 24);
  if (item.kind === "cleanse") {
    calm(state, 25);
    const nightmare = state.deck.find((c) => c.id === "nightmare");
    if (nightmare)
      state.deck = state.deck.filter((c) => c.uid !== nightmare.uid);
  }
  if (item.kind === "upgrade") upgradeInPlace(state, bestUpgrade(state).uid);
  if (item.kind === "card") state.deck.push(makeInstance(state, item.cardId));
  if (item.kind === "relic") {
    state.maxEnergy++;
    state.relics.push({
      id: item.id,
      name: item.name,
      description: item.description,
    });
  }
  addLog(state, `${item.name} 구매 · ${item.cost} 크레딧`, "shop");
  return state;
}

export function leaveShop(current) {
  if (current.phase !== "shop") return current;
  const state = clone(current);
  openMap(state);
  return state;
}

export function resolveEvent(current, choiceId) {
  if (current.phase !== "event") return current;
  const choice = current.event?.choices.find((c) => c.id === choiceId);
  if (!choice) return current;
  const state = clone(current);
  const effects = choice.effects;
  if (effects.coins) state.player.coins += effects.coins;
  if (effects.maxHp) {
    state.player.maxHp += effects.maxHp;
    state.player.hp += effects.maxHp;
  }
  if (effects.heal)
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + effects.heal,
    );
  if (effects.damage)
    state.player.hp = Math.max(1, state.player.hp - effects.damage);
  if (effects.calm) calm(state, effects.calm);
  if (effects.stress) gainStress(state, effects.stress);
  if (effects.card) state.deck.push(makeInstance(state, effects.card));
  addLog(state, choice.label, "event");
  state.event = null;
  if (state.phase !== "defeat") openMap(state);
  return state;
}

export function getDrawCount(state) {
  return state.draw.length;
}
export function getDeckCount(state) {
  return state.deck.length;
}

export function getRunProgress(state) {
  return Math.min(
    100,
    Math.round(
      ((state.floor - 1 + (state.phase === "victory" ? 1 : 0)) /
        state.maxFloor) *
        100,
    ),
  );
}

export function getCardDamage(state, instance) {
  const definition = getCard(instance);
  if (!definition?.effects.damage || !state.enemy) return 0;
  const effects = definition.effects;
  const wrestler = wrestlerFor(state);
  let bonus = state.status.nextAttack || 0;
  if (state.status.firstAttack && wrestler.id === "raven") bonus += 2;
  if (definition.grapple && wrestler.id === "valkyrie") bonus += 2;
  if (effects.comboDamage && state.combo >= (effects.comboRequired || 1))
    bonus += effects.comboDamage;
  let damage = effects.damage + bonus;
  if (state.enemy.vulnerable > 0) damage = Math.floor(damage * 1.5);
  return damage * (effects.hits || 1);
}
