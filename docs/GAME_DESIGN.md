# SLAY — Game Design

SLAY는 지하 여자 프로레슬링 리그에서 챔피언 벨트를 향해 올라가는 오리지널 덱빌딩 로그라이크입니다. 링 위의 기술을 카드로 표현하고, 상대의 공개된 행동을 읽는 전술과 선수의 심리적 압박을 한 번의 런에 연결합니다.

이 문서는 현재 실행 가능한 버티컬 슬라이스의 규칙을 설명합니다. 온라인 TCG 거래, 멀티플레이, 카드팩 결제, 장기 캠페인은 현재 구현 범위에 포함되지 않습니다.

## 세계와 시각 방향

배경은 가상의 **UNDERGROUND ARENA**입니다. 붉은 로프, 검은 캔버스, 차가운 스포트라이트와 거친 방송 그래픽으로 긴장감을 만듭니다. 다섯 주인공은 모두 성인인 오리지널 여성 선수이며, 실존 선수나 기존 게임 캐릭터의 신원을 사용하지 않습니다.

선수의 실루엣과 장비는 전투 역할을 드러냅니다. 레이븐은 긴 진홍색 머리의 스트라이커, 발키리는 금발 단발의 그래플러, 노바는 긴 검은 머리의 테크니션입니다. 바이퍼는 금발의 두 갈래 땋은 머리와 그린·레드 장비를 갖춘 제압 전문가, 엠버는 물결치는 갈색 머리와 블랙·레드·골드 장비를 갖춘 근육질 관중 챔피언입니다. 제공된 다섯 참고 이미지의 실루엣·자세·의상 배색을 반영하며, 캐릭터는 선명한 윤곽과 표정의 카툰 2D 방향으로 제작합니다. 원본 참고 파일은 배포하지 않습니다.

## 상태 일러스트와 기술 연출

다섯 선수에게 보통·흥분·열혈·좌절·지침·그로기의 완성 전신 그림을 각각 제공합니다. 활성 경로는 `public/assets/fighters/states/{actor}-{state}.webp`이며 총 30장입니다. 얼굴은 제공된 참고 이미지의 특징을 반영하고, 선수별 카툰 체형·장비·색상을 유지합니다. 상태 배지는 기준과 전신 그림·얼굴 확대를 보여주는 미리보기를 엽니다.

체력 25% 이하의 그로기가 가장 먼저 적용되고, 50% 이하의 지침이 뒤따릅니다. 체력이 50%를 넘으면 압박 60 이상을 좌절로 표시하고, 열기 6 이상은 열혈, 3–5는 흥분, 나머지는 보통입니다. 상대의 약화 2 이상도 좌절 조건에 포함됩니다. 회복·진정·열기 소모 후에는 현재 수치에 맞는 상태 그림으로 돌아갑니다.

선수와 카드 일러스트는 정적 완성 이미지입니다. 카드 50종의 기술 시네마틱은 실제 전투 결과를 읽어 피해·방어·회복·드로우·열기·압박을 표시합니다. 전체/간결 설정과 운영체제의 모션 감소 설정을 따르며, 재생 중에는 카드 사용·턴 종료 입력을 잠급니다. 정적 상태 변경은 게임 규칙이나 저장 데이터를 바꾸지 않습니다.

## 플레이 루프

1. 선수를 선택하고 11장의 시작 덱으로 첫 경기에 입장합니다. 메디컬 아이스팩 1개를 보관하며 첫 경기에는 철벽 코너가 활성화됩니다.
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

바이퍼는 엘보 스트라이크 3장, 로프 가드 2장, 클린치·호흡 조절·피니시 무브 각 1장, 헤드록 2장, 카운터 홀드 1장으로 시작합니다. 엠버는 엘보 스트라이크 3장, 로프 가드 2장, 클린치·호흡 조절·피니시 무브 각 1장, 스포트라이트·관중의 함성·네버 세이 다이 각 1장으로 시작합니다. 선수별 시작 덱 구성과 기존 카드 효과는 유지하며, 새 25종 기술은 경기 보상과 상점에서 덱에 추가합니다.

