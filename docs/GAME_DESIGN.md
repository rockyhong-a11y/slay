# SLAY — Game Design

SLAY는 지하 여자 프로레슬링 리그에서 챔피언 벨트를 향해 올라가는 오리지널 덱빌딩 로그라이크입니다. 링 위의 기술을 카드로 표현하고, 상대의 공개된 행동을 읽는 전술과 선수의 심리적 압박을 한 번의 런에 연결합니다.

이 문서는 현재 실행 가능한 버티컬 슬라이스의 규칙을 설명합니다. 온라인 TCG 거래, 멀티플레이, 카드팩 결제, 장기 캠페인은 현재 구현 범위에 포함되지 않습니다.

## 세계와 시각 방향

배경은 가상의 **UNDERGROUND ARENA**입니다. 붉은 로프, 검은 캔버스, 차가운 스포트라이트와 거친 방송 그래픽으로 긴장감을 만듭니다. 세 주인공은 모두 성인인 오리지널 여성 선수이며, 실존 선수나 기존 게임 캐릭터의 신원을 사용하지 않습니다.

선수의 실루엣과 장비는 전투 역할을 드러냅니다. 레이븐은 붉은 머리와 타격 중심의 자세, 발키리는 금발과 견고한 그래플러 실루엣, 노바는 검은 머리와 민첩한 움직임을 가진 선수입니다. 제공된 이미지의 격투 자세, 스포츠웨어, 조명을 시각 연구에 참고합니다. 원본 참고 파일은 배포하지 않습니다.

## 플레이 루프

1. 선수를 선택하고 11장의 시작 덱으로 첫 경기에 입장합니다.
2. 매 턴 상대의 의도를 읽고 에너지를 사용하여 카드를 플레이합니다.
3. 공격을 연결해 열기를 얻고, 피니셔로 경기를 마무리합니다.
4. 승리하면 크레딧과 서로 다른 카드 3장의 선택 보상을 받습니다. 카드를 받지 않고 덱을 얇게 유지할 수도 있습니다.
5. 다음 경로에서 경기, 정예전, 휴식, 상점 또는 이벤트를 선택합니다.
6. 8번째 구간의 챔피언 EMPRESS를 꺾으면 런이 끝납니다. 체력이 0이면 패배합니다.

## 세 선수

| 선수              | 나이 / 체력 | 플레이 성향              | 패시브                                        | 시그니처      |
| ----------------- | ----------- | ------------------------ | --------------------------------------------- | ------------- |
| RAVEN · 레이븐    | 28 / 74     | 무자비한 스트라이커      | 매 턴 첫 공격 피해 +2                         | 레드라인      |
| VALKYRIE · 발키리 | 31 / 82     | 방어와 잡기의 그래플러   | 잡기 피해 +2, 다음 턴에 방어 최대 3 유지      | 아이언 클러치 |
| NOVA · 노바       | 26 / 68     | 드로우와 템포의 테크니션 | 매 턴 첫 0코스트 카드 사용 시 1장 추가 드로우 | 플래시 스텝   |

시작 덱은 엘보 스트라이크 4장, 로프 가드 3장, 클린치·호흡 조절·피니시 무브 각 1장과 선수별 시그니처 1장입니다.

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

```text
combat → reward → map → combat / rest / event / shop
rest / event / shop → map
final boss combat → victory
any combat with player HP 0 → defeat
```

The client stores a run under `slay.run.v1` in `localStorage`; it adds `saveVersion: 1` to its saved payload. New-run UI requests may supply a random seed, while explicit seeds support reproducible tests and replays. Local storage is browser-specific and has no server synchronization.

## 아트 제작과 검증

Blender source is retained in [`artifacts/arena.blend`](../artifacts/arena.blend), with a procedural scene/render script in [`tools/render-arena.py`](../tools/render-arena.py). The script saves the editable scene before its Cycles render. Browser assets are stored in `public/assets/`; the arena is delivered as WebP. Final character and card artwork is produced with the built-in imagegen tool, using original adult fighter identities and role-specific art direction.

Higgsfield was attempted as requested, but did not produce a verified asset. The reference-media upload confirmation remained unanswered for more than 1,350 seconds. A separate text-only generation attempt was stopped after 400.9 seconds without returned generation IDs or a confirmed outcome. It was not resubmitted. Higgsfield is therefore recorded as an attempted workflow, rather than the source of the shipped images. Original reference files are not distributed.

The engine test suite covers reproducible initialization and save/load behavior, invalid actions, energy, block, combos and finishers, exhaustion and reshuffling, nightmare thresholds, defeat, rewards, map transitions, rest, upgrades, shops, events, and full eight-floor wins for all three wrestlers.

```sh
npm install
npm run dev
npm test
npm run build
```

Source code is MIT licensed. Asset provenance is documented separately; source-image references are not redistributed or licensed by this repository.
