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

// Grappling expansion keeps the established effect vocabulary and upgrade rules.
const grapplingCard = (
  name,
  nameEn,
  type,
  cost,
  rarity,
  effects,
  upgrade,
  extra = {},
) =>
  card(
    name,
    nameEn,
    type,
    cost,
    describeEffects(extra, effects),
    rarity,
    type === "finisher" ? "finisher" : "grapple",
    effects,
    upgrade,
    { grapple: true, ...extra },
  );

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
  // 25 dedicated powerbomb, slam, submission and chain-wrestling techniques.
  sitoutpowerbomb: grapplingCard(
    "싯아웃 파워밤",
    "Sit-out Powerbomb",
    "attack",
    2,
    "uncommon",
    { damage: 17, block: 5 },
    { damage: 22, block: 7 },
  ),
  jackknifepowerbomb: grapplingCard(
    "잭나이프 파워밤",
    "Jackknife Powerbomb",
    "attack",
    3,
    "rare",
    { damage: 32, vulnerable: 2, stress: 4 },
    { damage: 41, vulnerable: 2, stress: 2 },
  ),
  popuppowerbomb: grapplingCard(
    "팝업 파워밤",
    "Pop-up Powerbomb",
    "attack",
    2,
    "uncommon",
    { damage: 14, comboDamage: 9, comboRequired: 1, hype: 1 },
    { damage: 18, comboDamage: 11, hype: 1 },
  ),
  gutwrenchpowerbomb: grapplingCard(
    "거트렌치 파워밤",
    "Gutwrench Powerbomb",
    "attack",
    2,
    "uncommon",
    { damage: 15, weak: 2, block: 3 },
    { damage: 20, weak: 3, block: 3 },
  ),
  foldingpowerbomb: grapplingCard(
    "폴딩 파워밤",
    "Folding Powerbomb",
    "attack",
    2,
    "rare",
    { damage: 18, comboDamage: 10, comboRequired: 2, block: 7 },
    { damage: 24, comboDamage: 13, block: 10 },
  ),
  bodyslam: grapplingCard(
    "바디 슬램",
    "Scoop Body Slam",
    "attack",
    1,
    "common",
    { damage: 8, block: 2 },
    { damage: 11, block: 4 },
  ),
  powerslam: grapplingCard(
    "파워 슬램",
    "Scoop Powerslam",
    "attack",
    2,
    "uncommon",
    { damage: 16, comboDamage: 6, comboRequired: 1, calm: 3 },
    { damage: 22, comboDamage: 7, calm: 5 },
  ),
  sidewalkslam: grapplingCard(
    "사이드워크 슬램",
    "Sidewalk Slam",
    "attack",
    1,
    "common",
    { damage: 6, block: 6 },
    { damage: 9, block: 8 },
  ),
  spinebuster: grapplingCard(
    "스파인버스터",
    "Spinebuster",
    "attack",
    2,
    "uncommon",
    { damage: 14, block: 7, counterBlock: 6 },
    { damage: 19, block: 10, counterBlock: 7 },
  ),
  bellysuplex: grapplingCard(
    "벨리 투 벨리 수플렉스",
    "Belly-to-Belly Suplex",
    "attack",
    2,
    "uncommon",
    { damage: 15, vulnerable: 1, draw: 1 },
    { damage: 20, vulnerable: 2, draw: 1 },
  ),
  snapsuplex: grapplingCard(
    "스냅 수플렉스",
    "Snap Suplex",
    "attack",
    1,
    "common",
    { damage: 6, draw: 1, stress: 2 },
    { damage: 9, draw: 1, stress: 1 },
  ),
  samoandrop: grapplingCard(
    "사모안 드롭",
    "Samoan Drop",
    "attack",
    2,
    "uncommon",
    { damage: 16, weak: 1, hype: 1 },
    { damage: 22, weak: 1, hype: 1 },
  ),
  armbar: grapplingCard(
    "암바",
    "Armbar",
    "attack",
    1,
    "common",
    { damage: 5, vulnerable: 2 },
    { damage: 8, vulnerable: 2 },
  ),
  kimura: grapplingCard(
    "기무라 록",
    "Kimura Lock",
    "attack",
    1,
    "uncommon",
    { damage: 6, weak: 1, vulnerable: 1 },
    { damage: 9, weak: 2, vulnerable: 1 },
  ),
  americana: grapplingCard(
    "아메리카나 록",
    "Americana Lock",
    "attack",
    1,
    "common",
    { damage: 5, block: 5, weak: 1 },
    { damage: 8, block: 7, weak: 1 },
  ),
  anklelock: grapplingCard(
    "앵클 록",
    "Ankle Lock",
    "attack",
    1,
    "common",
    { damage: 6, weak: 2, calm: 3 },
    { damage: 9, weak: 2, calm: 5 },
  ),
  kneebar: grapplingCard(
    "니바",
    "Kneebar",
    "attack",
    2,
    "uncommon",
    { damage: 12, vulnerable: 2, block: 4 },
    { damage: 17, vulnerable: 3, block: 6 },
  ),
  heelhook: grapplingCard(
    "힐 훅",
    "Heel Hook",
    "attack",
    1,
    "rare",
    { damage: 3, weak: 3, vulnerable: 2 },
    { damage: 6, weak: 4, vulnerable: 3 },
    { exhaust: true },
  ),
  figurefour: grapplingCard(
    "피겨 포 레그록",
    "Figure-Four Leglock",
    "attack",
    2,
    "uncommon",
    { damage: 10, block: 11, lowHpBlock: 6 },
    { damage: 15, block: 14, lowHpBlock: 8 },
  ),
  bostoncrab: grapplingCard(
    "보스턴 크랩",
    "Boston Crab",
    "attack",
    1,
    "common",
    { damage: 4, weak: 1, hype: 1 },
    { damage: 7, weak: 2, hype: 1 },
  ),
  sharpshooter: grapplingCard(
    "샤프슈터",
    "Sharpshooter",
    "finisher",
    2,
    "rare",
    { damage: 25, spendHype: 3, weak: 3 },
    { damage: 34, weak: 4 },
    { exhaust: true },
  ),
  crossface: grapplingCard(
    "크로스페이스",
    "Crossface",
    "attack",
    1,
    "uncommon",
    { damage: 6, block: 4, counterBlock: 5, calm: 4 },
    { damage: 9, block: 6, counterBlock: 6, calm: 6 },
  ),
  collartie: grapplingCard(
    "칼라 앤 엘보",
    "Collar-and-Elbow Tie-up",
    "skill",
    0,
    "common",
    { block: 3, nextAttack: 3 },
    { block: 5, nextAttack: 4 },
    { exhaust: true },
  ),
  armdrag: grapplingCard(
    "암 드래그",
    "Arm Drag",
    "attack",
    0,
    "common",
    { damage: 3, block: 2, extraCombo: 1 },
    { damage: 5, block: 4 },
    { exhaust: true },
  ),
  waistlock: grapplingCard(
    "리어 웨이스트록",
    "Rear Waist Lock",
    "skill",
    1,
    "uncommon",
    { block: 6, nextAttack: 6, draw: 1 },
    { block: 9, nextAttack: 8 },
  ),
};