레이븐은 첫 공격에 강한 카드를 배치한 뒤 콤보 보상을 노립니다. 발키리는 상대 공격 의도에 잡기·카운터를 맞춰 방어를 확보합니다. 노바는 첫 0코스트 카드와 에너지·드로우를 연결하고 소멸 이후 얇아진 덱을 순환합니다. 바이퍼는 제압 카드를 먼저 써 후속타의 빈틈을 만들고, 엠버는 기술 카드로 피니셔의 열기를 준비하면서 낮은 체력의 컴백을 활용합니다.

바이퍼의 추가 피해는 **공격 직전에 이미 있는** 약화·취약을 확인합니다. 첫 헤드록의 피해는 7이며, 그 사용 후 약화 2와 패시브 취약 1을 부여합니다. 다음 엘보 스트라이크는 `(6 + 2) × 1.5`를 내림한 피해 12를 줍니다. 같은 턴의 두 번째 약화·취약 카드는 자체 상태 효과만 적용합니다. 멀티 히트는 각 타격에 피해 보너스를 적용하며 피해 미리보기와 실제 결과가 같습니다.

엠버는 카드 유형이 `skill`인 카드에만 발동합니다. 악몽과 피니셔는 대상이 아닙니다. 카드의 기본 효과를 먼저 처리한 뒤 열기·진정·조건부 회복을 적용하므로, 체력 40/80에서 네버 세이 다이는 방어 22를 확보한 후 체력 42가 됩니다. 열기는 최대 9, 압박은 최소 0을 지키며 한 턴에 여러 기술을 사용해도 패시브는 다시 발동하지 않습니다. 패시브 회복·진정은 새 카드 사용으로 취급하지 않습니다.

## 전투 규칙

- 기본 에너지는 3이며 턴 시작 때 회복합니다. 손에는 기본 5장을 뽑고 최대 10장까지 보유합니다. 첫 경기의 철벽 코너는 첫 손패만 4장으로 줄이는 대신 시작 방어 7과 매 턴 방어 2를 줍니다.
- 턴 종료 시 남은 손을 버립니다. 드로우 덱이 비면 버린 카드를 섞습니다. 소멸 카드는 해당 경기에 돌아오지 않습니다.
- 방어는 공격 피해를 먼저 흡수합니다. 일반 선수의 남은 방어는 다음 턴에 사라지며 발키리는 최대 3을 유지합니다.
- 공격 카드 사용 횟수는 턴별 콤보로 기록됩니다. 콤보 2회마다 열기 1을 얻으며 열기는 최대 9입니다. 다음 경기에는 최대 2까지 이어집니다.
- 피니셔는 열기 3이 있어야 사용할 수 있고 실제 사용 시 3을 소모합니다. 에너지 비용도 별도로 지불합니다.
- 상대의 의도는 공격, 가드, 도발 중 하나입니다. 약화는 상대 공격을 25% 낮추고 취약은 받는 카드 피해를 50% 높입니다. 상태 지속 시간은 상대 행동 후 감소합니다.
- 긴 전투에서는 상대 공격이 서서히 강해집니다. 방어만 반복하는 전략에는 한계가 있습니다.

압박은 공격을 받거나 도발을 당할 때 올라갑니다. 첫 35, 이후 60과 85의 임계치를 넘으면 악몽 카드가 영구 덱과 버린 카드 더미에 추가됩니다. 악몽은 뽑을 때 압박 3을 더하고, 에너지 1로 사용하면 압박 10을 낮추며 소멸합니다. 압박 100은 체력 8을 잃는 멘탈 붕괴를 일으킨 뒤 압박을 65로 낮춥니다. 충분히 진정하면 악몽 임계치가 다시 활성화됩니다.

