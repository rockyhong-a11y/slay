# SLAY — Game Design

SLAY는 지하 여자 프로레슬링 리그에서 챔피언 벨트를 향해 올라가는 오리지널 덱빌딩 로그라이크입니다. 링 위의 기술을 카드로 표현하고, 상대의 공개된 행동을 읽는 전술과 선수의 심리적 압박을 한 번의 런에 연결합니다.

이 문서는 현재 실행 가능한 버티컬 슬라이스의 규칙을 설명합니다. 온라인 TCG 거래, 멀티플레이, 카드팩 결제, 장기 캠페인은 현재 구현 범위에 포함되지 않습니다.

## 세계와 시각 방향

배경은 가상의 **UNDERGROUND ARENA**입니다. 붉은 로프, 검은 캔버스, 차가운 스포트라이트와 거친 방송 그래픽으로 긴장감을 만듭니다. 다섯 주인공은 모두 성인인 오리지널 여성 선수이며, 실존 선수나 기존 게임 캐릭터의 신원을 사용하지 않습니다.

선수의 실루엣과 장비는 전투 역할을 드러냅니다. 레이븐은 긴 진홍색 머리의 스트라이커, 발키리는 금발 단발의 그래플러, 노바는 긴 검은 머리의 테크니션입니다. 바이퍼는 금발의 두 갈래 땋은 머리와 그린·레드 장비를 갖춘 제압 전문가, 엠버는 물결치는 갈색 머리와 블랙·레드·골드 장비를 갖춘 근육질 관중 챔피언입니다. 제공된 다섯 참고 이미지의 실루엣·자세·의상 배색을 반영하며, 캐릭터는 선명한 윤곽과 표정의 카툰 2D 방향으로 제작합니다. 원본 참고 파일은 배포하지 않습니다.

## 상태 일러스트와 기술 연출

다섯 선수에게 보통·흥분·열혈·좌절·지침·그로기의 완성 전신 그림을 각각 제공합니다. 활성 경로는 `public/assets/fighters/states/{actor}-{state}.webp`이며 총 30장입니다. 얼굴은 제공된 참고 이미지의 특징을 반영하고, 선수별 카툰 체형·장비·색상을 유지합니다. 상태 배지는 기준과 전신 그림·얼굴 확대를 보여주는 미리보기를 엽니다.

체력 25% 이하의 그로기가 가장 먼저 적용되고, 50% 이하의 지침이 뒤따릅니다. 체력이 50%를 넘으면 압박 60 이상을 좌절로 표시하고, 열기 6 이상은 열혈, 3–5는 흥분, 나머지는 보통입니다. 상대의 약화 2 이상도 좌절 조건에 포함됩니다. 회복·진정·열기 소모 후에는 현재 수치에 맞는 상태 그림으로 돌아갑니다.

선수와 카드 일러스트는 정적 완성 이미지입니다. 카드 25종의 짧은 기술 시네마틱은 실제 전투 결과를 읽어 피해·방어·회복·드로우·열기·압박을 표시합니다. 전체/간결 설정과 운영체제의 모션 감소 설정을 따르며, 재생 중에는 카드 사용·턴 종료 입력을 잠급니다. 정적 상태 변경은 게임 규칙이나 저장 데이터를 바꾸지 않습니다.

## 플레이 루프

1. 선수를 선택하고 11장의 시작 덱으로 첫 경기에 입장합니다.
2. 매 턴 상대의 의도를 읽고 에너지를 사용하여 카드를 플레이합니다.
3. 공격을 연결해 열기를 얻고, 피니셔로 경기를 마무리합니다.
4. 승리하면 크레딧과 서로 다른 카드 3장의 선택 보상을 받습니다. 카드를 받지 않고 덱을 얇게 유지할 수도 있습니다.
5. 다음 경로에서 경기, 정예전, 휴식, 상점 또는 이벤트를 선택합니다.
6. 8번째 구간의 챔피언 EMPRESS를 꺾으면 런이 끝납니다. 체력이 0이면 패배합니다.

## 다섯 선수와 서로 다른 운영