const standardDeck = (signature) => [
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
  signature,
];

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
    role: "콤보 스트라이커",
    roleEn: "Combo Striker",
    strategy:
      "첫 공격 보너스로 공세를 열고, 공격 콤보와 레드라인 드로우를 이어 피니셔로 끝냅니다.",
    complexity: 1,
    complexityLabel: "입문",
    easyLabel: "공격 순서만 잡아도 강해집니다",
    strengths: ["첫 공격 피해", "공격 연결", "빠른 피니셔"],
    playstyle: [
      "첫 공격에 가장 강한 타격을 배치",
      "레드라인으로 다음 공격 확보",
      "콤보 열기 3으로 피니셔 준비",
    ],
    recommendedCards: [
      "redline",
      "doubletap",
      "popuppowerbomb",
      "foldingpowerbomb",
    ],
    startingDeck: standardDeck("redline"),
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
    role: "가드 그래플러",
    roleEn: "Guard Grappler",
    strategy:
      "잡기 피해 보너스와 공격·방어 겸용 홀드로 상대 의도를 받아내고 남은 방어를 다음 턴에 이어 갑니다.",
    complexity: 1,
    complexityLabel: "입문",
    easyLabel: "공격과 방어를 한 카드로 해결합니다",
    strengths: ["잡기 피해", "높은 체력", "방어 최대 3 유지"],
    playstyle: [
      "공격 의도에 카운터 홀드 사용",
      "잡기로 피해와 방어 동시 확보",
      "남은 방어를 다음 턴에 유지",
    ],
    recommendedCards: [
      "ironclad",
      "spinebuster",
      "figurefour",
      "sitoutpowerbomb",
    ],
    startingDeck: standardDeck("ironclad"),
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
    role: "드로우 테크니션",
    roleEn: "Draw Technician",
    strategy:
      "턴마다 첫 0코스트 카드로 추가 드로우를 얻고, 소멸 카드와 에너지 회복을 묶어 긴 공세를 설계합니다.",
    complexity: 3,
    complexityLabel: "숙련",
    easyLabel: "덱 순환과 에너지 계산을 즐기는 선수",
    strengths: ["추가 드로우", "0코스트 연결", "유연한 카드 순환"],
    playstyle: [
      "첫 0코스트 카드로 손패 확장",
      "템포 스틸로 에너지 확보",
      "소멸 후 얇아진 덱으로 핵심 카드 반복",
    ],
    recommendedCards: ["flashstep", "quickdraw", "armdrag", "collartie"],
    startingDeck: standardDeck("flashstep"),
  },
  viper: {
    id: "viper",
    name: "VIPER",
    nameKo: "바이퍼",
    title: "THE PRECISION ACE",
    age: 27,
    maxHp: 72,
    signature: "headlock",
    passive:
      "약화·취약 상대 공격 피해 +2 · 매 턴 첫 약화·취약 카드 사용 후 취약 1 추가",
    description:
      "금발의 두 갈래 땋은 머리와 그린·레드 장비를 갖춘 냉철한 제압 전문가.",
    accent: "#9fbe65",
    artKey: "viper",
    role: "상태 제압 전문가",
    roleEn: "Precision Controller",
    strategy:
      "헤드록으로 공격을 약화시키고 취약을 열어, 강화된 후속 공격과 카운터 홀드로 유리한 교환을 반복합니다.",
    complexity: 2,
    complexityLabel: "전술",
    easyLabel: "상태를 건 뒤 후속타를 넣으세요",
    strengths: ["약화로 피해 억제", "취약 생성", "상태 상대 추가 피해"],
    playstyle: [
      "첫 약화·취약 카드로 취약 1 추가",
      "상태가 남은 상대에게 후속 공격",
      "공격 의도에 카운터 홀드로 방어",
    ],
    recommendedCards: ["headlock", "armbar", "kimura", "heelhook"],
    startingDeck: [
      "strike",
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "headlock",
      "headlock",
      "reversal",
    ],
  },
  ember: {
    id: "ember",
    name: "EMBER",
    nameKo: "엠버",
    title: "THE CROWD'S CHAMPION",
    age: 32,
    maxHp: 80,
    signature: "spotlight",
    passive:
      "매 턴 첫 기술 카드로 열기 +1·압박 -3 · 체력이 절반 이하면 체력 +2",
    description:
      "물결치는 갈색 머리와 블랙·레드·골드 장비로 관중을 이끄는 파워 챔피언.",
    accent: "#e6a958",
    artKey: "ember",
    role: "관중 컴백 챔피언",
    roleEn: "Crowd Champion",
    strategy:
      "기술 카드로 관중 열기와 침착함을 얻고, 낮은 체력에서는 회복과 컴백 방어로 버티며 피니셔를 반복합니다.",
    complexity: 2,
    complexityLabel: "전술",
    easyLabel: "기술 카드가 피니셔의 시동을 겁니다",
    strengths: ["기술 카드 열기", "압박 관리", "낮은 체력의 컴백"],
    playstyle: [
      "첫 기술 카드로 관중 패시브 발동",
      "스포트라이트와 함성으로 열기 확보",
      "절반 이하 체력에서 컴백 방어와 회복",
    ],
    recommendedCards: ["spotlight", "rally", "waistlock", "sharpshooter"],
    startingDeck: [
      "strike",
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "spotlight",
      "rally",
      "comeback",
    ],
  },
  atlas: {
    id: "atlas",
    newcomer: true,
    name: "ATLAS",
    nameKo: "아틀라스",
    title: "THE RING TITAN",
    age: 33,
    maxHp: 86,
    signature: "sitoutpowerbomb",
    passive: "매 턴 첫 2코스트 이상 잡기 공격의 피해 +4 · 방어 +3",
    description: "강한 어깨와 단단한 중심으로 상대를 들어 올리는 파워하우스.",
    accent: "#dc9366",
    artKey: "atlas",
    role: "파워밤 파워하우스",
    roleEn: "Powerbomb Powerhouse",
    strategy:
      "턴의 첫 고코스트 잡기에 피해와 방어를 더합니다. 허리 고정으로 준비한 뒤 파워밤을 넣고, 남은 에너지로 상대 공격을 받아내세요.",
    complexity: 1,
    complexityLabel: "입문",
    easyLabel: "강한 잡기 한 장으로 공세를 시작하세요",
    strengths: ["높은 체력", "큰 잡기의 추가 피해", "파워밤 방어 보너스"],
    playstyle: [
      "첫 2코스트 이상 잡기에 보너스 집중",
      "웨이스트록으로 다음 공격 준비",
      "큰 기술 뒤 남은 에너지로 방어",
    ],
    recommendedCards: [
      "sitoutpowerbomb",
      "gutwrenchpowerbomb",
      "spinebuster",
      "waistlock",
    ],
    startingDeck: [
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "bodyslam",
      "waistlock",
      "sitoutpowerbomb",
      "shoulder",
    ],
  },
  seraph: {
    id: "seraph",
    newcomer: true,
    name: "SERAPH",
    nameKo: "세라프",
    title: "THE SKYWARD STAR",
    age: 25,
    maxHp: 72,
    signature: "moonsault",
    passive: "매 턴 첫 드롭킥·문설트 사용 후 에너지 +1 · 1장 추가 드로우",
    description:
      "탄탄한 하체와 경쾌한 도약으로 공중에서 경기의 리듬을 바꾸는 선수.",
    accent: "#73aedb",
    artKey: "seraph",
    role: "공중 순환 에이스",
    roleEn: "Aerial Cycle Ace",
    strategy:
      "드롭킥이나 문설트로 턴당 한 번 에너지와 새 카드를 얻습니다. 먼저 가벼운 공격으로 콤보를 열면 드롭킥의 피해도 커집니다.",
    complexity: 3,
    complexityLabel: "숙련",
    easyLabel: "도약 후 돌아오는 에너지로 다음 수를 설계하세요",
    strengths: ["공중기 에너지 환급", "추가 드로우", "도약과 콤보 연결"],
    playstyle: [
      "드롭킥 전에 가벼운 공격 사용",
      "문설트 뒤 에너지와 손패 확인",
      "턴마다 공중 순환 한 번 활용",
    ],
    recommendedCards: ["moonsault", "dropkick", "quickdraw", "encore"],
    startingDeck: [
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "dropkick",
      "dropkick",
      "moonsault",
      "rally",
    ],
  },
  lynx: {
    id: "lynx",
    newcomer: true,
    name: "LYNX",
    nameKo: "링스",
    title: "THE JOINT HUNTER",
    age: 29,
    maxHp: 74,
    signature: "kimura",
    passive: "매 턴 첫 관절기 사용 후 방어 +3 · 압박 −3",
    description:
      "균형 잡힌 운동선수 체형과 예리한 그립으로 팔과 다리의 빈틈을 찾는 헌터.",
    accent: "#b995d4",
    artKey: "lynx",
    role: "관절기 서브미션 헌터",
    roleEn: "Joint Submission Hunter",
    strategy:
      "암바·기무라 같은 관절기로 취약과 약화를 준비하면서 방어와 침착함을 얻습니다. 제압 이후의 공격을 이어 유리한 교환을 쌓으세요.",
    complexity: 2,
    complexityLabel: "전술",
    easyLabel: "관절기로 시작하면 방어와 압박 관리가 따라옵니다",
    strengths: ["관절기 추가 방어", "압박 관리", "약화와 취약의 균형"],
    playstyle: [
      "첫 관절기로 방어와 침착함 확보",
      "취약 이후 후속 공격 연결",
      "공격 의도에는 약화 관절기 선택",
    ],
    recommendedCards: ["kimura", "armbar", "anklelock", "figurefour"],
    startingDeck: [
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "armbar",
      "armbar",
      "americana",
      "kimura",
    ],
  },
  tempest: {
    id: "tempest",
    newcomer: true,
    name: "TEMPEST",
    nameKo: "템페스트",
    title: "THE THROW STORM",
    age: 28,
    maxHp: 76,
    signature: "popuppowerbomb",
    passive: "매 턴 콤보 1 이상에서 첫 잡기 공격의 피해 +3 · 열기 +1",
    description:
      "탄탄한 허리와 빠른 발놀림으로 작은 진입을 연속 던지기로 바꾸는 선수.",
    accent: "#64bca2",
    artKey: "tempest",
    role: "연속 던지기 스페셜리스트",
    roleEn: "Chain Throw Specialist",
    strategy:
      "타격이나 암 드래그로 콤보를 연 뒤 잡기로 이어 가면 피해와 열기가 증가합니다. 팝업 파워밤의 콤보 보너스까지 겹쳐 큰 한 방을 노리세요.",
    complexity: 2,
    complexityLabel: "전술",
    easyLabel: "첫 공격 다음에 잡기를 배치하세요",
    strengths: ["연결 잡기 추가 피해", "빠른 열기 확보", "콤보 파워밤"],
    playstyle: [
      "가벼운 공격으로 콤보 시동",
      "다음 잡기로 턴당 연결 보너스",
      "열기를 피니셔로 전환",
    ],
    recommendedCards: [
      "armdrag",
      "snapsuplex",
      "popuppowerbomb",
      "foldingpowerbomb",
    ],
    startingDeck: [
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "armdrag",
      "bodyslam",
      "snapsuplex",
      "popuppowerbomb",
    ],
  },
  onyx: {
    id: "onyx",
    newcomer: true,
    name: "ONYX",
    nameKo: "오닉스",
    title: "THE COUNTER SENTINEL",
    age: 30,
    maxHp: 84,
    signature: "crossface",
    passive:
      "매 턴 상대 공격 준비 중 첫 카운터 기술 사용 후 방어 +4 · 다음 공격 피해 +3",
    description:
      "강한 팔다리와 안정된 자세로 상대의 진입을 읽어 되받는 수비형 선수.",
    accent: "#8f89c8",
    artKey: "onyx",
    role: "수비 카운터 센티널",
    roleEn: "Defensive Counter Sentinel",
    strategy:
      "상대의 공개된 공격 의도를 읽고 카운터 홀드·크로스페이스·스파인버스터를 사용합니다. 추가 방어로 충돌을 버틴 뒤 강화된 후속 공격을 넣으세요.",
    complexity: 2,
    complexityLabel: "전술",
    easyLabel: "상대가 공격할 때 카운터부터 사용하세요",
    strengths: ["공격 의도 대응", "카운터 추가 방어", "강화된 반격"],
    playstyle: [
      "공격 의도에 카운터 카드 사용",
      "다음 공격 피해 보너스 활용",
      "방어·도발 의도에는 카운터 보너스가 쉬어 갑니다",
    ],
    recommendedCards: ["crossface", "reversal", "spinebuster", "ringcraft"],
    startingDeck: [
      "strike",
      "strike",
      "guard",
      "guard",
      "grapple",
      "focus",
      "finisher",
      "reversal",
      "reversal",
      "ringcraft",
      "crossface",
    ],
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
    artKey: "viper",
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
    artKey: "ember",
    pattern: ["attack", "guard", "taunt", "attack", "attack"],
  },
};

