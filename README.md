# SLAY | Ring of Nightmares

오리지널 여성 프로레슬링 세계를 배경으로 한 싱글 플레이 덱빌딩 로그라이크 웹게임입니다. 상대의 행동을 읽고 공격과 가드를 연결하며, 관중의 열기로 피니셔를 완성하세요. 심리적 압박은 악몽 카드를 덱에 남깁니다.

[플레이](https://rockyhong-a11y.github.io/slay/) · [카드 도감](https://rockyhong-a11y.github.io/slay/#cards) · [카드 시스템 도움말](https://rockyhong-a11y.github.io/slay/#guide) · [GitHub](https://github.com/rockyhong-a11y/slay) · [게임 설계](docs/GAME_DESIGN.md)

![SLAY living technique cinematic](artifacts/slay-live-cast.jpg)

현재 버전은 **시작부터 챔피언십까지 플레이 가능한 버티컬 슬라이스**입니다. 선수 3명, 카드 25종, 8개 구간과 최종 보스가 구현되어 있습니다. 각 선수는 보통·흥분·열혈·좌절·지침·그로기(normal/excited/fiery/frustrated/tired/groggy) 6개 상태를 가집니다. 보통은 기존 전신을 사용하고, 나머지는 새 투명 포즈 WebP 15장(867×1300)으로 표현합니다.

컨디션은 자동으로 바뀝니다. 체력 25% 이하는 그로기, 25% 초과–50% 이하는 지침을 우선 적용합니다. 체력이 50%를 넘으면 압박 60 이상은 좌절, 열기 6 이상은 열혈, 열기 3–5는 흥분, 나머지는 보통입니다. 선수의 컨디션 배지를 누르면 상태별 기준과 포즈·모션을 미리 볼 수 있습니다.

![SLAY living fighter condition preview](artifacts/slay-live-condition.jpg)

기존 선수·포즈 18장과 카드 25장, **총 43장에 커스텀 WebGL 2D 메시 리그**를 적용했습니다. 아레나·프로필·선수 선택, 손패·덱·보상, 도감·상세 창과 시네마틱에서 같은 아트가 움직입니다. 보이는 눈의 깜박임과 시선, 머리·머리카락·몸의 국소 움직임을 만들고 링 로프와 관중 등 배경은 고정합니다. 포즈 변경은 부드럽게 교차 전환하며 모션 시계는 이어집니다. Live2D 스타일의 자체 구현이며, Cubism의 네이티브 `.moc3` 모델은 아닙니다. 원본 아트는 그대로 유지합니다.

설정의 **일러스트 모션 켜짐/정지**가 전체 아트에 적용됩니다. 운영체제의 모션 감소 설정을 따르고, 화면 밖·열린 창 뒤·숨겨진 탭의 아트는 자동으로 멈춥니다. WebGL을 사용할 수 없으면 Canvas 2D로 같은 국소 변형을 그립니다.

25종 전용 카드 아트가 기술별 시네마틱으로 재생됩니다. 타격·공중기·던지기·서브미션·잡기·방어·운영·악몽은 서로 다른 움직임을 사용하며, 실제 전투 전후의 피해·방어·회복·드로우·열기·압박 결과를 표시합니다. 재생 중 카드와 턴 종료 입력을 잠가 연속 입력이 겹치지 않게 합니다. 기술 연출은 **전체/간결**로 조절합니다. HUD·선수 무대·설명 영역을 나누고, 데스크톱 시네마틱은 그림과 설명을 두 열에, 모바일은 그림 아래 제목과 결과에 배치합니다.

도감에서 이름과 효과를 검색하고 기술 분류·카드 타입·희귀도로 필터링할 수 있습니다. 상세 창은 전체 동작 그림, 기술 설명, 기본·강화 효과, 소멸 여부와 획득 방법을 함께 보여줍니다. 도움말은 턴 흐름, 카드 더미, 방어와 예고 행동, 콤보·열기, 압박·악몽, 상태 이상과 덱 성장 규칙을 설명합니다.

![SLAY card encyclopedia](artifacts/slay-library.jpg)

## 플레이

- 매 턴 기본 에너지 3, 드로우 5장. 공격·방어·드로우 카드의 순서를 설계합니다.
- 공격 콤보 2회마다 열기 1을 얻습니다. 열기 3을 소모하여 피니셔를 사용합니다.
- 상대의 공격·가드·도발이 미리 공개됩니다. 압박은 회복 카드와 명상으로 관리합니다.
- 승리 후 카드 보상을 고르고, 경기·정예·휴식·상점·이벤트 경로를 선택합니다.
- 레이븐의 타격, 발키리의 잡기, 노바의 드로우는 서로 다른 시작 덱과 패시브를 가집니다.

| 조작                | 동작                        |
| ------------------- | --------------------------- |
| 카드 클릭 / `1`-`9` | 해당 카드 플레이            |
| `0`                 | 10번째 카드 플레이          |
| `Space`             | 턴 종료                     |
| `Esc`               | 창 닫기 / 아레나로 돌아가기 |

브라우저 로컬 싱글 플레이 게임이며, 진행은 `localStorage`에 자동 저장됩니다. 새 런은 현재 진행을 교체합니다.

## 실행

Node.js 24 환경을 권장합니다.

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

`dev`는 개발 서버, `build`는 `dist/`에 배포 파일을 생성합니다. `npm test`는 전투·저장·카드 더미·세 선수의 완주, 도감과 강화 설명, 포즈·컨디션·시네마틱 결과를 검증합니다. 아트 테스트는 43장 리그의 수록, 배경 고정과 국소 변형, 깜박임·상태 전환의 연속성, 원본 비율 유지도 확인합니다. 렌더러 회귀 테스트는 25장 동시 지연 로딩, 화면과 탭의 복귀, 정지 상태의 첫 프레임, 해제 후 늦게 도착한 이미지까지 검증합니다. 화면 배치 검증 기준은 [아레나 체크리스트](artifacts/arena-layout-checklist.md)에 있습니다.

## 아트와 라이선스

아레나는 Blender에서 직접 구성하고 렌더했습니다. [렌더 스크립트](tools/render-arena.py)와 수정 가능한 [Blender 장면](artifacts/arena.blend)을 포함합니다. 캐릭터·카드 아트와 상태 포즈는 내장 이미지 생성 도구(imagegen)로 제작했습니다. 배포 이미지는 `public/assets/`에 배치합니다. 레이븐의 지침·그로기 포즈는 검정·크림슨 워밍업 재킷과 트랙 팬츠를 추가했고, 다른 포즈는 기존 레슬링 장비를 유지합니다. 정확한 프롬프트와 출처는 [레이븐](artifacts/pose-art-raven.md)·[발키리](artifacts/pose-art-valkyrie.md)·[노바](artifacts/pose-art-nova.md) 기록에 있습니다. Higgsfield도 시도했으나 검증된 생성 결과를 확보하지 못해 최종 에셋에 사용하지 않았습니다. [전체 제작 기록](artifacts/art-direction.md)을 포함합니다.

소스 코드는 [MIT](LICENSE)입니다. 생성·렌더 에셋의 제작 출처는 위와 같이 별도로 기록합니다. 이 코드 라이선스는 사용자 제공 참고 이미지의 재사용 권리를 부여하지 않으며, 원본 참고 파일은 저장소에 배포하지 않습니다.

글꼴도 로컬에 번들링합니다. Do Hyeon은 한국어 제목, Teko는 점수·수치·피니셔 제목, Barlow Condensed는 선수 이름과 영어 중계 표기, Noto Sans KR은 규칙·효과·상태 설명을 맡습니다. 각 SIL Open Font License를 포함합니다: [Do Hyeon](public/assets/licenses/DoHyeon-OFL.txt) · [Teko](public/assets/licenses/Teko-OFL.txt) · [Barlow Condensed](public/assets/licenses/BarlowCondensed-OFL.txt) · [Noto Sans KR](public/assets/licenses/NotoSansKR-OFL.txt).

## Technical appendix

The client uses React, Vite, Motion, and Phosphor icons. All gameplay rules live in the dependency-free ES module [`src/game.js`](src/game.js). The UI owns rendering, audio, keyboard input, and browser persistence. [`src/presentation.js`](src/presentation.js) selects fighter conditions and derives cinematic outcomes from engine snapshots; presentation does not alter combat or saved state. [`src/live-art-rigs.js`](src/live-art-rigs.js) holds per-image landmarks, [`src/live-art-renderer.js`](src/live-art-renderer.js) renders local mesh deformation and pose transitions, and [`src/motion-config.js`](src/motion-config.js) shares continuous motion math with the Canvas fallback and tests.

Every engine action returns a cloned, serializable state. Invalid actions return the original state. A saved PRNG seed makes draw order, encounter selection, and rewards reproducible after loading. Card instances use `{ uid, id, upgraded }`; permanent deck entries and combat piles share the same logical UID.

```js
import { newRun, playCard, endTurn, chooseReward } from "./src/game.js";

let run = newRun("raven", 12345);
run = playCard(run, run.hand[0].uid);
if (run.phase === "combat") run = endTurn(run);
if (run.phase === "reward") run = chooseReward(run, run.rewards[0]);
```

See [the engine API and design notes](docs/GAME_DESIGN.md#engine-api) for the complete phase flow and browser-local save format.
