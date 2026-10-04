import { CARDS, getCard } from "./game.js";

export const CARD_DISCIPLINES = [
  { id: "strike", slug: "strike", label: "타격" },
  { id: "aerial", slug: "aerial", label: "공중기" },
  { id: "throw", slug: "throw", label: "던지기" },
  { id: "submission", slug: "submission", label: "서브미션" },
  { id: "grapple", slug: "grapple", label: "잡기" },
  { id: "defense", slug: "defense", label: "방어" },
  { id: "tactics", slug: "tactics", label: "운영" },
  { id: "nightmare", slug: "nightmare", label: "악몽" },
];

export const CARD_TYPE_LABELS = {
  attack: "공격",
  skill: "기술",
  finisher: "피니셔",
  nightmare: "악몽",
};
export const CARD_RARITY_LABELS = {
  starter: "시작 카드",
  signature: "시그니처",
  common: "커먼",
  uncommon: "언커먼",
  rare: "레어",
  nightmare: "악몽",
};

const starting = "세 선수 모두의 시작 덱에 포함됩니다.";
const reward = "일반 경기 카드 보상 또는 프로 숍에서 획득합니다.";
const premium = "일반·정예 경기 카드 보상 또는 프로 숍에서 획득합니다.";
const detail = (id, disciplineSlug, alt, technique, acquisition) => ({
  id,
  discipline: CARD_DISCIPLINES.find((d) => d.id === disciplineSlug).label,
  disciplineSlug,
  art: `cards/${id}.webp`,
  alt,
  technique,
  acquisition,
});