| 선수              | 나이 / 체력 | 성향 / 난이도      | 실제 패시브                                                                  | 시작 핵심 기술                          |
| ----------------- | ----------- | ------------------ | ---------------------------------------------------------------------------- | --------------------------------------- |
| RAVEN · 레이븐    | 28 / 74     | 콤보 타격 / 입문   | 매 턴 첫 공격 피해 +2                                                        | 레드라인                                |
| VALKYRIE · 발키리 | 31 / 82     | 가드·잡기 / 입문   | 잡기 피해 +2, 다음 턴에 방어 최대 3 유지                                     | 아이언 클러치                           |
| NOVA · 노바       | 26 / 68     | 드로우·순환 / 숙련 | 매 턴 첫 0코스트 카드에 1장 추가 드로우                                      | 플래시 스텝                             |
| VIPER · 바이퍼    | 27 / 72     | 상태 제압 / 전술   | 약화·취약 상대에게 공격 피해 +2. 매 턴 첫 약화·취약 카드 사용 후 취약 1 추가 | 헤드록·카운터 홀드                      |
| EMBER · 엠버      | 32 / 80     | 관중·컴백 / 전술   | 매 턴 첫 기술 카드로 열기 +1, 압박 −3. 현재 체력이 절반 이하면 체력 +2       | 스포트라이트·관중의 함성·네버 세이 다이 |

모든 시작 덱은 11장입니다. 레이븐·발키리·노바의 기존 덱은 엘보 스트라이크 4장, 로프 가드 3장, 클린치·호흡 조절·피니시 무브 각 1장과 전용 시그니처 1장을 유지합니다.

바이퍼는 엘보 스트라이크 3장, 로프 가드 2장, 클린치·호흡 조절·피니시 무브 각 1장, 헤드록 2장, 카운터 홀드 1장으로 시작합니다. 엠버는 엘보 스트라이크 3장, 로프 가드 2장, 클린치·호흡 조절·피니시 무브 각 1장, 스포트라이트·관중의 함성·네버 세이 다이 각 1장으로 시작합니다. 신규 선수는 기존 25종 카드에서 다른 조합을 사용하며 카드 수나 기본 효과를 변경하지 않습니다.

레이븐은 첫 공격에 강한 카드를 배치한 뒤 콤보 보상을 노립니다. 발키리는 상대 공격 의도에 잡기·카운터를 맞춰 방어를 확보합니다. 노바는 첫 0코스트 카드와 에너지·드로우를 연결하고 소멸 이후 얇아진 덱을 순환합니다. 바이퍼는 제압 카드를 먼저 써 후속타의 빈틈을 만들고, 엠버는 기술 카드로 피니셔의 열기를 준비하면서 낮은 체력의 컴백을 활용합니다.

바이퍼의 추가 피해는 **공격 직전에 이미 있는** 약화·취약을 확인합니다. 첫 헤드록의 피해는 7이며, 그 사용 후 약화 2와 패시브 취약 1을 부여합니다. 다음 엘보 스트라이크는 `(6 + 2) × 1.5`를 내림한 피해 12를 줍니다. 같은 턴의 두 번째 약화·취약 카드는 자체 상태 효과만 적용합니다. 멀티 히트는 각 타격에 피해 보너스를 적용하며 피해 미리보기와 실제 결과가 같습니다.

엠버는 카드 유형이 `skill`인 카드에만 발동합니다. 악몽과 피니셔는 대상이 아닙니다. 카드의 기본 효과를 먼저 처리한 뒤 열기·진정·조건부 회복을 적용하므로, 체력 40/80에서 네버 세이 다이는 방어 22를 확보한 후 체력 42가 됩니다. 열기는 최대 9, 압박은 최소 0을 지키며 한 턴에 여러 기술을 사용해도 패시브는 다시 발동하지 않습니다. 패시브 회복·진정은 새 카드 사용으로 취급하지 않습니다.

## 전투 규칙

- 기본 에너지는 3이며 턴 시작 때 회복합니다. 손에는 5장을 뽑고 최대 10장까지 보유합니다.
- 턴 종료 시 남은 손을 버립니다. 드로우 덱이 비면 버린 카드를 섞습니다. 소멸 카드는 해당 경기에 돌아오지 않습니다.
- 방어는 공격 피해를 먼저 흡수합니다. 일반 선수의 남은 방어는 다음 턴에 사라지며 발키리는 최대 3을 유지합니다.
- 공격 카드 사용 횟수는 턴별 콤보로 기록됩니다. 콤보 2회마다 열기 1을 얻으며 열기는 최대 9입니다. 다음 경기에는 최대 2까지 이어집니다.
- 피니셔는 열기 3이 있어야 사용할 수 있고 실제 사용 시 3을 소모합니다. 에너지 비용도 별도로 지불합니다.
- 상대의 의도는 공격, 가드, 도발 중 하나입니다. 약화는 상대 공격을 25% 낮추고 취약은 받는 카드 피해를 50% 높입니다. 상태 지속 시간은 상대 행동 후 감소합니다.
- 긴 전투에서는 상대 공격이 서서히 강해집니다. 방어만 반복하는 전략에는 한계가 있습니다.