const REWARD_POOL = Object.keys(CARDS).filter((id) =>
  ["common", "uncommon", "rare"].includes(CARDS[id].rarity),
);
const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrestlerFor = (state) => WRESTLERS[state.player.id] || WRESTLERS.raven;

export const ITEM_CAPACITY = 3;
export const GIMMICK_CAPACITY = 6;
export const ITEMS = {
  icepack: {
    id: "icepack",
    name: "메디컬 아이스팩",
    description: "체력 18 회복 · 압박 5 감소",
    effects: { heal: 18, calm: 5 },
    cost: 35,
    artKey: "items/icepack.webp",
  },
  energygel: {
    id: "energygel",
    name: "러시 에너지 젤",
    description: "이번 턴 에너지 +2 · 압박 +4",
    effects: { energy: 2, stress: 4 },
    cost: 40,
    artKey: "items/energygel.webp",
  },
  resin: {
    id: "resin",
    name: "그립 레진",
    description: "방어 15",
    effects: { block: 15 },
    cost: 30,
    artKey: "items/resin.webp",
  },
  smokespray: {
    id: "smokespray",
    name: "쿨링 미스트",
    description: "상대 약화 2 · 취약 1",
    effects: { weak: 2, vulnerable: 1 },
    cost: 40,
    artKey: "items/smokespray.webp",
  },
  crowdwhistle: {
    id: "crowdwhistle",
    name: "관중 호루라기",
    description: "열기 +2 · 압박 4 감소",
    effects: { hype: 2, calm: 4 },
    cost: 35,
    artKey: "items/crowdwhistle.webp",
  },
  trainingtape: {
    id: "trainingtape",
    name: "전술 손목 테이프",
    description: "2장 드로우 · 이번 턴 다음 공격 피해 +4",
    effects: { draw: 2, nextAttack: 4 },
    cost: 35,
    artKey: "items/trainingtape.webp",
  },
};
export const GIMMICKS = {
  ironcorner: {
    id: "ironcorner",
    name: "철벽 코너",
    tier: "전술",
    duration: "encounter",
    description: "경기 시작 방어 7 · 매 턴 방어 +2",
    tradeoff: "첫 손패 1장 감소",
    effects: { startBlock: 7, turnBlock: 2, openingDraw: -1 },
    cost: 45,
    artKey: "gimmicks/ironcorner.webp",
  },
  spotlightcorner: {
    id: "spotlightcorner",
    name: "스포트라이트 코너",
    tier: "공세",
    duration: "encounter",
    description: "경기 시작 열기 +2 · 매 턴 열기 +1",
    tradeoff: "상대 공격력 +2",
    effects: { startHype: 2, turnHype: 1, enemyAttack: 2 },
    cost: 55,
    artKey: "gimmicks/spotlightcorner.webp",
  },
  grappleclinic: {
    id: "grappleclinic",
    name: "그래플링 클리닉",
    tier: "제압",
    duration: "encounter",
    description: "잡기 공격 피해 +3",
    tradeoff: "경기 시작 압박 +8",
    effects: { grappleDamage: 3, startStress: 8 },
    cost: 50,
    artKey: "gimmicks/grappleclinic.webp",
  },
  speedcorner: {
    id: "speedcorner",
    name: "오버드라이브 코너",
    tier: "속도",
    duration: "encounter",
    description: "매 턴 에너지 +1",
    tradeoff: "카드로 얻는 방어가 60%로 감소(내림)",
    effects: { turnEnergy: 1, cardBlockMultiplier: 0.6 },
    cost: 60,
    artKey: "gimmicks/speedcorner.webp",
  },
  icecorner: {
    id: "icecorner",
    name: "리커버리 코너",
    tier: "컴백",
    duration: "encounter",
    description: "매 턴 체력 3 회복",
    tradeoff: "모든 공격 피해 −2",
    effects: { turnHeal: 3, attackPenalty: 2 },
    cost: 50,
    artKey: "gimmicks/icecorner.webp",
  },
  mindcorner: {
    id: "mindcorner",
    name: "멘탈 코너",
    tier: "심리",
    duration: "encounter",
    description: "매 턴 압박 5 감소 · 악몽 드로우 압박 무효",
    tradeoff: "상대 최대 체력 +20%(올림)",
    effects: {
      turnCalm: 5,
      ignoreNightmareStress: true,
      enemyHpMultiplier: 1.2,
    },
    cost: 45,
    artKey: "gimmicks/mindcorner.webp",
  },
};