승리하면 압박 5가 감소합니다. 회복 카드, 휴식의 명상, 상점의 멘탈 코칭은 압박을 낮추거나 악몽을 제거합니다. 플레이어는 현재 경기의 공격 효율과 다음 경기의 덱 상태를 함께 판단합니다.

## 연결된 8개 구간

전체 지도는 시작점, 2–7층의 네 경로, 최종 챔피언십을 연결한 26개 노드의 그래프입니다. 첫 경기 뒤에는 네 갈래 모두 열리며, 다음 층부터 현재 위치의 같은 레인과 인접 레인으로만 이동합니다. 마지막에는 모든 7층 노드가 보스로 합쳐집니다. 지나간 경로, 현재 노드, 실제 진입 가능한 다음 노드, 미래 연결선을 함께 표시합니다. 미래 노드를 직접 선택하거나 연결 없는 갈래로 이동할 수 없습니다.

| 구간 | 전체 층의 경로                                           |
| ---- | -------------------------------------------------------- |
| 1    | 데뷔 싱글 매치                                           |
| 2    | 싱글 매치 / 락커룸 / 백스테이지 / 하드코어 쇼다운        |
| 3    | 싱글 매치 / 정예 메인 이벤트 / 프로 숍 / 하드코어 쇼다운 |
| 4    | 싱글 매치 / 락커룸 / 백스테이지 / 하드코어 쇼다운        |
| 5    | 싱글 매치 / 정예 메인 이벤트 / 프로 숍 / 하드코어 쇼다운 |
| 6    | 싱글 매치 / 락커룸 / 백스테이지 / 하드코어 쇼다운        |
| 7    | 싱글 매치 / 정예 메인 이벤트 / 프로 숍 / 최종 준비       |
| 8    | EMPRESS 챔피언십                                         |

표는 층 전체의 프리뷰입니다. 현재 위치에서 연결된 노드만 다음 선택지에 나타나므로 모든 갈래를 매번 고를 수는 없습니다. 모든 노드는 시작점에서 도달 가능하며 모든 노드에서 보스로 가는 경로가 있습니다.

| 경기     | 상대 위험                                 | 크레딧 | 카드 선택            | 추가 보급                 |
| -------- | ----------------------------------------- | ------ | -------------------- | ------------------------- |
| 일반     | 일반 체력·공격                            | 35     | 커먼·언커먼·레어 3장 | 소모품 45%, 기믹 20% 확률 |
| 정예     | 강한 정예 상대                            | 65     | 언커먼·레어 3장      | 소모품 1개, 기믹 1개 확정 |
| 하드코어 | 같은 층 정예보다 체력 +20%(올림), 공격 +2 | 95     | 레어 4장             | 소모품 1개, 기믹 1개 확정 |
| 결승     | EMPRESS                                   | 120    | 런 승리로 종료       | —                         |

선택 보상에서는 카드와 별도로 보급을 받을 수 있습니다. 아이템과 기믹 제안은 유형마다 1개이며 독립적으로 수령합니다. 슬롯이 꽉 차면 해당 수령은 불가능하고, 카드 선택 또는 건너뛰기로 지도에 돌아가면 받지 않은 보급은 사라집니다.

락커룸에서는 최대 체력의 30% 회복과 압박 5 감소, 압박 25 감소와 악몽 1장 제거, 카드 1장 영구 강화 중 하나를 선택합니다. 상점에는 카드, 회복, 멘탈 코칭, 자동 강화와 소모품·코너 기믹이 있습니다. 새 상점은 영구 에너지 벨트를 판매하지 않습니다.

백스테이지 선택은 실제 효과와 체력·크레딧 대가를 먼저 보여 줍니다. 체력 비용보다 현재 체력이 높아야 선택할 수 있어 체력 1로 비용을 회피할 수 없습니다. 크레딧 부족이나 보관함 부족으로 보상을 받을 수 없는 선택도 실행되지 않습니다. 락커룸·이벤트 도착에는 설명 장면이 있고, 선택 뒤에는 실제 회복량·지출·획득 결과를 표시합니다.