압박은 공격을 받거나 도발을 당할 때 올라갑니다. 첫 35, 이후 60과 85의 임계치를 넘으면 악몽 카드가 영구 덱과 버린 카드 더미에 추가됩니다. 악몽은 뽑을 때 압박 3을 더하고, 에너지 1로 사용하면 압박 10을 낮추며 소멸합니다. 압박 100은 체력 8을 잃는 멘탈 붕괴를 일으킨 뒤 압박을 65로 낮춥니다. 충분히 진정하면 악몽 임계치가 다시 활성화됩니다.

승리하면 압박 5가 감소합니다. 회복 카드, 휴식의 명상, 상점의 멘탈 코칭은 압박을 낮추거나 악몽을 제거합니다. 플레이어는 현재 경기의 공격 효율과 다음 경기의 덱 상태를 함께 판단합니다.

## 8개 구간

구간은 다음 층에서 하나의 경로를 선택하는 방식입니다. 선택하지 않은 경로는 지나갑니다.

| 구간 | 선택 가능한 경로                                   |
| ---- | -------------------------------------------------- |
| 1    | 데뷔 싱글 매치로 시작                              |
| 2    | 싱글 매치 / 락커룸 / 백스테이지 이벤트             |
| 3    | 싱글 매치 / 정예 메인 이벤트 / 프로 숍             |
| 4    | 싱글 매치 / 락커룸 / 백스테이지 이벤트             |
| 5    | 싱글 매치 / 정예 메인 이벤트 / 프로 숍             |
| 6    | 싱글 매치 / 락커룸 / 백스테이지 이벤트             |
| 7    | 싱글 매치 / 정예 메인 이벤트 / 프로 숍 / 최종 준비 |
| 8    | EMPRESS 챔피언십                                   |

일반 경기 보상은 35 크레딧, 정예전은 65 크레딧입니다. 정예전은 더 높은 체력과 공격력 대신 언커먼·레어 카드 보상을 제공합니다. 결승 승리 보상은 120 크레딧입니다.

락커룸에서는 최대 체력의 30% 회복, 압박 25 감소와 악몽 1장 제거, 카드 1장 영구 강화 중 하나를 선택합니다. 상점에는 카드, 회복, 멘탈 코칭, 자동 강화와 최대 에너지 +1의 컨디셔닝 벨트가 있습니다. 이벤트는 크레딧·기술 획득·체력·압박 사이의 선택을 제공합니다.

## 카드 25종

표는 강화 전의 효과입니다. 강화는 피해, 방어, 드로우 또는 회복량을 개선하며 카드의 UI 설명도 함께 바뀝니다.