const ROUTE_TYPES = {
  fight: {
    type: "fight",
    label: "싱글 매치",
    description: "보통 위험 · 카드 3장 중 선택 · 35 크레딧",
    icon: "swords",
    risk: "보통",
    reward: {
      coins: 35,
      cardChoices: 3,
      rarities: ["common", "uncommon", "rare"],
      loot: "소모품 45% · 기믹 20%",
    },
    danger: { enemyTier: "normal", hpMultiplier: 1, attackBonus: 0 },
    artKey: "events/backstage.webp",
  },
  elite: {
    type: "elite",
    label: "메인 이벤트",
    description:
      "높은 위험 · 언커먼/레어 3장 중 선택 · 65 크레딧 · 소모품/기믹 확정",
    icon: "flame",
    risk: "높음",
    reward: {
      coins: 65,
      cardChoices: 3,
      rarities: ["uncommon", "rare"],
      loot: "소모품 1개 · 기믹 1개 확정",
    },
    danger: { enemyTier: "elite", hpMultiplier: 1, attackBonus: 0 },
    artKey: "events/highstakes.webp",
  },
  risk: {
    type: "risk",
    label: "하드코어 쇼다운",
    description:
      "최고 위험 · 정예 체력 +20%/공격 +2 · 레어 4장 중 선택 · 95 크레딧 · 소모품/기믹 확정",
    icon: "flame",
    risk: "최고",
    reward: {
      coins: 95,
      cardChoices: 4,
      rarities: ["rare"],
      loot: "소모품 1개 · 기믹 1개 확정",
    },
    danger: { enemyTier: "elite", hpMultiplier: 1.2, attackBonus: 2 },
    artKey: "events/highstakes.webp",
  },
  rest: {
    type: "rest",
    label: "락커룸",
    description: "회복 30% / 압박 −25와 악몽 제거 / 카드 1장 강화 중 선택",
    icon: "heart",
    risk: "회복",
    reward: { coins: 0, cardChoices: 0 },
    danger: null,
    artKey: "events/lockerroom.webp",
  },
  event: {
    type: "event",
    label: "백스테이지",
    description: "대가와 보상을 보고 이벤트 선택",
    icon: "sparkles",
    risk: "선택",
    reward: { coins: 0, cardChoices: 0 },
    danger: null,
    artKey: "events/backstage.webp",
  },
  shop: {
    type: "shop",
    label: "프로 숍",
    description: "카드·소모품·1경기 코너 기믹 구매",
    icon: "bag",
    risk: "준비",
    reward: { coins: 0, cardChoices: 0 },
    danger: null,
    artKey: "events/lockerroom.webp",
  },
  boss: {
    type: "boss",
    label: "챔피언십",
    description: "EMPRESS와 최종 결전 · 승리 보상 120 크레딧",
    icon: "crown",
    risk: "결승",
    reward: { coins: 120, cardChoices: 0 },
    danger: { enemyTier: "boss", hpMultiplier: 1, attackBonus: 0 },
    artKey: "events/highstakes.webp",
  },
};

function buildRouteGraph() {
  const nodes = [
    {
      ...clone(ROUTE_TYPES.fight),
      id: "f1-0",
      floor: 1,
      lane: 1,
      index: 0,
      label: "데뷔 매치",
    },
  ];
  for (let floor = 2; floor <= 7; floor++) {
    const types = [
      "fight",
      [3, 5, 7].includes(floor) ? "elite" : "rest",
      floor % 2 ? "shop" : "event",
      floor === 7 ? "rest" : "risk",
    ];
    types.forEach((type, index) =>
      nodes.push({
        ...clone(ROUTE_TYPES[type]),
        id: `f${floor}-${index}`,
        floor,
        lane: index,
        index,
        ...(floor === 7 && index === 3 ? { label: "최종 준비" } : {}),
      }),
    );
  }
  nodes.push({
    ...clone(ROUTE_TYPES.boss),
    id: "f8-0",
    floor: 8,
    lane: 1,
    index: 0,
  });
  const edges = [];
  for (const from of nodes)
    for (const to of nodes) {
      if (
        to.floor === from.floor + 1 &&
        (from.floor === 1 ||
          to.floor === 8 ||
          Math.abs(from.lane - to.lane) <= 1)
      )
        edges.push({ from: from.id, to: to.id });
    }
  return { nodes, edges };
}
export const ROUTE_GRAPH = buildRouteGraph();

const gimmickEffects = (state) =>
  GIMMICKS[state.activeGimmick?.id]?.effects || {};
const makeLootInstance = (state, id, kind) => ({
  uid: `${kind === "item" ? "i" : "g"}${state.nextUid++}`,
  id,
});
const addLoot = (state, kind, id) => {
  const definitions = kind === "item" ? ITEMS : GIMMICKS;
  const pile = kind === "item" ? state.inventory : state.gimmicks;
  const capacity = kind === "item" ? ITEM_CAPACITY : GIMMICK_CAPACITY;
  if (!definitions[id] || pile.length >= capacity) return false;
  pile.push(makeLootInstance(state, id, kind));
  return true;
};

/** Upgrade v1 saves without rerolling cards, offers, encounters, or their seed. */
export function normalizeRun(current) {
  const state = clone(current);
  const hadInventory = Array.isArray(state.inventory);
  state.inventory ||= [];
  state.gimmicks ||= [];
  state.equippedGimmickUid ??= null;
  state.activeGimmick ??= null;
  state.rewardLoot ||= { items: [], gimmicks: [] };
  state.lastChoice ??= null;
  state.arrival ??= null;
  state.lastImpact ??= null;
  if (!hadInventory && state.mechanicsVersion !== 2)
    addLoot(state, "item", "icepack");
  state.mechanicsVersion = 2;
  for (const item of state.relics || [])
    if (item.id === "energy-belt") {
      item.duration = "run";
      item.permanentLegacy = true;
      item.description =
        "기존 저장의 영구 장비 · 최대 에너지 +1 (런 종료까지 유지)";
    }
  if (!state.route) {
    const visited = (state.history || [])
      .map(
        (visit) =>
          (
            ROUTE_GRAPH.nodes.find(
              (node) => node.floor === visit.floor && node.type === visit.type,
            ) || ROUTE_GRAPH.nodes.find((node) => node.floor === visit.floor)
          )?.id,
      )
      .filter(Boolean);
    const currentNode =
      ROUTE_GRAPH.nodes.find(
        (node) =>
          node.floor === state.floor &&
          (node.type === state.enemy?.type || node.type === state.phase),
      ) ||
      ROUTE_GRAPH.nodes.find(
        (node) => node.floor === state.floor && node.id === visited.at(-1),
      ) ||
      ROUTE_GRAPH.nodes.find((node) => node.floor === state.floor);
    state.route = {
      currentNodeId: currentNode?.id || "f1-0",
      visited: visited.length ? visited : [currentNode?.id || "f1-0"],
    };
  }
  if (state.phase === "map") state.mapNodes = availableRouteNodes(state);
  return state;
}