## 일회용 소모품과 코너 기믹

소모품은 최대 3개를 보관합니다. 전투 중 에너지 없이 사용할 수 있고, 사용한 한 개는 즉시 사라집니다. 카드 사용·콤보·선수 패시브로 취급하지 않습니다. 남은 소모품은 다음 경기까지 유지하며 경기 보상, 프로 숍, 일부 이벤트에서 얻습니다.

| ID             | 소모품           | 정확한 효과                            | 상점 비용 |
| -------------- | ---------------- | -------------------------------------- | --------- |
| `icepack`      | 메디컬 아이스팩  | 체력 18 회복 · 압박 5 감소             | 35        |
| `energygel`    | 러시 에너지 젤   | 이번 턴 에너지 +2 · 압박 +4            | 40        |
| `resin`        | 그립 레진        | 방어 15                                | 30        |
| `smokespray`   | 쿨링 미스트      | 상대 약화 2 · 취약 1                   | 40        |
| `crowdwhistle` | 관중 호루라기    | 열기 +2 · 압박 4 감소                  | 35        |
| `trainingtape` | 전술 손목 테이프 | 2장 드로우 · 이번 턴 다음 공격 피해 +4 | 35        |

코너 기믹은 미사용 상태로 최대 6개를 보관합니다. 지도·보상·휴식·상점·이벤트에서 한 개를 다음 경기용으로 예약하거나 예약을 해제할 수 있습니다. 예약만으로는 소모되지 않고 경기 입장 때 활성화와 동시에 재고에서 빠집니다. 전투 중 교체할 수 없으며, 현재의 라운드 단위는 **한 경기 전체**입니다. 승리·패배와 함께 만료되고 미사용 재고는 유지합니다. 기믹 보너스는 영구 에너지나 선수 패시브에 누적되지 않습니다.

| ID                | 기믹              | 한 경기 동안의 이점                       | 대가                                | 상점 비용 |
| ----------------- | ----------------- | ----------------------------------------- | ----------------------------------- | --------- |
| `ironcorner`      | 철벽 코너         | 경기 시작 방어 7 · 매 턴 방어 +2          | 첫 손패 1장 감소                    | 45        |
| `spotlightcorner` | 스포트라이트 코너 | 경기 시작 열기 +2 · 매 턴 열기 +1         | 상대 공격력 +2                      | 55        |
| `grappleclinic`   | 그래플링 클리닉   | 잡기 공격 피해 +3                         | 경기 시작 압박 +8                   | 50        |
| `speedcorner`     | 오버드라이브 코너 | 매 턴 에너지 +1                           | 카드로 얻는 방어가 60%로 감소(내림) | 60        |
| `icecorner`       | 리커버리 코너     | 매 턴 체력 3 회복                         | 모든 공격 피해 −2                   | 50        |
| `mindcorner`      | 멘탈 코너         | 매 턴 압박 5 감소 · 악몽 드로우 압박 무효 | 상대 최대 체력 +20%(올림)           | 45        |

매 턴 효과는 첫 턴에도 적용합니다. 철벽 코너의 첫 방어는 7+2=9, 스포트라이트 코너의 첫 열기는 시작 +2와 턴 +1이 합쳐집니다. 오버드라이브의 카드 방어 감소는 기본 방어·카운터·컴백 보너스를 합친 뒤 내림하며, 소모품 방어에는 적용되지 않습니다. 리커버리의 공격 감소는 타격마다 적용하고 피해가 0 미만으로 내려가지 않습니다. 경기 도중 저장해도 추가 활성화·회복·에너지를 받지 않습니다.

