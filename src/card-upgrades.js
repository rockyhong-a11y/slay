/**
 * Named, mutually exclusive permanent specializations. Patches merge into the
 * original card (never into the legacy + upgrade). Keeping this module free of
 * game imports also lets saved-deck validation reject invented specializations.
 */
const path = (id, label, focus, effects, extra = {}) => ({
  id,
  label,
  focus,
  effects,
  ...extra,
});
const force = (label, focus, effects, extra) =>
  path("force", label, focus, effects, extra);
const control = (label, focus, effects, extra) =>
  path("control", label, focus, effects, extra);
const flow = (label, focus, effects, extra) =>
  path("flow", label, focus, effects, extra);

export const CARD_UPGRADE_PATHS = {
  redline: [
    force("레드 존", "압박을 감수한 강타", { damage: 15, stress: 4 }),
    control("쿨 헤드", "부담 없는 압박 제어", {
      damage: 10,
      stress: 0,
      calm: 5,
    }),
    flow("오버드라이브", "다음 기술을 잇는 드로우", {
      damage: 10,
      stress: 2,
      draw: 2,
    }),
  ],
  ironclad: [
    force("아이언 브레이커", "취약으로 여는 공세", {
      damage: 9,
      vulnerable: 1,
    }),
    control("아이언 월", "단단한 방어와 약화", { block: 13, weak: 1 }),
    flow("체인 클러치", "후속 공격 연결", {
      damage: 7,
      draw: 1,
      nextAttack: 3,
    }),
  ],
  flashstep: [
    force("플래시 임팩트", "콤보 시작과 순간 화력", {
      damage: 8,
      extraCombo: 1,
    }),
    control("사이드 이베이드", "공격하면서 회피 준비", { damage: 5, block: 6 }),
    flow("라이트닝 스텝", "두 장으로 여는 선택지", { damage: 5, draw: 2 }),
  ],
  dropkick: [
    force("미사일 킥", "선행 콤보 보상 강화", { damage: 12, comboDamage: 6 }),
    control("니 브레이커", "약화와 안전한 착지", {
      damage: 9,
      weak: 2,
      block: 3,
    }),
    flow("리바운드 킥", "공중기 이후 패 연결", {
      damage: 9,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  suplex: [
    force("데드리프트 수플렉스", "큰 기본 피해", { damage: 24 }),
    control("브리지 홀드", "착지 후 방어와 약화", {
      damage: 18,
      block: 7,
      weak: 1,
    }),
    flow("롤링 수플렉스", "후속 던지기를 준비", {
      damage: 18,
      draw: 1,
      nextAttack: 4,
    }),
  ],
  reversal: [
    force("리버설 임팩트", "반격 후 다음 타격 강화", {
      damage: 10,
      nextAttack: 3,
    }),
    control("락다운 카운터", "공격 의도에 강한 수비", {
      block: 10,
      counterBlock: 8,
      weak: 1,
    }),
    flow(
      "리버설 스위치",
      "적은 에너지로 역전",
      { damage: 6, block: 7 },
      { cost: 0 },
    ),
  ],
  spotlight: [
    force("메인 스포트라이트", "빠른 피니셔 준비", { hype: 4 }),
    control("컴포트 존", "관중 압박을 방어로", { block: 7, calm: 6 }),
    flow("쇼타임", "열기와 두 장 드로우", { draw: 2 }),
  ],
  rally: [
    force("피버 콜", "열기와 후속 강타", { hype: 2, nextAttack: 5 }),
    control("원 모어 챈트", "압박을 크게 낮춤", { calm: 14, block: 4 }),
    flow("크라우드 웨이브", "응원을 다음 카드로", { hype: 2, draw: 1 }),
  ],
  shoulder: [
    force("스피어 드라이브", "취약을 남기는 돌진", {
      damage: 11,
      vulnerable: 1,
    }),
    control("브레이스 태클", "충돌 뒤 수비 확보", { damage: 8, block: 9 }),
    flow("런닝 체인", "빠르게 콤보 연결", {
      damage: 8,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  ringcraft: [
    force("킬링 앵글", "다음 한 방 집중", { nextAttack: 11 }),
    control("링 제너럴", "공격을 읽는 강한 방어", { block: 15, weak: 1 }),
    flow("포지션 스위치", "수비하며 패 보충", { block: 11, draw: 1 }),
  ],
  headlock: [
    force("크랭크 헤드록", "대미지와 후속 취약", { damage: 11, vulnerable: 1 }),
    control("슬리퍼 프레셔", "지속 약화와 안정", { weak: 4, calm: 5 }),
    flow("스냅 헤드록", "콤보와 카드 순환", {
      damage: 8,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  quickdraw: [
    force("액셀러레이터", "폭발적인 행동 자원", { energy: 2 }),
    control("세이프 템포", "자원을 얻으며 수비", { block: 7, calm: 5 }),
    flow("딥 포커스", "원하는 패를 더 찾기", { draw: 3 }),
  ],
  moonsault: [
    force("하이 앵글 문설트", "고공에서 큰 피해", { damage: 27 }),
    control("세이프 랜딩", "착지 후 공격 대비", {
      damage: 20,
      block: 9,
      calm: 4,
    }),
    flow("스타더스트 체인", "열기와 패 연결", { damage: 20, hype: 2, draw: 1 }),
  ],
  steelwill: [
    force("언브레이커블", "공세로 바뀌는 인내", { block: 10, nextAttack: 7 }),
    control("아이언 멘탈", "강한 방어와 압박 해소", { block: 14, calm: 20 }),
    flow("리셋 브레스", "방어와 패 순환", { block: 10, draw: 1 }),
  ],
  doubletap: [
    force("헤비 원 투", "두 타격의 피해 강화", { damage: 8 }),
    control("바디 투 헤드", "약화와 취약을 동시 준비", {
      damage: 6,
      weak: 1,
      vulnerable: 1,
    }),
    flow("트리플 비트", "세 타격으로 콤보 가속", { hits: 3, extraCombo: 2 }),
  ],
  powerbomb: [
    force("라스트 라이드", "연계 뒤 결정적인 폭발", {
      damage: 29,
      comboDamage: 11,
    }),
    control("크래시 앤 커버", "매트 충격 뒤 방어", {
      damage: 24,
      block: 10,
      weak: 1,
    }),
    flow("스위프트 밤", "한 번의 콤보로 연결", {
      damage: 24,
      comboRequired: 1,
      draw: 1,
    }),
  ],
  encore: [
    force("피날레 콜", "뽑은 공격 카드 강화", { nextAttack: 7, hype: 1 }),
    control("리커버리 콜", "패를 채우며 회복", { block: 6, calm: 8 }),
    flow("더블 앙코르", "많은 선택지를 확보", { draw: 5 }),
  ],
  championship: [
    force("그랜드 챔피언", "승부를 끝내는 화력", { damage: 47, heal: 7 }),
    control("챔피언 리커버리", "큰 회복과 수비", {
      damage: 36,
      heal: 13,
      block: 10,
    }),
    flow("챔피언 리듬", "적은 열기로 쓰는 피니셔", {
      damage: 37,
      spendHype: 2,
      draw: 1,
    }),
  ],
  comeback: [
    force("리벤지 스탠드", "버틴 뒤 강한 반격", { block: 14, nextAttack: 8 }),
    control("라스트 스탠드", "위기에서 더욱 강한 방어", {
      block: 17,
      lowHpBlock: 17,
      calm: 6,
    }),
    flow("세컨드 윈드", "회복과 재정비", { block: 14, heal: 3, draw: 1 }),
  ],
  sitoutpowerbomb: [
    force("딥 시트 밤", "낮은 중심의 강타", { damage: 25, hype: 1 }),
    control("앵커 시트", "낙하 후 단단한 방어", { damage: 19, block: 14 }),
    flow("싯아웃 링크", "다음 공세로 이어가기", {
      damage: 20,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  jackknifepowerbomb: [
    force("타워 브레이커", "더 큰 위험과 큰 피해", { damage: 49, stress: 6 }),
    control("컨트롤드 폴", "압박 없는 착지와 수비", {
      damage: 36,
      stress: 0,
      block: 9,
    }),
    flow(
      "퀵 릴리스",
      "에너지 부담 완화",
      { damage: 34, stress: 2 },
      { cost: 2 },
    ),
  ],
  popuppowerbomb: [
    force("스카이 캐처", "선행 콤보의 폭발력", { damage: 21, comboDamage: 13 }),
    control("캐치 앤 브레이스", "상대 진입을 막는 방어", {
      damage: 16,
      block: 8,
      counterBlock: 5,
    }),
    flow("팝업 릴레이", "열기와 추가 카드", { damage: 17, hype: 2, draw: 1 }),
  ],
  gutwrenchpowerbomb: [
    force("토크 드라이버", "회전력과 취약", { damage: 23, vulnerable: 1 }),
    control("아이언 웨이스트", "약화와 방어 집중", {
      damage: 17,
      weak: 4,
      block: 9,
    }),
    flow("거트렌치 체인", "회전 뒤 다음 기술 연결", {
      damage: 18,
      draw: 1,
      nextAttack: 4,
    }),
  ],
  foldingpowerbomb: [
    force("딥 폴딩 프레스", "조건 달성 시 큰 마무리", {
      damage: 26,
      comboDamage: 16,
    }),
    control("핀다운 프레스", "압박 고정과 두터운 방어", {
      damage: 21,
      block: 16,
      weak: 2,
    }),
    flow("퀵 폴드", "낮은 콤보 조건과 드로우", {
      damage: 21,
      comboRequired: 1,
      draw: 1,
    }),
  ],
  bodyslam: [
    force("헤비 바디 슬램", "취약을 남기는 슬램", {
      damage: 12,
      vulnerable: 1,
    }),
    control("브레이스 슬램", "작은 비용의 확실한 방어", {
      damage: 9,
      block: 8,
    }),
    flow("슬램 릴레이", "다음 패와 다음 공격", {
      damage: 9,
      draw: 1,
      nextAttack: 2,
    }),
  ],
  powerslam: [
    force("러닝 파워 슬램", "선행 공격 뒤 큰 피해", {
      damage: 25,
      comboDamage: 8,
    }),
    control("소프트 랜딩", "공격 후 안정적인 수비", {
      damage: 18,
      block: 9,
      calm: 9,
    }),
    flow("스핀 사이클", "회전을 이어가는 드로우", {
      damage: 19,
      draw: 1,
      hype: 1,
    }),
  ],
  sidewalkslam: [
    force("사이드 임팩트", "단단한 후속 공격", { damage: 11, nextAttack: 3 }),
    control("사이드 앵커", "수비와 약화", { damage: 7, block: 11, weak: 1 }),
    flow("사이드 스텝", "카드 순환과 안정", { damage: 8, draw: 1, calm: 4 }),
  ],
  spinebuster: [
    force("더블 레그 크래시", "취약과 강한 내려찍기", {
      damage: 23,
      vulnerable: 1,
    }),
    control("스톱 모션", "공격 의도를 완전히 받기", {
      damage: 16,
      block: 12,
      counterBlock: 10,
    }),
    flow("리턴 드라이브", "역공의 다음 패 준비", {
      damage: 18,
      draw: 1,
      nextAttack: 4,
    }),
  ],
  bellysuplex: [
    force("오버헤드 수플렉스", "취약을 남기는 강타", {
      damage: 24,
      vulnerable: 2,
    }),
    control("허리 잠금 브리지", "공방을 동시에 준비", {
      damage: 17,
      block: 9,
      weak: 1,
    }),
    flow("벨리 투 체인", "두 장으로 이어가는 던지기", {
      damage: 17,
      draw: 2,
      extraCombo: 1,
    }),
  ],
  snapsuplex: [
    force("스냅 임팩트", "압박과 교환하는 강타", { damage: 13, stress: 3 }),
    control("클린 스냅", "압박 없이 안전한 교환", {
      damage: 8,
      stress: 0,
      block: 5,
    }),
    flow("퀵 스냅", "한 장 더 뽑는 전개", { damage: 8, draw: 2, stress: 1 }),
  ],
  samoandrop: [
    force("마운틴 드롭", "열기를 모으는 강타", { damage: 25, hype: 2 }),
    control("캐리 앤 커버", "약화와 착지 방어", {
      damage: 18,
      weak: 3,
      block: 6,
    }),
    flow("캐리 릴레이", "공격 이후 손패 보충", {
      damage: 20,
      draw: 1,
      nextAttack: 3,
    }),
  ],
  armbar: [
    force("익스텐디드 암바", "취약 상태의 화력 준비", {
      damage: 10,
      vulnerable: 3,
    }),
    control("암 트랩", "약화와 방어 확보", { damage: 6, weak: 2, block: 4 }),
    flow("스위치 암바", "관절기 연계와 드로우", {
      damage: 7,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  kimura: [
    force("더블 토크", "피해와 강한 취약", { damage: 11, vulnerable: 2 }),
    control("숄더 락다운", "약화로 공격 억제", {
      damage: 7,
      weak: 3,
      block: 4,
    }),
    flow("기무라 스위치", "다음 홀드로 전환", {
      damage: 8,
      draw: 1,
      nextAttack: 3,
    }),
  ],
  americana: [
    force("키록 프레셔", "관절 압박과 취약", { damage: 10, vulnerable: 1 }),
    control("마운트 컨트롤", "방어와 장기 약화", {
      damage: 6,
      block: 10,
      weak: 2,
    }),
    flow("키록 스위치", "홀드 이후 카드 보충", {
      damage: 7,
      block: 6,
      draw: 1,
    }),
  ],
  anklelock: [
    force("앵클 크랭크", "하체를 무너뜨리는 취약", {
      damage: 11,
      vulnerable: 1,
    }),
    control("레그 어레스트", "길게 남기는 약화", {
      damage: 7,
      weak: 4,
      calm: 8,
    }),
    flow("앵클 스위치", "발목 제어 이후 연계", {
      damage: 8,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  kneebar: [
    force("스트레이트 니바", "취약을 극대화", { damage: 20, vulnerable: 3 }),
    control("레그 쉴드", "하체 제어와 방어", {
      damage: 14,
      block: 11,
      weak: 2,
    }),
    flow("니바 트랜지션", "다음 공격까지 연결", {
      damage: 15,
      draw: 1,
      nextAttack: 5,
    }),
  ],
  heelhook: [
    force("딥 힐훅", "큰 취약으로 후속 폭발", { damage: 9, vulnerable: 4 }),
    control("레그 엔탱글", "압도적인 약화와 방어", {
      damage: 5,
      weak: 5,
      block: 7,
    }),
    flow(
      "캐치 앤 릴리스",
      "에너지 없이 약화 전개",
      { damage: 5, draw: 1 },
      { cost: 0 },
    ),
  ],
  figurefour: [
    force("피겨 포 크랭크", "관절 압박과 취약", { damage: 19, vulnerable: 2 }),
    control("피겨 포 앵커", "낮은 체력의 수비 강화", {
      damage: 12,
      block: 18,
      lowHpBlock: 12,
    }),
    flow("리버스 피겨 포", "방어하며 새 카드 확보", {
      damage: 13,
      block: 13,
      draw: 2,
    }),
  ],
  bostoncrab: [
    force("라이언 크랩", "취약을 남기는 압박", { damage: 9, vulnerable: 1 }),
    control("딥 시트 크랩", "약화와 수비", { damage: 5, weak: 3, block: 4 }),
    flow("크랩 워크", "열기와 패 전개", { damage: 6, hype: 2, draw: 1 }),
  ],
  sharpshooter: [
    force("데드아이 홀드", "강한 최종 압박", { damage: 40, weak: 4 }),
    control("센티널 홀드", "강한 약화와 방어", {
      damage: 29,
      weak: 5,
      block: 13,
    }),
    flow("퀵드로 홀드", "적은 열기와 다음 패", {
      damage: 30,
      spendHype: 2,
      draw: 1,
    }),
  ],
  crossface: [
    force("크로스페이스 크랭크", "강한 압박과 취약", {
      damage: 12,
      vulnerable: 1,
    }),
    control("크로스페이스 월", "공격 의도에 수비 집중", {
      damage: 7,
      block: 9,
      counterBlock: 8,
      calm: 8,
    }),
    flow("크로스페이스 롤", "반격 이후 순환", {
      damage: 8,
      draw: 1,
      extraCombo: 1,
    }),
  ],
  collartie: [
    force("칼라 브레이커", "다음 한 방을 준비", { nextAttack: 9, hype: 1 }),
    control("칼라 쉴드", "무료 방어와 약화", { block: 9, weak: 1 }),
    flow("칼라 스위치", "준비와 패 교체", { block: 4, nextAttack: 4, draw: 1 }),
  ],
  armdrag: [
    force("암 드라이버", "무료 공격과 취약", { damage: 7, vulnerable: 1 }),
    control("암 캐치", "빈틈 없는 가벼운 수비", {
      damage: 4,
      block: 7,
      weak: 1,
    }),
    flow("암 릴레이", "연속 콤보와 드로우", {
      damage: 4,
      draw: 1,
      extraCombo: 2,
    }),
  ],
  waistlock: [
    force("데드리프트 셋업", "다음 던지기의 화력", {
      block: 8,
      nextAttack: 13,
    }),
    control("웨이스트 앵커", "상대 진입을 견디는 준비", {
      block: 13,
      counterBlock: 5,
    }),
    flow("웨이스트 스위치", "후속 기술을 더 찾기", {
      block: 8,
      draw: 2,
      nextAttack: 7,
    }),
  ],
};

export function getUpgradePath(id, pathId) {
  return CARD_UPGRADE_PATHS[id]?.find((entry) => entry.id === pathId) || null;
}

export function isValidUpgradePath(id, pathId) {
  return !!getUpgradePath(id, pathId);
}