function availableRouteNodes(state) {
  const current = state.route?.currentNodeId;
  const node = ROUTE_GRAPH.nodes.find((entry) => entry.id === current);
  // Old clients/tests may carry a manually advanced floor; normalize its origin safely.
  const origin =
    node?.floor === state.floor
      ? current
      : ROUTE_GRAPH.nodes.find((entry) => entry.floor === state.floor)?.id;
  const nextIds = ROUTE_GRAPH.edges
    .filter((edge) => edge.from === origin)
    .map((edge) => edge.to);
  return clone(ROUTE_GRAPH.nodes.filter((entry) => nextIds.includes(entry.id)));
}

export function getRouteView(state) {
  const visited = state.route?.visited || [];
  const available =
    state.phase === "map"
      ? availableRouteNodes(state).map((node) => node.id)
      : [];
  return {
    nodes: ROUTE_GRAPH.nodes.map((node) => ({
      ...clone(node),
      visited: visited.includes(node.id),
      current: node.id === state.route?.currentNodeId,
      available: available.includes(node.id),
    })),
    edges: ROUTE_GRAPH.edges.map((edge) => ({
      ...edge,
      visited: visited.some(
        (id, index) => id === edge.from && visited[index + 1] === edge.to,
      ),
      available:
        edge.from === state.route?.currentNodeId && available.includes(edge.to),
    })),
    currentNodeId: state.route?.currentNodeId || null,
    visited: [...visited],
  };
}

export function equipGimmick(current, uid = null) {
  if (
    !["map", "rest", "shop", "event", "reward"].includes(current.phase) ||
    (uid !== null &&
      !(current.gimmicks || []).some(
        (item) => item.uid === uid && GIMMICKS[item.id],
      ))
  )
    return current;
  if (current.equippedGimmickUid === uid) return current;
  const state = normalizeRun(current);
  state.equippedGimmickUid = uid;
  return state;
}

export function claimLoot(current, kind, id) {
  if (current.phase !== "reward" || !["item", "gimmick"].includes(kind))
    return current;
  const key = kind === "item" ? "items" : "gimmicks";
  const pile =
    kind === "item" ? current.inventory || [] : current.gimmicks || [];
  if (
    !(current.rewardLoot?.[key] || []).includes(id) ||
    pile.length >= (kind === "item" ? ITEM_CAPACITY : GIMMICK_CAPACITY)
  )
    return current;
  const state = normalizeRun(current);
  if (!addLoot(state, kind, id)) return current;
  state.rewardLoot[key] = [];
  addLog(
    state,
    `${(kind === "item" ? ITEMS : GIMMICKS)[id].name}을 보관했습니다.`,
    "reward",
  );
  return state;
}

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
  if (effects.spendHype) parts.push(`열기 ${effects.spendHype} 소모`);
  if (effects.damage)
    parts.push(
      `피해 ${effects.damage}${effects.hits > 1 ? ` × ${effects.hits}` : ""}`,
    );
  if (effects.comboDamage)
    parts.push(
      `이번 턴 콤보 ${effects.comboRequired || 1} 이상이면 피해 +${effects.comboDamage}`,
    );
  if (effects.extraCombo) parts.push(`콤보 +${effects.extraCombo}`);
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
    if (definition.onDrawStress && !gimmickEffects(state).ignoreNightmareStress)
      gainStress(state, definition.onDrawStress);
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
  const isElite = type === "elite" || type === "risk";
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
  if (type === "risk") {
    state.enemy.maxHp = Math.ceil(state.enemy.maxHp * 1.2);
    state.enemy.hp = state.enemy.maxHp;
    state.enemy.attack += 2;
  }
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
  state.status = freshTurnStatus();
  state.rewards = [];
  state.rewardCoins = 0;
  state.mapNodes = [];
  state.event = null;
  state.shopItems = [];
  state.rewardLoot = { items: [], gimmicks: [] };
  state.activeGimmick = null;
  const staged = (state.gimmicks || []).find(
    (item) => item.uid === state.equippedGimmickUid,
  );
  if (staged && GIMMICKS[staged.id]) {
    state.gimmicks = state.gimmicks.filter((item) => item.uid !== staged.uid);
    state.activeGimmick = {
      ...staged,
      duration: "encounter",
      encounterNodeId: state.route?.currentNodeId || null,
    };
    addLog(
      state,
      `${GIMMICKS[staged.id].name} · 이번 경기 동안 활성화. ${GIMMICKS[staged.id].tradeoff}.`,
      "gimmick",
    );
  }
  state.equippedGimmickUid = null;
  const gimmick = gimmickEffects(state);
  state.enemy.attack += gimmick.enemyAttack || 0;
  if (gimmick.enemyHpMultiplier) {
    state.enemy.maxHp = Math.ceil(
      state.enemy.maxHp * gimmick.enemyHpMultiplier,
    );
    state.enemy.hp = state.enemy.maxHp;
  }
  state.player.block += gimmick.startBlock || 0;
  state.player.hype = Math.min(9, state.player.hype + (gimmick.startHype || 0));
  if (gimmick.startStress) gainStress(state, gimmick.startStress);
  applyTurnGimmick(state);
  setIntent(state);
  addLog(state, `${state.enemy.name}과의 경기가 시작됩니다.`, "encounter");
  drawCards(state, Math.max(1, 5 + (gimmick.openingDraw || 0)));
}

function applyTurnGimmick(state) {
  const effects = gimmickEffects(state);
  state.energy = Math.min(10, state.energy + (effects.turnEnergy || 0));
  state.player.block += effects.turnBlock || 0;
  if (effects.turnHype)
    state.player.hype = Math.min(9, state.player.hype + effects.turnHype);
  if (effects.turnHeal)
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + effects.turnHeal,
    );
  if (effects.turnCalm) calm(state, effects.turnCalm);
}