| ID             | 카드              | 비용 | 분류            | 기본 효과                                 |
| -------------- | ----------------- | ---- | --------------- | ----------------------------------------- |
| `strike`       | 엘보 스트라이크   | 1    | 공격            | 피해 6                                    |
| `guard`        | 로프 가드         | 1    | 기술            | 방어 7                                    |
| `grapple`      | 클린치            | 1    | 공격 · 잡기     | 피해 4, 방어 4                            |
| `focus`        | 호흡 조절         | 0    | 기술            | 압박 −6, 드로우 1, 소멸                   |
| `finisher`     | 피니시 무브       | 2    | 피니셔          | 열기 3 소모, 피해 26                      |
| `redline`      | 레드라인          | 1    | 시그니처 · 공격 | 피해 9, 압박 +3, 드로우 1                 |
| `ironclad`     | 아이언 클러치     | 1    | 시그니처 · 잡기 | 피해 5, 방어 8                            |
| `flashstep`    | 플래시 스텝       | 0    | 시그니처 · 공격 | 피해 4, 드로우 1, 소멸                    |
| `dropkick`     | 드롭킥            | 1    | 공격            | 피해 8, 선행 공격이 있으면 +4             |
| `suplex`       | 저먼 수플렉스     | 2    | 공격 · 잡기     | 피해 16, 취약 2                           |
| `reversal`     | 카운터 홀드       | 1    | 공격 · 잡기     | 피해 5, 방어 6, 상대 공격 준비 시 방어 +5 |
| `spotlight`    | 스포트라이트      | 1    | 기술            | 열기 +2, 드로우 1                         |
| `rally`        | 관중의 함성       | 0    | 기술            | 열기 +1, 압박 −4, 소멸                    |
| `shoulder`     | 숄더 태클         | 1    | 공격            | 피해 7, 방어 3                            |
| `ringcraft`    | 링 위의 계산      | 1    | 기술            | 방어 9, 이번 턴 다음 공격 피해 +4         |
| `headlock`     | 헤드록            | 1    | 공격 · 잡기     | 피해 7, 약화 2                            |
| `quickdraw`    | 템포 스틸         | 0    | 기술            | 에너지 +1, 드로우 1, 소멸                 |
| `moonsault`    | 문설트            | 2    | 공격            | 피해 18, 열기 +1                          |
| `steelwill`    | 강철 의지         | 1    | 기술            | 방어 8, 압박 −12                          |
| `doubletap`    | 원 투 콤보        | 1    | 공격            | 피해 5 × 2, 콤보 1회 추가                 |
| `powerbomb`    | 파워밤            | 2    | 공격 · 잡기     | 피해 21, 선행 콤보 2 이상이면 +7          |
| `encore`       | 앙코르            | 1    | 기술            | 드로우 3                                  |
| `championship` | 챔피언십 드라이브 | 2    | 피니셔          | 열기 3 소모, 피해 32, 체력 +6, 소멸       |
| `comeback`     | 네버 세이 다이    | 1    | 기술            | 방어 12, 체력 절반 이하 시 방어 +10       |
| `nightmare`    | 악몽 · 시선       | 1    | 악몽            | 드로우 시 압박 +3, 사용 시 압박 −10, 소멸 |

## Engine API

The rules module is [`src/game.js`](../src/game.js). It has no browser or third-party dependencies. All actions accept the current state and return a cloned next state; illegal actions return the exact original object. States contain only JSON-compatible values.

| Export                                             | Contract                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `CARDS` / `WRESTLERS` / `ENEMIES`                  | Definitions keyed by ID                                                                  |
| `newRun(wrestlerId, seed?)`                        | Creates an 11-card run in immediate combat; default seed is `20903`                      |
| `getCard(instanceOrId)`                            | Expands a card ID or `{ uid, id, upgraded }`, including upgraded effects and description |
| `canPlayCard(state, uidOrInstance)`                | Checks combat phase, hand membership, energy, and required hype                          |
| `playCard(state, uid)`                             | Resolves a hand card, pile movement, combo, pressure, and any victory                    |
| `endTurn(state)`                                   | Discards the remaining hand, resolves intent, and starts the next turn                   |
| `chooseReward(state, cardIdOrNull)`                | Adds an offered card or skips it, then opens the map                                     |
| `mapForFloor(floor)`                               | Returns the available node definitions for that floor                                    |
| `advanceToNode(state, nodeIndex)`                  | Enters one available node and increments the floor                                       |
| `rest(state, 'heal' / 'meditate' / 'upgrade')`     | Resolves one rest action; automatic upgrade prioritizes a finisher                       |
| `upgradeCard(state, uid)`                          | Upgrades a chosen permanent card in the rest phase, then opens the map                   |
| `buyItem(state, itemId)`                           | Pays for an available shop item; insufficient funds are a no-op                          |
| `leaveShop(state)`                                 | Closes the shop and opens the next map                                                   |
| `resolveEvent(state, choiceId)`                    | Applies a valid event choice, then opens the map                                         |
| `getCardDamage(state, instance)`                   | Previews damage including passives, combo bonuses, and vulnerability                     |
| `getDrawCount` / `getDeckCount` / `getRunProgress` | Small display helpers                                                                    |