기존 v1 저장의 컨디셔닝 벨트는 런 종료까지 최대 에너지 +1을 유지하는 **기존 영구 장비**로 표시합니다. 새 기믹으로 바꾸거나 효과를 숨기지 않습니다. 새 기믹 시스템 이전 저장에는 현재 전투의 카드·상대·에너지·난수 상태를 보존하며, 소모품 필드가 없을 때 아이스팩 한 개만 최초 정규화 시 지급합니다. 빈 소모품 필드가 저장된 뒤에는 재지급되지 않습니다.

## 카드 50종

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

새 카드 25종은 파워밤 변형 5종, 슬램·수플렉스·드롭 7종, 관절기·서브미션 10종, 잡기 연결 3종입니다. 물리적 기술 분류는 던지기·서브미션·잡기로 구분하고, 엔진의 공격·기술·피니셔 유형은 별도로 표시합니다. 예를 들어 샤프슈터는 서브미션이면서 피니셔입니다.

| ID                   | 카드                  | 비용 | 분류              | 기본 효과                                              |
| -------------------- | --------------------- | ---- | ----------------- | ------------------------------------------------------ |
| `sitoutpowerbomb`    | 싯아웃 파워밤         | 2    | 공격 · 던지기     | 피해 17, 방어 5                                        |
| `jackknifepowerbomb` | 잭나이프 파워밤       | 3    | 공격 · 던지기     | 피해 32, 압박 +4, 취약 2                               |
| `popuppowerbomb`     | 팝업 파워밤           | 2    | 공격 · 던지기     | 피해 14, 이번 턴 콤보 1 이상이면 피해 +9, 열기 +1      |
| `gutwrenchpowerbomb` | 거트렌치 파워밤       | 2    | 공격 · 던지기     | 피해 15, 방어 3, 약화 2                                |
| `foldingpowerbomb`   | 폴딩 파워밤           | 2    | 공격 · 던지기     | 피해 18, 이번 턴 콤보 2 이상이면 피해 +10, 방어 7      |
| `bodyslam`           | 바디 슬램             | 1    | 공격 · 던지기     | 피해 8, 방어 2                                         |
| `powerslam`          | 파워 슬램             | 2    | 공격 · 던지기     | 피해 16, 이번 턴 콤보 1 이상이면 피해 +6, 압박 3 감소  |
| `sidewalkslam`       | 사이드워크 슬램       | 1    | 공격 · 던지기     | 피해 6, 방어 6                                         |
| `spinebuster`        | 스파인버스터          | 2    | 공격 · 던지기     | 피해 14, 방어 7, 상대 공격 준비 시 방어 +6             |
| `bellysuplex`        | 벨리 투 벨리 수플렉스 | 2    | 공격 · 던지기     | 피해 15, 1장 드로우, 취약 1                            |
| `snapsuplex`         | 스냅 수플렉스         | 1    | 공격 · 던지기     | 피해 6, 압박 +2, 1장 드로우                            |
| `samoandrop`         | 사모안 드롭           | 2    | 공격 · 던지기     | 피해 16, 열기 +1, 약화 1                               |
| `armbar`             | 암바                  | 1    | 공격 · 서브미션   | 피해 5, 취약 2                                         |
| `kimura`             | 기무라 록             | 1    | 공격 · 서브미션   | 피해 6, 약화 1, 취약 1                                 |
| `americana`          | 아메리카나 록         | 1    | 공격 · 서브미션   | 피해 5, 방어 5, 약화 1                                 |
| `anklelock`          | 앵클 록               | 1    | 공격 · 서브미션   | 피해 6, 압박 3 감소, 약화 2                            |
| `kneebar`            | 니바                  | 2    | 공격 · 서브미션   | 피해 12, 방어 4, 취약 2                                |
| `heelhook`           | 힐 훅                 | 1    | 공격 · 서브미션   | 피해 3, 약화 3, 취약 2, 소멸                           |
| `figurefour`         | 피겨 포 레그록        | 2    | 공격 · 서브미션   | 피해 10, 방어 11, 체력 절반 이하 시 방어 +6            |
| `bostoncrab`         | 보스턴 크랩           | 1    | 공격 · 서브미션   | 피해 4, 열기 +1, 약화 1                                |
| `sharpshooter`       | 샤프슈터              | 2    | 피니셔 · 서브미션 | 열기 3 소모, 피해 25, 약화 3, 소멸                     |
| `crossface`          | 크로스페이스          | 1    | 공격 · 서브미션   | 피해 6, 방어 4, 상대 공격 준비 시 방어 +5, 압박 4 감소 |
| `collartie`          | 칼라 앤 엘보          | 0    | 기술 · 잡기       | 방어 3, 다음 공격 피해 +3, 소멸                        |
| `armdrag`            | 암 드래그             | 0    | 공격 · 잡기       | 피해 3, 콤보 +1, 방어 2, 소멸                          |
| `waistlock`          | 리어 웨이스트록       | 1    | 기술 · 잡기       | 방어 6, 다음 공격 피해 +6, 1장 드로우                  |