export function newRun(wrestlerId = "raven", seed = 20903) {
  const wrestler = WRESTLERS[wrestlerId] || WRESTLERS.raven;
  const state = {
    version: 1,
    mechanicsVersion: 2,
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
    inventory: [],
    gimmicks: [],
    equippedGimmickUid: null,
    activeGimmick: null,
    rewardLoot: { items: [], gimmicks: [] },
    route: { currentNodeId: "f1-0", visited: ["f1-0"] },
    arrival: null,
    lastChoice: null,
    lastImpact: null,
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
  for (const id of wrestler.startingDeck) {
    state.deck.push(makeInstance(state, id));
  }
  addLoot(state, "item", "icepack");
  addLoot(state, "gimmick", "ironcorner");
  state.equippedGimmickUid = state.gimmicks[0].uid;
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

function freshTurnStatus() {
  return {
    firstAttack: true,
    firstZero: true,
    nextAttack: 0,
    precisionUsed: false,
    crowdUsed: false,
    powerUsed: false,
    aerialUsed: false,
    jointUsed: false,
    chainUsed: false,
    counterUsed: false,
  };
}

// The first five rookies keep their established rules. These named technique
// families define the new specialists without depending on UI/library modules.
const AERIAL_CYCLE_CARDS = new Set(["dropkick", "moonsault"]);
const JOINT_LOCK_CARDS = new Set([
  "armbar",
  "kimura",
  "americana",
  "anklelock",
  "kneebar",
  "heelhook",
  "figurefour",
]);
const isPowerAttack = (definition) =>
  definition.effects.damage > 0 && definition.grapple && definition.cost >= 2;
const isChainAttack = (definition, combo) =>
  definition.effects.damage > 0 && definition.grapple && combo >= 1;

// This bonus is shared with the damage preview. Viper checks statuses that
// already exist before this card; the card's new debuff benefits follow-up hits.
function attackBonus(state, definition) {
  const effects = definition.effects;
  const id = wrestlerFor(state).id;
  let bonus = state.status.nextAttack || 0;
  if (state.status.firstAttack && id === "raven") bonus += 2;
  if (definition.grapple && id === "valkyrie") bonus += 2;
  if (id === "atlas" && !state.status.powerUsed && isPowerAttack(definition))
    bonus += 4;
  if (
    id === "tempest" &&
    !state.status.chainUsed &&
    isChainAttack(definition, state.combo)
  )
    bonus += 3;
  const gimmick = gimmickEffects(state);
  if (definition.grapple) bonus += gimmick.grappleDamage || 0;
  bonus -= gimmick.attackPenalty || 0;
  if (id === "viper" && (state.enemy.weak > 0 || state.enemy.vulnerable > 0))
    bonus += 2;
  if (effects.comboDamage && state.combo >= (effects.comboRequired || 1))
    bonus += effects.comboDamage;
  return bonus;
}

function applyCardPassive(state, definition, comboBefore) {
  if (state.phase !== "combat" || state.player.hp <= 0) return 0;
  const id = wrestlerFor(state).id;
  const effects = definition.effects;
  let extraDraw = 0;
  // Missing flags in older JSON saves mean "not yet used". Once written,
  // these plain booleans survive saving without rearming during the same turn.
  if (
    id === "viper" &&
    !state.status.precisionUsed &&
    (effects.weak || effects.vulnerable)
  ) {
    state.status.precisionUsed = true;
    state.enemy.vulnerable += 1;
    addLog(state, "정밀 제압 · 취약 +1. 후속 공격의 기회입니다.", "passive");
  }
  if (
    id === "ember" &&
    definition.type === "skill" &&
    !state.status.crowdUsed
  ) {
    state.status.crowdUsed = true;
    const hype = Math.min(1, 9 - state.player.hype);
    const stress = Math.min(3, state.player.stress);
    const healing =
      state.player.hp <= state.player.maxHp / 2
        ? Math.min(2, state.player.maxHp - state.player.hp)
        : 0;
    state.player.hype += hype;
    calm(state, 3);
    state.player.hp += healing;
    addLog(
      state,
      `관중의 챔피언 · 열기 +${hype}, 압박 -${stress}${healing ? `, 체력 +${healing}` : ""}.`,
      "passive",
    );
  }
  if (id === "atlas" && !state.status.powerUsed && isPowerAttack(definition)) {
    state.status.powerUsed = true;
    state.player.block += 3;
    addLog(state, "링의 거인 · 큰 잡기 피해 +4, 방어 +3.", "passive");
  }
  if (
    id === "seraph" &&
    !state.status.aerialUsed &&
    effects.damage > 0 &&
    AERIAL_CYCLE_CARDS.has(definition.id)
  ) {
    state.status.aerialUsed = true;
    const energy = Math.min(1, 10 - state.energy);
    state.energy += energy;
    extraDraw = 1;
    addLog(
      state,
      `스카이 사이클 · 에너지 +${energy}, 추가 드로우 1.`,
      "passive",
    );
  }
  if (
    id === "lynx" &&
    !state.status.jointUsed &&
    effects.damage > 0 &&
    JOINT_LOCK_CARDS.has(definition.id)
  ) {
    state.status.jointUsed = true;
    const stress = Math.min(3, state.player.stress);
    state.player.block += 3;
    calm(state, 3);
    addLog(state, `조인트 헌터 · 방어 +3, 압박 −${stress}.`, "passive");
  }
  if (
    id === "tempest" &&
    !state.status.chainUsed &&
    isChainAttack(definition, comboBefore)
  ) {
    state.status.chainUsed = true;
    const hype = Math.min(1, 9 - state.player.hype);
    state.player.hype += hype;
    addLog(state, `던지기 폭풍 · 연결 잡기 피해 +3, 열기 +${hype}.`, "passive");
  }
  if (
    id === "onyx" &&
    !state.status.counterUsed &&
    effects.counterBlock > 0 &&
    state.enemy.intent.type === "attack"
  ) {
    state.status.counterUsed = true;
    state.player.block += 4;
    state.status.nextAttack += 3;
    addLog(state, "카운터 센티널 · 방어 +4, 다음 공격 피해 +3.", "passive");
  }
  return extraDraw;
}

export function playCard(current, instanceId) {
  if (!canPlayCard(current, instanceId)) return current;
  const state = normalizeRun(current);
  const index = state.hand.findIndex((c) => c.uid === instanceId);
  const instance = state.hand.splice(index, 1)[0];
  const definition = getCard(instance);
  const effects = definition.effects;
  const wrestler = wrestlerFor(state);
  state.energy -= definition.cost;
  state.stats.cardsPlayed++;
  let dealt = 0;
  const enemyBlockBefore = state.enemy.block;
  const comboBefore = state.combo;

  if (effects.spendHype) {
    state.player.hype -= effects.spendHype;
    state.stats.finishers++;
  }
  if (effects.damage) {
    const bonus = attackBonus(state, definition);
    state.status.nextAttack = 0;
    let amount = Math.max(0, effects.damage + bonus);
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
    state.player.block += Math.floor(
      block * (gimmickEffects(state).cardBlockMultiplier || 1),
    );
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
  const passiveDraw = applyCardPassive(state, definition, comboBefore);
  (definition.exhaust ? state.exhaust : state.discard).push(instance);
  addLog(
    state,
    `${definition.name}${dealt ? ` · 피해 ${dealt}` : ""}`,
    definition.type,
  );
  state.lastImpact = {
    attacker: "player",
    damage: dealt,
    blocked: enemyBlockBefore - state.enemy.block,
    hits: effects.damage ? effects.hits || 1 : 0,
    type: "card",
    id: instance.id,
    turn: state.turn,
  };

  if (state.phase !== "combat") return state;
  if (state.enemy.hp === 0) {
    finishCombat(state);
    return state;
  }
  let draw = (effects.draw || 0) + passiveDraw;
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
  expireGimmick(state);
  addLog(state, "카운트 3. 오늘의 도전은 여기까지입니다.", "defeat");
}

function sampleRewards(state, count = 3, elite = false, rareOnly = false) {
  const available = rareOnly
    ? REWARD_POOL.filter((id) => CARDS[id].rarity === "rare")
    : elite
      ? REWARD_POOL.filter((id) => CARDS[id].rarity !== "common")
      : REWARD_POOL;
  return shuffle(state, [...available]).slice(0, count);
}

function finishCombat(state) {
  state.stats.enemiesDefeated++;
  const isBoss = state.enemy.type === "boss";
  state.rewardCoins = isBoss
    ? 120
    : state.enemy.type === "risk"
      ? 95
      : state.enemy.type === "elite"
        ? 65
        : 35;
  state.player.coins += state.rewardCoins;
  state.player.block = 0;
  calm(state, 5);
  expireGimmick(state);
  if (isBoss) {
    state.phase = "victory";
    addLog(state, "AND NEW! 당신이 새로운 챔피언입니다.", "victory");
  } else {
    state.phase = "reward";
    const risk = state.enemy.type === "risk";
    const premium = risk || state.enemy.type === "elite";
    state.rewards = sampleRewards(state, risk ? 4 : 3, premium, risk);
    state.rewardLoot = {
      items:
        premium || random(state) < 0.45
          ? [
              Object.keys(ITEMS)[
                Math.floor(random(state) * Object.keys(ITEMS).length)
              ],
            ]
          : [],
      gimmicks:
        premium || random(state) < 0.2
          ? [
              Object.keys(GIMMICKS)[
                Math.floor(random(state) * Object.keys(GIMMICKS).length)
              ],
            ]
          : [],
    };
    addLog(
      state,
      `승리! ${state.rewardCoins} 크레딧을 획득했습니다.`,
      "victory",
    );
  }
}

function expireGimmick(state) {
  if (state.activeGimmick)
    addLog(
      state,
      `${GIMMICKS[state.activeGimmick.id]?.name || "코너 기믹"} · 경기 종료로 만료.`,
      "gimmick",
    );
  state.activeGimmick = null;
}

export function useItem(current, uid) {
  if (
    current.phase !== "combat" ||
    !(current.inventory || []).some(
      (item) => item.uid === uid && ITEMS[item.id],
    )
  )
    return current;
  const state = normalizeRun(current);
  const index = state.inventory.findIndex((item) => item.uid === uid);
  const item = state.inventory.splice(index, 1)[0];
  const definition = ITEMS[item.id];
  const effects = definition.effects;
  if (effects.block) state.player.block += effects.block;
  if (effects.energy)
    state.energy = Math.min(10, state.energy + effects.energy);
  if (effects.hype)
    state.player.hype = Math.min(9, state.player.hype + effects.hype);
  if (effects.heal)
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + effects.heal,
    );
  if (effects.calm) calm(state, effects.calm);
  if (effects.stress) gainStress(state, effects.stress);
  if (effects.weak) state.enemy.weak += effects.weak;
  if (effects.vulnerable) state.enemy.vulnerable += effects.vulnerable;
  if (effects.nextAttack) state.status.nextAttack += effects.nextAttack;
  addLog(state, `${definition.name} 사용 · ${definition.description}`, "item");
  state.lastImpact = {
    attacker: "player",
    damage: 0,
    blocked: 0,
    hits: 0,
    type: "item",
    id: item.id,
    turn: state.turn,
  };
  if (state.phase === "combat" && effects.draw) drawCards(state, effects.draw);
  return state;
}

export function endTurn(current) {
  if (current.phase !== "combat") return current;
  const state = normalizeRun(current);
  state.discard.push(...state.hand.splice(0));
  const intent = state.enemy.intent;
  state.lastImpact = {
    attacker: "enemy",
    damage: 0,
    blocked: 0,
    hits: intent.type === "attack" ? 1 : 0,
    type: intent.type,
    turn: state.turn,
  };
  if (intent.type === "attack") {
    const attack =
      state.enemy.weak > 0 ? Math.floor(intent.value * 0.75) : intent.value;
    const blocked = Math.min(state.player.block, attack);
    const damage = attack - blocked;
    state.player.block -= blocked;
    state.player.hp = Math.max(0, state.player.hp - damage);
    state.lastImpact.damage = damage;
    state.lastImpact.blocked = blocked;
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
  state.status = freshTurnStatus();
  applyTurnGimmick(state);
  setIntent(state);
  drawCards(state, 5);
  return state;
}

function openMap(state) {
  state.phase = "map";
  state.rewards = [];
  state.rewardLoot = { items: [], gimmicks: [] };
  state.hand = [];
  state.player.block = 0;
  state.arrival = null;
  state.mapNodes = availableRouteNodes(state);
}

export function mapForFloor(floor) {
  return clone(
    ROUTE_GRAPH.nodes.filter(
      (node) => node.floor === Math.min(8, Math.max(1, Number(floor))),
    ),
  );
}

export function chooseReward(current, cardId = null) {
  if (
    current.phase !== "reward" ||
    (cardId !== null && !current.rewards.includes(cardId))
  )
    return current;
  const state = normalizeRun(current);
  if (cardId) {
    state.deck.push(makeInstance(state, cardId));
    addLog(state, `${CARDS[cardId].name}을 덱에 추가했습니다.`, "reward");
  } else addLog(state, "카드 보상을 건너뛰었습니다.");
  openMap(state);
  return state;
}

export const EVENTS = [
  {
    id: "press",
    artKey: "events/backstage.webp",
    cutscene: {
      title: "ON AIR",
      subtitle: "백스테이지 인터뷰",
      artKey: "events/backstage.webp",
    },
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
    artKey: "events/lockerroom.webp",
    cutscene: {
      title: "THE VETERAN",
      subtitle: "베테랑의 코너",
      artKey: "events/lockerroom.webp",
    },
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
    artKey: "events/highstakes.webp",
    cutscene: {
      title: "HIGH STAKES",
      subtitle: "조건을 고르세요",
      artKey: "events/highstakes.webp",
    },
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
  {
    id: "cornercoach",
    title: "코너의 작전판",
    description:
      "코치가 다음 경기를 위한 코너 전략을 제안합니다. 장점과 대가는 한 경기 동안 함께 적용됩니다.",
    artKey: "events/lockerroom.webp",
    cutscene: {
      title: "CORNER PLAN",
      subtitle: "다음 한 경기를 위한 준비",
      artKey: "events/lockerroom.webp",
    },
    choices: [
      {
        id: "overdrive",
        label: "공세 코너를 준비한다",
        description:
          "크레딧 −30 · 오버드라이브 코너 획득 (1경기 에너지 +1 / 카드 방어 60%)",
        effects: { coins: -30, gimmick: "speedcorner" },
      },
      {
        id: "steady",
        label: "차분히 작전을 듣는다",
        description: "압박 12 감소",
        effects: { calm: 12 },
      },
      {
        id: "gel",
        label: "에너지 젤을 챙긴다",
        description: "러시 에너지 젤 획득 · 압박 +6",
        effects: { item: "energygel", stress: 6 },
      },
    ],
  },
  {
    id: "physio",
    title: "메디컬 체크",
    description:
      "트레이너가 현재 컨디션과 다음 경기의 준비 사이에서 선택을 권합니다.",
    artKey: "events/lockerroom.webp",
    cutscene: {
      title: "RECOVERY",
      subtitle: "몸과 호흡을 정비하세요",
      artKey: "events/lockerroom.webp",
    },
    choices: [
      {
        id: "pack",
        label: "아이스팩을 보관한다",
        description: "메디컬 아이스팩 획득 · 체력 −6 (최소 1 유지)",
        effects: { item: "icepack", damage: 6 },
      },
      {
        id: "recover",
        label: "지금 회복한다",
        description: "체력 12 회복",
        effects: { heal: 12 },
      },
      {
        id: "recovercorner",
        label: "회복 코너를 준비한다",
        description:
          "크레딧 −25 · 리커버리 코너 획득 (1경기 턴 회복3 / 공격 −2)",
        effects: { coins: -25, gimmick: "icecorner" },
      },
    ],
  },
  {
    id: "challenge",
    title: "위험한 오픈 챌린지",
    description:
      "도전장의 서명은 큰 후원금을 약속합니다. 몸과 정신에 남는 대가를 확인하세요.",
    artKey: "events/highstakes.webp",
    cutscene: {
      title: "OPEN CHALLENGE",
      subtitle: "명성과 대가",
      artKey: "events/highstakes.webp",
    },
    choices: [
      {
        id: "sign",
        label: "도전장에 서명한다",
        description: "크레딧 +80 · 체력 −12 (최소 1 유지) · 압박 +15",
        effects: { coins: 80, damage: 12, stress: 15 },
      },
      {
        id: "decline",
        label: "컨디션을 우선한다",
        description: "체력 4 회복 · 압박 10 감소",
        effects: { heal: 4, calm: 10 },
      },
      {
        id: "spotlight",
        label: "관중의 압박을 이용한다",
        description:
          "스포트라이트 코너 획득 · 압박 +10 (1경기 열기 증가 / 상대 공격 +2)",
        effects: { gimmick: "spotlightcorner", stress: 10 },
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
  for (const id of shuffle(state, Object.keys(ITEMS)).slice(0, 2))
    state.shopItems.push({
      id: `item-${id}`,
      itemId: id,
      name: ITEMS[id].name,
      description: ITEMS[id].description,
      cost: ITEMS[id].cost,
      kind: "item",
      artKey: ITEMS[id].artKey,
    });
  for (const id of shuffle(state, Object.keys(GIMMICKS)).slice(0, 2))
    state.shopItems.push({
      id: `gimmick-${id}`,
      gimmickId: id,
      name: GIMMICKS[id].name,
      description: `${GIMMICKS[id].description} · ${GIMMICKS[id].tradeoff} · 1경기`,
      cost: GIMMICKS[id].cost,
      kind: "gimmick",
      artKey: GIMMICKS[id].artKey,
    });
}

export function advanceToNode(current, nodeIndex) {
  if (current.phase !== "map") return current;
  const normalized = normalizeRun(current);
  const node = availableRouteNodes(normalized).find((n) =>
    typeof nodeIndex === "string" && nodeIndex.startsWith("f")
      ? n.id === nodeIndex
      : n.index === Number(nodeIndex),
  );
  if (!node) return current;
  const state = normalized;
  state.floor++;
  state.route.currentNodeId = node.id;
  state.route.visited.push(node.id);
  state.lastChoice = null;
  state.lastImpact = null;
  state.history.push({
    floor: state.floor,
    type: node.type,
    label: node.label,
    nodeId: node.id,
    risk: node.risk,
  });
  state.mapNodes = [];
  state.arrival = {
    nodeId: node.id,
    type: node.type,
    label: node.label,
    artKey: node.artKey,
    cutscene: {
      title:
        node.type === "rest"
          ? "LOCKER ROOM"
          : node.type === "event"
            ? "BACKSTAGE"
            : node.type === "risk"
              ? "HIGH STAKES"
              : node.label,
      subtitle: node.description,
      artKey: node.artKey,
    },
    choices: [],
  };
  if (["fight", "elite", "risk", "boss"].includes(node.type))
    startCombat(state, node.type);
  else if (node.type === "rest") {
    state.phase = "rest";
    state.enemy = null;
    state.arrival.choices = getRestChoices(state);
    addLog(state, "락커룸에서 잠시 숨을 고릅니다.");
  } else if (node.type === "shop") {
    state.phase = "shop";
    state.enemy = null;
    openShop(state);
  } else if (node.type === "event") {
    state.phase = "event";
    state.enemy = null;
    state.event = clone(EVENTS[Math.floor(random(state) * EVENTS.length)]);
    state.arrival.artKey = state.event.artKey;
    state.arrival.cutscene = clone(state.event.cutscene);
    state.arrival.choices = clone(state.event.choices);
  }
  return state;
}

export function getRestChoices(state) {
  return [
    {
      id: "heal",
      label: "재충전",
      description: `최대 체력의 30% 회복 (최대 ${Math.ceil(state.player.maxHp * 0.3)}) · 압박 5 감소`,
      effects: { heal: Math.ceil(state.player.maxHp * 0.3), calm: 5 },
    },
    {
      id: "meditate",
      label: "멘탈 정비",
      description: "압박 25 감소 · 영구 덱의 악몽 1장 제거",
      effects: { calm: 25, removeNightmare: 1 },
    },
    {
      id: "upgrade",
      label: "개별 기술 훈련",
      description: "선택한 카드 1장 영구 강화",
      effects: { upgrade: 1 },
    },
  ];
}

function recordChoice(state, current, type, choice) {
  const result = [];
  const hp = state.player.hp - current.player.hp;
  const maxHp = state.player.maxHp - current.player.maxHp;
  const coins = state.player.coins - current.player.coins;
  const stress = state.player.stress - current.player.stress;
  if (hp) result.push(`체력 ${hp > 0 ? "+" : ""}${hp}`);
  if (maxHp) result.push(`최대 체력 +${maxHp}`);
  if (coins) result.push(`크레딧 ${coins > 0 ? "+" : ""}${coins}`);
  if (stress) result.push(`압박 ${stress > 0 ? "+" : ""}${stress}`);
  if (choice.effects.card)
    result.push(`${CARDS[choice.effects.card].name} 획득`);
  if (choice.effects.item)
    result.push(`${ITEMS[choice.effects.item].name} 보관`);
  if (choice.effects.gimmick)
    result.push(`${GIMMICKS[choice.effects.gimmick].name} 보관`);
  if (choice.effects.upgrade) result.push("선택한 기술 영구 강화");
  if (choice.effects.removeNightmare && state.deck.length < current.deck.length)
    result.push("악몽 1장 제거");
  if (!result.length) result.push("컨디션을 유지했습니다.");
  state.lastChoice = {
    type,
    id: choice.id,
    label: choice.label,
    description: choice.description,
    effects: clone(choice.effects),
    result,
  };
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
  const state = normalizeRun(current);
  upgradeInPlace(state, instanceId);
  recordChoice(
    state,
    current,
    "rest",
    getRestChoices(current).find((choice) => choice.id === "upgrade"),
  );
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
  const state = normalizeRun(current);
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
  recordChoice(
    state,
    current,
    "rest",
    getRestChoices(current).find((choice) => choice.id === action),
  );
  openMap(state);
  return state;
}

export function buyItem(current, itemOrId) {
  if (current.phase !== "shop") return current;
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  const item = current.shopItems.find((item) => item.id === id && !item.sold);
  if (!item || current.player.coins < item.cost) return current;
  if (item.kind === "item" && (current.inventory || []).length >= ITEM_CAPACITY)
    return current;
  if (
    item.kind === "gimmick" &&
    (current.gimmicks || []).length >= GIMMICK_CAPACITY
  )
    return current;
  if (item.kind === "upgrade" && !bestUpgrade(current)) return current;
  if (item.kind === "heal" && current.player.hp === current.player.maxHp)
    return current;
  const state = normalizeRun(current);
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
  if (item.kind === "item") addLoot(state, "item", item.itemId);
  if (item.kind === "gimmick") addLoot(state, "gimmick", item.gimmickId);
  if (item.kind === "relic") {
    state.maxEnergy++;
    state.relics.push({
      id: item.id,
      name: item.name,
      description: item.description,
      duration: "run",
      permanentLegacy: true,
    });
  }
  addLog(state, `${item.name} 구매 · ${item.cost} 크레딧`, "shop");
  return state;
}

export function leaveShop(current) {
  if (current.phase !== "shop") return current;
  const state = normalizeRun(current);
  openMap(state);
  return state;
}

export function canResolveEventChoice(current, choiceId) {
  if (current.phase !== "event") return false;
  const choice = current.event?.choices.find((c) => c.id === choiceId);
  if (!choice) return false;
  const effects = choice.effects;
  return (
    (!effects.damage || current.player.hp > effects.damage) &&
    (!(effects.coins < 0) || current.player.coins >= -effects.coins) &&
    (!effects.item ||
      ((current.inventory || []).length < ITEM_CAPACITY &&
        !!ITEMS[effects.item])) &&
    (!effects.gimmick ||
      ((current.gimmicks || []).length < GIMMICK_CAPACITY &&
        !!GIMMICKS[effects.gimmick]))
  );
}

export function resolveEvent(current, choiceId) {
  if (current.phase !== "event" || !canResolveEventChoice(current, choiceId))
    return current;
  const choice = current.event.choices.find((entry) => entry.id === choiceId);
  const state = normalizeRun(current);
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
  if (effects.damage) state.player.hp -= effects.damage;
  if (effects.calm) calm(state, effects.calm);
  if (effects.stress) gainStress(state, effects.stress);
  if (effects.card) state.deck.push(makeInstance(state, effects.card));
  if (effects.item) addLoot(state, "item", effects.item);
  if (effects.gimmick) addLoot(state, "gimmick", effects.gimmick);
  recordChoice(state, current, "event", choice);
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
  const bonus = attackBonus(state, definition);
  let damage = Math.max(0, effects.damage + bonus);
  if (state.enemy.vulnerable > 0) damage = Math.floor(damage * 1.5);
  return damage * (effects.hits || 1);
}