export const CARD_DETAILS = {
  strike: detail(
    "strike",
    "strike",
    "레이븐이 상대의 상체에 날카로운 엘보 스트라이크를 넣는 장면",
    "팔꿈치로 짧고 빠르게 상대의 상체를 가격하는 기본 타격입니다. 첫 공격을 강화하는 레이븐의 패시브와 함께 콤보를 시작하기 좋습니다.",
    starting,
  ),
  guard: detail(
    "guard",
    "defense",
    "링 로프 옆에서 두 팔로 상체를 보호하는 선수",
    "로프 근처에서 팔과 자세를 단단히 세워 공격을 받아냅니다. 상대의 공개된 공격 의도를 보고 필요한 만큼 방어를 확보하세요.",
    starting,
  ),
  grapple: detail(
    "grapple",
    "grapple",
    "두 선수가 링 중앙에서 목과 팔을 잡고 클린치를 겨루는 장면",
    "상대의 목과 팔을 묶어 거리를 통제하는 클린치입니다. 공격과 방어를 함께 확보하며 발키리의 잡기 피해 보너스를 받습니다.",
    starting,
  ),
  focus: detail(
    "focus",
    "tactics",
    "노바가 링 코너에서 눈을 감고 호흡을 가다듬는 장면",
    "경기 사이의 짧은 호흡으로 압박을 낮추고 다음 수를 찾습니다. 에너지 없이 드로우할 수 있지만 사용 후에는 해당 경기에서 소멸합니다.",
    starting,
  ),
  finisher: detail(
    "finisher",
    "strike",
    "레이븐이 도약하여 상대의 상체에 플라잉 니 피니셔를 시도하는 장면",
    "관중의 함성을 등에 업고 도약해 무릎으로 상체를 강타하는 플라잉 니입니다. 열기를 먼저 확보해야 결정적인 한 방을 사용할 수 있습니다.",
    starting,
  ),
  redline: detail(
    "redline",
    "strike",
    "붉은 머리 레이븐이 팔뚝을 뻗으며 돌진해 러닝 포어암 래리어트를 넣는 장면",
    "팔뚝을 가로로 뻗으며 돌진해 상대의 상체를 가격하는 러닝 포어암 래리어트입니다. 압박을 감수하며 공격과 드로우를 함께 이어 갑니다.",
    "레이븐의 시작 덱에만 포함되는 시그니처 카드입니다.",
  ),
  ironclad: detail(
    "ironclad",
    "submission",
    "선수가 상대의 팔을 잡아 아이언 클러치 서브미션을 거는 장면",
    "상대의 팔을 강하게 고정하는 발키리의 압박 홀드입니다. 피해와 방어를 동시에 얻고, 잡기 공격으로 분류되어 발키리의 패시브 보너스도 받습니다.",
    "발키리의 시작 덱에만 포함되는 시그니처 카드입니다.",
  ),
  flashstep: detail(
    "flashstep",
    "strike",
    "노바가 옆으로 빠져나오며 짧고 빠른 타격을 넣는 장면",
    "사이드 스텝으로 공격선을 벗어나 짧은 타격을 꽂습니다. 0코스트 공격으로 콤보와 드로우를 연결하며 노바의 첫 0코스트 패시브를 활용합니다.",
    "노바의 시작 덱에만 포함되는 시그니처 카드입니다.",
  ),
  dropkick: detail(
    "dropkick",
    "strike",
    "선수가 두 발을 앞으로 뻗어 상대의 가슴에 드롭킥을 넣는 장면",
    "도약한 뒤 두 발을 동시에 뻗어 상대를 밀어내는 드롭킥입니다. 이번 턴에 다른 공격을 먼저 사용하면 추가 피해를 얻습니다.",
    "일반 경기 보상·프로 숍 또는 백스테이지 인터뷰 이벤트에서 획득합니다.",
  ),
  suplex: detail(
    "suplex",
    "throw",
    "선수가 뒤에서 상대의 허리를 잡아 저먼 수플렉스로 넘기는 장면",
    "뒤에서 허리를 잠그고 몸을 뒤로 젖혀 상대를 넘기는 저먼 수플렉스입니다. 취약을 부여한 뒤 후속 공격으로 큰 피해를 노릴 수 있습니다.",
    "일반·정예 경기 보상·프로 숍 또는 베테랑의 훈련 이벤트에서 획득합니다.",
  ),
  reversal: detail(
    "reversal",
    "submission",
    "선수가 상대의 잡기를 뒤집어 팔을 비틀며 카운터 홀드를 거는 장면",
    "상대의 진입을 받아 손목과 팔을 되잡는 역전 홀드입니다. 공격을 준비하는 상대에게 사용할 때 추가 방어를 얻습니다. 발키리의 잡기 피해 보너스도 받습니다.",
    reward,
  ),
  spotlight: detail(
    "spotlight",
    "tactics",
    "선수가 링 한가운데에서 스포트라이트와 관중의 함성을 받는 장면",
    "관중의 시선을 끌어 경기의 분위기를 자기 쪽으로 가져옵니다. 열기 확보와 드로우를 함께 제공해 피니셔를 준비합니다.",
    reward,
  ),
  rally: detail(
    "rally",
    "tactics",
    "트레이닝복을 입은 선수가 정면에서 두 팔을 펼쳐 올리며 관중의 응원을 끌어내는 장면",
    "관중의 응원에 응답하며 자신감을 되찾습니다. 에너지를 쓰지 않고 열기를 얻고 압박을 낮추지만 해당 경기에서 소멸합니다.",
    "일반 경기 보상·프로 숍 또는 스폰서 제안 이벤트에서 획득합니다.",
  ),
  shoulder: detail(
    "shoulder",
    "strike",
    "선수가 어깨를 낮추고 상대의 상체에 숄더 태클을 넣는 장면",
    "달려들며 낮춘 어깨로 상대의 중심을 무너뜨리는 타격입니다. 피해를 넣으면서 다음 충돌에 대비한 방어도 확보합니다.",
    reward,
  ),
  ringcraft: detail(
    "ringcraft",
    "defense",
    "선수가 링의 거리와 상대의 자세를 읽으며 방어 자세를 잡는 장면",
    "링의 거리와 상대의 타이밍을 계산하는 방어 기술입니다. 방어를 얻고 이번 턴의 다음 공격을 강화하므로 카드 순서를 계획하세요.",
    premium,
  ),
  headlock: detail(
    "headlock",
    "submission",
    "선수가 상대의 머리를 팔 아래로 잡아 사이드 헤드록을 거는 장면",
    "머리와 목 주변을 팔로 고정해 상대의 자세를 제한하는 헤드록입니다. 피해와 약화를 함께 주며 발키리의 잡기 피해 보너스도 받습니다.",
    reward,
  ),
  quickdraw: detail(
    "quickdraw",
    "tactics",
    "노바가 재빠르게 자세를 바꾸며 다음 기술을 준비하는 장면",
    "상대가 자세를 되찾기 전에 한 박자 먼저 움직여 템포를 빼앗습니다. 에너지와 드로우를 늘려 같은 턴의 선택지를 확장합니다.",
    premium,
  ),
  moonsault: detail(
    "moonsault",
    "aerial",
    "선수가 탑 로프에서 뒤로 회전하며 문설트로 날아드는 장면",
    "탑 로프에서 뒤로 회전하여 몸으로 상대를 덮치는 공중기입니다. 큰 피해와 열기를 함께 얻어 다음 피니셔를 준비합니다.",
    premium,
  ),
  steelwill: detail(
    "steelwill",
    "defense",
    "선수가 두 팔을 단단히 올리고 압박 속에서도 중심을 지키는 장면",
    "흔들리는 마음과 자세를 동시에 바로잡는 방어 기술입니다. 피해를 막으며 압박도 낮추어 악몽 유입을 늦춥니다.",
    reward,
  ),
  doubletap: detail(
    "doubletap",
    "strike",
    "선수가 왼손 잽과 오른손 스트레이트를 연속으로 넣는 원 투 콤보 장면",
    "왼손 잽에 오른손 스트레이트를 연결하는 원 투입니다. 두 번의 피해 판정과 추가 콤보로 열기를 빠르게 쌓습니다.",
    premium,
  ),
  powerbomb: detail(
    "powerbomb",
    "throw",
    "선수가 상대를 어깨 위로 들어 올려 파워밤을 준비하는 장면",
    "상대를 어깨 높이로 들어 올려 매트로 내려치는 파워밤입니다. 이번 턴의 선행 콤보가 충분히 쌓였을 때 사용하면 추가 피해를 얻습니다.",
    premium,
  ),
  encore: detail(
    "encore",
    "tactics",
    "선수가 관중을 향해 다시 손짓하며 다음 공세를 준비하는 장면",
    "관중의 호응을 다시 끌어내며 경기의 다음 장면을 준비합니다. 여러 장을 새로 뽑아 현재 턴의 공격과 방어를 고를 수 있습니다.",
    premium,
  ),
  championship: detail(
    "championship",
    "throw",
    "선수가 상대를 어깨에 메고 파이어맨스 캐리 드라이버 피니셔로 내려치는 장면",
    "상대를 양어깨에 메고 회전해 매트로 연결하는 파이어맨스 캐리 드라이버입니다. 열기를 소모하는 큰 피해와 회복을 제공하며 해당 경기에서 소멸합니다.",
    premium,
  ),
  comeback: detail(
    "comeback",
    "defense",
    "선수가 매트에서 다시 일어나 양팔로 가드를 세우는 장면",
    "다운 직후 다시 자세를 세워 다음 공격을 버티는 회복력의 표현입니다. 체력이 최대치의 절반 이하일 때 추가 방어를 얻습니다.",
    premium,
  ),
  nightmare: detail(
    "nightmare",
    "nightmare",
    "텅 빈 링과 관중의 시선이 선수의 악몽처럼 겹치는 장면",
    "기술이 아닌 심리적 압박의 흔적입니다. 뽑을 때 압박이 증가하지만 에너지를 지불해 사용하면 진정할 수 있습니다. 소멸은 한 경기 동안만 적용됩니다.",
    "압박 35·60·85 임계치에서 자동으로 덱에 추가됩니다. 명상 또는 멘탈 코칭으로 영구 덱의 악몽 1장을 제거할 수 있습니다.",
  ),
};

export function getCardDetail(idOrInstance) {
  const id = typeof idOrInstance === "string" ? idOrInstance : idOrInstance?.id;
  return CARD_DETAILS[id] || null;
}

export function getLibraryCards({
  search = "",
  discipline = "all",
  type = "all",
  rarity = "all",
  upgraded = false,
} = {}) {
  const query = search.trim().toLocaleLowerCase();
  return Object.keys(CARDS)
    .map((id) => ({ ...getCard({ id, upgraded }), ...CARD_DETAILS[id] }))
    .filter(
      (card) => discipline === "all" || card.disciplineSlug === discipline,
    )
    .filter((card) => type === "all" || card.type === type)
    .filter((card) => rarity === "all" || card.rarity === rarity)
    .filter(
      (card) =>
        !query ||
        [
          card.name,
          card.nameEn,
          card.id,
          card.discipline,
          card.disciplineSlug,
          card.description,
          card.technique,
          card.acquisition,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query),
    );
}