모든 신규 카드는 잡기 태그가 있어, 피해를 주는 카드에는 발키리의 피해 +2가 적용됩니다. 칼라 앤 엘보와 리어 웨이스트록은 피해 없는 기술 카드이므로 다음 공격을 준비하고 엠버의 관중 패시브를 발동합니다. 약화·취약은 지속 턴 수를 더하며, 수치가 높아져도 감소·증폭 비율 자체는 그대로입니다.

암 드래그는 에너지를 쓰지 않고 공격 콤보를 2 올려 열기 1을 얻습니다. 그 뒤 팝업 파워밤·파워 슬램은 선행 콤보 1, 폴딩 파워밤은 2부터 추가 피해를 받습니다. 칼라 앤 엘보와 리어 웨이스트록의 다음 공격 보너스는 같은 턴 안에서 누적할 수 있지만 공격 한 번에 모두 소모되며, 새 턴에는 초기화됩니다. 기술 카드 자체는 공격 콤보를 올리지 않습니다.

스파인버스터와 크로스페이스는 상대가 공격을 준비할 때만 추가 방어를 얻습니다. 피겨 포 레그록은 정확히 체력 절반 이하에서 컴백 방어가 늘고, 암바·기무라·니바 등은 공격 뒤 취약을 남겨 후속 공격을 지원합니다. 샤프슈터는 열기 3과 에너지 2를 소비해 큰 피해와 약화를 주고 소멸합니다. 일반적인 공격 콤보의 열기 생성은 피니셔에도 적용되므로, 두 번째 공격으로 사용했다면 소비 뒤 열기 1을 다시 얻습니다.

일반 보상과 상점의 획득 풀은 커먼·언커먼·레어 41종이며 신규 25종이 모두 포함됩니다. 정예 보상은 이 중 언커먼·레어만 제공합니다. 기존 시작 카드·시그니처와 악몽은 해당 보상 풀에 포함되지 않습니다. 카드마다 `cards/{id}.webp`의 전용 기술 이미지를 사용하며, 도감의 기본·강화 효과는 `getCard`에서 읽습니다.

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
| `mapForFloor(floor)`                               | Returns all node definitions for that floor as a preview                                 |
| `advanceToNode(state, nodeIndexOrId)`              | Enters a connected next node and increments the floor                                    |
| `rest(state, 'heal' / 'meditate' / 'upgrade')`     | Resolves one rest action; automatic upgrade prioritizes a finisher                       |
| `upgradeCard(state, uid)`                          | Upgrades a chosen permanent card in the rest phase, then opens the map                   |
| `buyItem(state, itemId)`                           | Pays for an available shop item; insufficient funds are a no-op                          |
| `leaveShop(state)`                                 | Closes the shop and opens the next map                                                   |
| `resolveEvent(state, choiceId)`                    | Applies a valid event choice, then opens the map                                         |
| `getCardDamage(state, instance)`                   | Previews damage including passives, combo bonuses, and vulnerability                     |
| `getDrawCount` / `getDeckCount` / `getRunProgress` | Small display helpers                                                                    |