The state includes `player`, `enemy`, `hand`, `draw`, `discard`, `exhaust`, `deck`, `energy`, `maxEnergy`, `turn`, `floor`, `maxFloor`, `phase`, `combo`, `status`, `rewards`, `rewardCoins`, `mapNodes`, `event`, `shopItems`, `history`, `relics`, `stats`, `log`, and the PRNG `seed`. Card instances have stable UIDs. `log` is a string array; `logEvents` provides message types and turn numbers.

`WRESTLERS` now contains five IDs: `raven`, `valkyrie`, `nova`, `viper`, `ember`. Each definition includes `role`, `roleEn`, `strategy`, `complexity` (1–3), `complexityLabel`, `easyLabel`, `strengths`, `playstyle`, `recommendedCards`, and the exact `startingDeck` card IDs. `newRun` constructs instances from that deck. Encyclopedia `startingWrestlers` and acquisition text derive from these definitions.

Turn-scoped `status.precisionUsed` and `status.crowdUsed` preserve the new once-per-turn limits through JSON save/load. Both reset when a new turn or encounter starts. Missing flags in an older version-1 status are interpreted as unused, while existing flags are never rearmed merely by restoring a save. Existing Raven/Valkyrie/Nova saved decks remain unchanged, and the save version remains 1. Invalid actions return the original state and cannot consume or trigger a passive.

```text
combat → reward → map → combat / rest / event / shop
rest / event / shop → map
final boss combat → victory
any combat with player HP 0 → defeat
```

The client stores a run under `slay.run.v1` in `localStorage`; it adds `saveVersion: 1` to its saved payload. New-run UI requests may supply a random seed, while explicit seeds support reproducible tests and replays. Local storage is browser-specific and has no server synchronization.

## 아트 제작과 검증

The editable Blender scene is retained in [`artifacts/arena.blend`](../artifacts/arena.blend), with its scene/render script in [`tools/render-arena.py`](../tools/render-arena.py). The browser arena is `public/assets/arena.webp`. Tooling and prompt provenance for character and card images are recorded separately in [`artifacts/art-direction.md`](../artifacts/art-direction.md); original user reference files are not distributed.

The final character path uses 30 complete state illustrations at 1000×1500 RGBA WebP. Individual built-in image-generation edits use the previous complete cartoon body and original facial reference for normal, then the corrected normal and same facial reference for each variant. Exact selected prompts and source paths are in [four normal edits](../artifacts/fighter-state-prompts.json), [twenty variants](../artifacts/fighter-state-variant-prompts.json) and [six Viper states](../artifacts/viper-state-prompts.json). Source PNGs are preserved locally in ignored `artifacts/fighter-state-sources/`.

A [Blender QA gallery](../artifacts/fighter-state-gallery.blend) displays the 30 complete illustrations on individual full-image planes. Its [render](../artifacts/fighter-state-gallery.jpg), [verification data](../artifacts/fighter-state-gallery-facts.json) and [script](../tools/build-state-gallery.py) record whole-texture preservation and a static scene with no armatures or animation. This gallery reviews the finished 2D images.

`fighterPoseArt(actor, condition)` accepts a state ID or a state object and returns `fighters/states/{actor}-{state}.webp`; an unknown actor falls back to Nova and an unknown state falls back to normal. Card images continue to use their individual technique paths. Continuous puppet/mesh rendering and its dedicated tests are removed.

The engine suite covers reproducible initialization and save/load, invalid actions, energy, block, combos and finishers, exhaustion and reshuffling, nightmare thresholds, defeat, rewards, map transitions, rest, upgrades, shops, events, and full eight-floor wins for all five wrestlers on two deterministic seeds. Strategy regressions cover debuff timing, multi-hit damage previews, conditional comeback recovery, caps, per-turn limits, old status compatibility, and nightmare-draw defeat without passive recursion or resurrection.

Presentation tests cover exact health boundaries, health/pressure/heat priority, recovery after real engine actions, the 30 distinct state paths and WebP files, and unchanged outcomes for all 25 card cues. A reachable-source check rejects app-owned canvas drawing or continuous illustration frame loops. The final automated run passed all 45 tests and the production build succeeded. Automated checks do not establish visual reference fidelity or browser layout; those are tracked in the [verification record](../artifacts/cartoon-fighter-qa.md) and [arena checklist](../artifacts/arena-layout-checklist.md).

```sh
npm install
npm run dev
npm test
npm run build
```

Source code is MIT licensed. Asset provenance is documented separately; source-image references are not redistributed or licensed by this repository.