Additional exports are `ITEMS`, `GIMMICKS`, `ITEM_CAPACITY`, `GIMMICK_CAPACITY`, `ROUTE_GRAPH`, `EVENTS`, `normalizeRun(saved)`, `getRouteView(state)`, `useItem(state, uid)`, `equipGimmick(state, uidOrNull)`, `claimLoot(state, kind, id)`, `getRestChoices(state)` and `canResolveEventChoice(state, choiceId)`. `kind` is `item` or `gimmick`. Item actions spend no energy. Illegal actions, unaffordable event costs, unavailable graph nodes and full-capacity acquisitions return the original state unchanged.

The state includes `player`, `enemy`, `hand`, `draw`, `discard`, `exhaust`, `deck`, `energy`, `maxEnergy`, `turn`, `floor`, `maxFloor`, `phase`, `combo`, `status`, `rewards`, `rewardCoins`, `mapNodes`, `event`, `shopItems`, `history`, `relics`, `stats`, `log`, and the PRNG `seed`. New mechanics add `mechanicsVersion: 2`, `route: { currentNodeId, visited }`, `inventory`, `gimmicks`, `equippedGimmickUid`, `activeGimmick`, `rewardLoot`, `arrival`, `lastChoice` and `lastImpact`. Item and gimmick instances are `{ uid, id }`; active gimmicks also carry their encounter node and duration. `getRouteView` supplies the full nodes and edges with `visited`, `available` and `current` flags. `lastChoice.result` contains actual outcome strings; `lastImpact` records actual HP damage and absorbed block for every card/item/intent, including zero-impact support actions. Card instances have stable UIDs. `log` is a string array; `logEvents` provides message types and turn numbers.

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

The connected-route suite checks all 26 nodes for reachability and boss continuation, rejects forged future choices, and verifies six consumables, six finite gimmicks, expiry, capacities, affordable physical costs, source offers, exact feedback and one-time v1 migration. Sixty seeded runs (five wrestlers × four seeds × preparation/balanced/risk policies) use only public actions. In this sample all policies completed; average earned credits were 155/365/630 and incoming HP damage was 10.2/15.65/50.3 respectively. The high-risk policy gained more rewards while taking over three times the balanced policy’s damage. These are results for those specified seeds and decisions.

The engine suite covers reproducible initialization and save/load, invalid actions, energy, block, combos and finishers, exhaustion and reshuffling, nightmare thresholds, defeat, rewards, map transitions, rest, upgrades, shops, events, and full eight-floor wins for all five wrestlers on two deterministic seeds. Strategy regressions cover debuff timing, multi-hit damage previews, conditional comeback recovery, caps, per-turn limits, old status compatibility, and nightmare-draw defeat without passive recursion or resurrection. The expansion suite resolves all 50 cards at both upgrade levels for each of the five wrestlers, compares damage previews with actual results, and verifies JSON restore and immutable actions. Across 768 deterministic seeds it checks that all 25 new moves appear in normal rewards and shops, can be acquired once per offer, and can be permanently upgraded at rest.

Presentation tests cover exact health boundaries, health/pressure/heat priority, recovery after real engine actions, the 30 distinct state paths and WebP files, and unchanged outcomes for all 50 card cues. A reachable-source check rejects app-owned canvas drawing or continuous illustration frame loops. Automated checks do not establish visual reference fidelity or browser layout; those are tracked in the [verification record](../artifacts/cartoon-fighter-qa.md) and [arena checklist](../artifacts/arena-layout-checklist.md).

```sh
npm install
npm run dev
npm test
npm run build
```

Source code is MIT licensed. Asset provenance is documented separately; source-image references are not redistributed or licensed by this repository.
