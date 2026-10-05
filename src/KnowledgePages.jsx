import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Crown,
  Fire,
  Heart,
  Lightning,
  MagnifyingGlass,
  Shield,
  Stack,
  Sword,
  X,
  BookOpen,
  Compass,
  Keyboard,
  Shuffle,
  Sparkle,
} from "@phosphor-icons/react";
import { CARDS, getCard, WRESTLERS, ITEMS, GIMMICKS } from "./game.js";
import {
  CARD_DETAILS,
  CARD_DISCIPLINES,
  CARD_TYPE_LABELS,
  CARD_RARITY_LABELS,
  getLibraryCards,
} from "./card-library.js";
import "./knowledge.css";
import { Artwork } from "./Artwork.jsx";

function KnowledgeHeader({
  eyebrow,
  title,
  description,
  onBack,
  onRelated,
  relatedLabel,
  children,
}) {
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <header className="knowledge-header">
      <div className="knowledge-nav">
        <button type="button" className="knowledge-back" onClick={onBack}>
          <ArrowLeft size={17} />
          아레나로 돌아가기
        </button>
        <button type="button" className="knowledge-link" onClick={onRelated}>
          {relatedLabel}
          <ArrowRight size={17} />
        </button>
      </div>
      <span className="knowledge-eyebrow">{eyebrow}</span>
      <h1 id="knowledge-title" ref={heading} tabIndex={-1}>
        {title}
        <span>.</span>
      </h1>
      <p>{description}</p>
      {children}
    </header>
  );
}

function RuleSection({ id, number, title, icon: Icon, children }) {
  return (
    <section id={id} className="guide-section" aria-labelledby={`${id}-title`}>
      <div className="guide-section-mark">
        <span>{number}</span>
        <Icon size={24} />
      </div>
      <div className="guide-section-content">
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function CardGuidePage({ onOpenLibrary, onBack }) {
  return (
    <section
      className="knowledge-page guide-page"
      aria-labelledby="knowledge-title"
    >
      <KnowledgeHeader
        eyebrow="THE RINGSIDE HANDBOOK"
        title="카드 시스템 가이드"
        description="한 장의 기술보다 중요한 건 다음 한 수. 패를 읽고, 링의 흐름을 설계하세요."
        onBack={onBack}
        onRelated={onOpenLibrary}
        relatedLabel="전체 카드 도감"
      >
        <div className="guide-hero-line">
          <div>
            <strong>
              3<span>기본 에너지</span>
            </strong>
            <Lightning size={23} />
          </div>
          <div>
            <strong>
              5<span>턴 시작 드로우</span>
            </strong>
            <Stack size={23} />
          </div>
          <div>
            <strong>
              3<span>피니셔 필요 열기</span>
            </strong>
            <Fire size={23} />
          </div>
        </div>
      </KnowledgeHeader>
      <div className="guide-layout">
        <nav className="guide-toc" aria-label="가이드 목차">
          <span className="knowledge-eyebrow">IN THIS GUIDE</span>
          {[
            ["turn-flow", "01", "턴과 에너지"],
            ["card-piles", "02", "카드 더미"],
            ["defense", "03", "방어와 상대 의도"],
            ["finishers", "04", "콤보와 피니셔"],
            ["pressure", "05", "압박과 악몽"],
            ["statuses", "06", "약화와 취약"],
            ["journey", "07", "덱 성장과 경로"],
            ["corner-kit", "08", "아이템과 코너 기믹"],
            ["controls", "09", "조작과 저장"],
          ].map(([id, n, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                  block: "start",
                });
              }}
            >
              <span>{n}</span>
              {label}
              <ArrowRight size={13} />
            </a>
          ))}
          <button type="button" onClick={onOpenLibrary}>
            <BookOpen size={20} />
            <strong>{Object.keys(CARDS).length}장의 기술 살펴보기</strong>
            <span>기본 효과와 강화 효과를 비교하세요.</span>
          </button>
        </nav>
        <div className="guide-body">
          <RuleSection
            id="turn-flow"
            number="01"
            title="상대의 다음 행동부터 읽으세요"
            icon={Lightning}
          >
            <p>
              각 턴은 기본 에너지 <strong>3</strong>과 카드 <strong>5장</strong>
              으로 시작합니다. 에너지가 충분하면 공격, 기술, 피니셔 카드를
              원하는 순서로 사용하세요. 0코스트 카드도 있습니다. 손은 최대
              10장까지 보유할 수 있습니다.
            </p>
            <ol className="guide-turn-flow">
              <li>
                <span>01</span>
                <strong>의도 확인</strong>
                <p>상대가 공격·가드·도발 중 무엇을 준비하는지 확인합니다.</p>
              </li>
              <li>
                <span>02</span>
                <strong>카드 플레이</strong>
                <p>
                  에너지를 지불하고 효과를 즉시 해결합니다. 순서가 콤보와 추가
                  효과를 바꿉니다.
                </p>
              </li>
              <li>
                <span>03</span>
                <strong>턴 종료</strong>
                <p>
                  남은 패를 버리고 상대의 의도를 해결합니다. 다음 턴에 에너지와
                  패를 새로 받습니다.
                </p>
              </li>
            </ol>
            <p className="guide-note">
              에너지는 턴마다 최대치로 회복하며 남은 에너지를 이월하지 않습니다.
              일부 코너 기믹은 한 경기 동안 에너지나 드로우를 바꿉니다. 선택하기
              전에 효과와 대가를 함께 확인하세요.
            </p>
          </RuleSection>
          <RuleSection
            id="card-piles"
            number="02"
            title="버린 카드와 소멸 카드는 다릅니다"
            icon={Shuffle}
          >
            <dl className="guide-definitions">
              <div>
                <dt>드로우 덱</dt>
                <dd>앞으로 뽑을 카드입니다. 순서는 공개되지 않습니다.</dd>
              </div>
              <div>
                <dt>손</dt>
                <dd>
                  지금 사용할 수 있는 카드입니다. 턴 종료 시 남은 손을 모두
                  버립니다.
                </dd>
              </div>
              <div>
                <dt>버린 카드</dt>
                <dd>
                  일반 카드는 사용하면 이곳으로 이동합니다. 드로우 덱이 비면
                  버린 카드를 섞어 새 덱을 만듭니다.
                </dd>
              </div>
              <div>
                <dt>소멸</dt>
                <dd>
                  사용한 소멸 카드는 해당 경기의 섞기에 돌아오지 않습니다. 영구
                  덱에서 삭제되는 것은 아니므로 다음 경기에는 다시 등장합니다.
                </dd>
              </div>
            </dl>
            <p>
              추가 드로우도 드로우 덱이 비면 섞기를 거칩니다. 모든 카드가 손이나
              소멸 더미에 있으면 더 뽑지 못할 수 있습니다. 손이 10장이면 추가
              드로우는 멈춥니다.
            </p>
          </RuleSection>
          <RuleSection
            id="defense"
            number="03"
            title="가드는 이번 교환을 위한 투자입니다"
            icon={Shield}
          >
            <p>
              방어는 상대의 공격 피해를 먼저 흡수합니다. 공격 7을 방어 7로
              막으면 체력 피해는 0입니다. 일반 선수의 남은 방어는 다음 턴에
              사라집니다. <strong>발키리만 남은 방어를 최대 3까지 유지</strong>
              합니다.
            </p>
            <div className="guide-intents">
              <div>
                <Sword size={22} />
                <strong>공격</strong>
                <p>
                  표시된 수치로 공격합니다. 약화가 있으면 실제 피해는
                  줄어듭니다.
                </p>
              </div>
              <div>
                <Shield size={22} />
                <strong>가드</strong>
                <p>
                  표시된 수치의 방어를 쌓습니다. 상대 방어를 먼저 깎아야 체력을
                  줄일 수 있습니다.
                </p>
              </div>
              <div>
                <Brain size={22} />
                <strong>도발</strong>
                <p>
                  표시된 수치만큼 압박을 높이며 방어도 3 얻습니다. 플레이어의
                  가드로 도발을 막을 수는 없습니다.
                </p>
              </div>
            </div>
            <p className="guide-note">
              피해를 완전히 막아도 상대 공격 자체가 압박 2를 만듭니다. 체력
              피해가 나면 그 3분의 1을 올림한 압박이 추가됩니다. 긴 경기에서는
              상대 공격력이 점점 높아집니다.
            </p>
          </RuleSection>
          <RuleSection
            id="finishers"
            number="04"
            title="콤보로 열기를 만들고, 열기로 끝내세요"
            icon={Fire}
          >
            <p>
              피해를 주는 공격 카드와 피니셔는 턴별 콤보를 쌓습니다.{" "}
              <strong>콤보 2회마다 열기 1</strong>을 얻습니다. 원 투 콤보는
              콤보를 한 번 더 쌓습니다. 콤보는 턴마다 초기화되지만 열기는 남으며
              최대 9까지 보유합니다.
            </p>
            <div className="guide-combo-example">
              <span>
                첫 공격<small>콤보 1</small>
              </span>
              <ArrowRight size={18} />
              <span>
                다음 공격<small>콤보 2 · 열기 +1</small>
              </span>
              <ArrowRight size={18} />
              <span className="finish">
                <Crown size={21} />
                열기 3 확보<small>피니셔 준비</small>
              </span>
            </div>
            <p>
              피니셔는 에너지와 함께 <strong>열기 3을 소모</strong>합니다. 같은
              턴에 모은 열기도 바로 사용할 수 있습니다. 카드가 손에 있어도
              열기나 에너지가 부족하면 사용할 수 없습니다. 다음 경기에는 열기를
              최대 2까지 가져갑니다.
            </p>
            <p className="guide-note">
              드롭킥은 선행 공격 뒤에, 파워밤은 선행 콤보 2 이상에서 강해집니다.
              링 위의 계산은 이번 턴의 다음 공격을 강화합니다. 전체 도감에서 각
              조건을 확인하세요.
            </p>
          </RuleSection>
          <RuleSection
            id="pressure"
            number="05"
            title="몸만큼 마음도 지켜야 합니다"
            icon={Brain}
          >
            <p>
              공격, 도발과 일부 카드가 심리적 압박을 높입니다. 압박이 임계치를
              넘으면 <strong>악몽 · 시선</strong>이 영구 덱과 버린 카드 더미에
              추가되어 이후 드로우를 방해합니다.
            </p>
            <div className="guide-thresholds">
              {[
                [35, "첫 악몽"],
                [60, "악몽 추가"],
                [85, "악몽 추가"],
                [100, "멘탈 붕괴"],
              ].map(([n, label]) => (
                <div key={n} className={n === 100 ? "breakdown" : ""}>
                  <strong>{n}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p>
              악몽을 뽑으면 압박이 <strong>3</strong> 증가합니다. 악몽도
              플레이할 수 있습니다. 에너지 1을 쓰면 압박이 10 줄고 해당 경기에서
              소멸합니다. 다음 경기에는 다시 들어오므로 영구 제거와 구분하세요.
            </p>
            <p>
              압박 100에 도달하면 <strong>체력 8을 잃고 압박이 65</strong>로
              낮아집니다. 체력이 0이 되면 패배합니다. 충분히 진정하면 악몽
              임계치가 다시 활성화될 수 있습니다.
            </p>
            <div className="guide-callout">
              <Heart size={22} />
              <div>
                <strong>악몽을 줄이는 방법</strong>
                <p>
                  호흡 조절·강철 의지로 진정하고, 승리하면 압박 5가 감소합니다.
                  락커룸 명상은 압박 25를 낮추며 악몽 1장을 제거합니다. 프로
                  숍의 멘탈 코칭도 같은 정비를 제공합니다.
                </p>
              </div>
            </div>
          </RuleSection>
          <RuleSection
            id="statuses"
            number="06"
            title="상태 이상은 다음 교환까지 계산하세요"
            icon={Sparkle}
          >
            <dl className="guide-definitions">
              <div>
                <dt>약화</dt>
                <dd>
                  상대 공격을 원래 의도의 <strong>75%</strong>로 낮춥니다.
                  소수점은 버립니다. 공격 의도 7은 실제 공격 5가 됩니다. 가드와
                  도발 수치는 줄이지 않습니다.
                </dd>
              </div>
              <div>
                <dt>취약</dt>
                <dd>
                  상대가 받는 공격 피해를 <strong>150%</strong>로 높입니다.
                  소수점은 버립니다. 보너스를 더한 뒤 취약을 적용하고, 상대
                  방어가 그 피해를 흡수합니다.
                </dd>
              </div>
            </dl>
            <p>
              약화와 취약의 숫자는 남은 상대 행동 횟수입니다.{" "}
              <strong>
                상대가 공격·가드·도발 중 어느 행동을 하든 해결 후 1 감소
              </strong>
              합니다. 취약을 부여하는 카드 자체의 피해는 부여 전 상태로
              해결하므로 후속 공격이 특히 중요합니다.
            </p>
            <p className="guide-note">
              선수 패시브도 계산에 포함됩니다. 레이븐은 매 턴 첫 공격 피해 +2,
              발키리는 잡기 공격 피해 +2, 노바는 매 턴 첫 0코스트 카드 사용 시
              추가 드로우 1을 얻습니다.
            </p>
          </RuleSection>
          <RuleSection
            id="journey"
            number="07"
            title="덱을 늘릴지, 다듬을지 선택하세요"
            icon={Compass}
          >
            <p>
              11장의 시작 덱으로 8개 구간을 진행합니다. 지도에 이어진 선을 따라
              다음 노드를 선택하며, 선택한 경로가 이후 갈 수 있는 분기를
              바꿉니다. 일반전은 35, 정예전은 65, 고위험 계약전은 95 크레딧을
              줍니다. 정예·계약전은 더 강한 상대와 희귀 카드 보상을 묶습니다.
              계약전에서는 카드 4장 중 하나를 선택하고 아이템·코너 기믹 보상도
              받습니다. 카드 보상은 건너뛸 수 있습니다. 8구간의 EMPRESS를 꺾으면
              챔피언이 됩니다.
            </p>
            <dl className="guide-definitions">
              <div>
                <dt>락커룸</dt>
                <dd>
                  최대 체력의 30% 회복(올림), 명상, 카드 1장 강화 중 한 번만
                  선택합니다. 회복은 압박도 5 낮춥니다.
                </dd>
              </div>
              <div>
                <dt>카드 강화</dt>
                <dd>
                  기존 카드의 효과를 영구 개선합니다. 한 장은 한 번만 강화할 수
                  있고 악몽은 훈련으로 강화할 수 없습니다. 도감은 비교를 위해
                  모든 카드의 정의된 강화 효과를 보여줍니다.
                </dd>
              </div>
              <div>
                <dt>프로 숍</dt>
                <dd>
                  카드, 회복, 멘탈 코칭, 자동 강화, 아이템과 코너 기믹을
                  크레딧으로 구매합니다. 구매한 항목은 재구매할 수 없습니다.
                  보관함이 가득 차면 해당 물품을 구매할 수 없습니다.
                </dd>
              </div>
              <div>
                <dt>백스테이지</dt>
                <dd>
                  라커룸·백스테이지 컷신 뒤 체력·압박·크레딧·카드·장비 사이에서
                  선택합니다. 선택 전 이득과 대가를 확인하세요. 위험한 제안은
                  체력이나 덱의 안정성을 희생하는 대신 더 큰 보상을 줍니다.
                </dd>
              </div>
            </dl>
            <p>
              드로우를 안정시키려면 무조건 카드를 받는 대신 덱 크기와 비용을
              살펴보세요. 소멸 카드의 경기 내 정리와 명상의 영구 제거는 서로
              다른 선택입니다. 회복 경로를 고르면 전투 보상을 포기하고, 고위험
              경로를 고르면 다음 휴식까지 버틸 체력과 자원을 확보해야 합니다.
            </p>
          </RuleSection>
          <RuleSection
            id="corner-kit"
            number="08"
            title="한 번의 비상 대처, 한 경기의 운영 전략"
            icon={Sparkle}
          >
            <p>
              손패 아래의 <strong>보급</strong> 버튼으로 코너 보관함을 열어
              물품을 확인합니다. 아이템은 최대 3개, 아직 사용하지 않은 코너
              기믹은 최대 6개를 보관합니다. 경기 보상·프로 숍·이벤트에서 획득할
              수 있습니다.
            </p>
            <h3>아이템 · 1회 사용</h3>
            <p>
              경기 중 에너지 없이 사용하고 즉시 소모합니다. 다음 턴이나 다음
              경기에는 돌아오지 않습니다. 사용하지 않은 물품은 다음 경기로
              가져갑니다. 카드 사용과 콤보를 대신하는 행동은 아닙니다.
            </p>
            <dl className="guide-definitions">
              {Object.values(ITEMS).map((item) => (
                <div key={item.id}>
                  <dt>{item.name}</dt>
                  <dd>{item.description}</dd>
                </div>
              ))}
            </dl>
            <h3>코너 기믹 · 해당 경기 종료까지</h3>
            <p>
              유물을 대신하는 선수 지원 전략입니다. 경기 밖에서 하나를 예약하면
              다음 경기 입장 시 활성화되고 보관함에서 소모됩니다. 효과는 턴이
              바뀌어도 유지되며, 해당 경기의 승리·패배와 함께 끝납니다. 예약하지
              않은 기믹은 보관할 수 있습니다. 대가를 고려해 상대와 내 덱에 맞는
              지원을 고르세요.
            </p>
            <dl className="guide-definitions">
              {Object.values(GIMMICKS).map((gimmick) => (
                <div key={gimmick.id}>
                  <dt>{gimmick.name}</dt>
                  <dd>
                    {gimmick.description} <strong>대가:</strong>{" "}
                    {gimmick.tradeoff}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="guide-note">
              기존 저장에 이미 있던 컨디셔닝 벨트는 기존 효과를 유지합니다. 새
              프로 숍에서는 경기 단위의 코너 기믹을 판매합니다.
            </p>
          </RuleSection>
          <RuleSection
            id="controls"
            number="09"
            title="플레이에 집중하세요. 진행은 자동 저장됩니다"
            icon={Keyboard}
          >
            <div className="guide-keys">
              <span>
                <kbd>1</kbd>–<kbd>9</kbd> 해당 카드
              </span>
              <span>
                <kbd>0</kbd> 10번째 카드
              </span>
              <span>
                <kbd>Space</kbd> 턴 종료
              </span>
              <span>
                <kbd>Esc</kbd> 창 닫기 / 돌아가기
              </span>
            </div>
            <p>
              손패 위를 누른 채 좌우로 드래그하면 손가락 아래의 카드가 한 장씩
              올라오고 강조됩니다. 한 번 탭하면 선택하고, 같은 카드를 빠르게 두
              번 탭하면 바로 사용합니다. 드래그를 놓는 동작은 카드를 사용하지
              않습니다. 선택 카드 사용 버튼과 숫자 단축키도 사용할 수 있습니다.
              에너지나 열기가 부족한 카드는 확인할 수 있지만 사용되지 않습니다.
              도감과 도움말을 보는 동안에는 전투 입력이 적용되지 않습니다.
            </p>
            <p>
              기술 연출은 카드 그림에 초점을 맞춥니다. 타격은 방향 잔상과 접촉
              폭발, 그래플링은 잡기·들어 올림·낙하와 매트 충격파, 서브미션은
              관절 부위의 조임과 지속 압박으로 구분합니다. 방어와 운영 카드에는
              해당 효과를 표현하며, 모션 감소 설정에서는 정지된 그림과 실제
              결과를 표시합니다.
            </p>
            <p>
              지도에서 경로를 한 번 탭하면 위험과 보상을 확인합니다. 같은 경로를
              빠르게 두 번 탭하거나 진입 버튼을 누르면 이동합니다. 현재 위치에서
              연결된 경로만 이동할 수 있습니다. 화면 전체는 고정되며, 긴
              지도·도감· 도움말과 상세 창은 내부에서 스크롤합니다. 길게 눌러
              텍스트를 선택하거나 더블탭으로 화면을 확대하는 동작은 게임 안에서
              차단합니다.
            </p>
            <p>
              런은 <strong>현재 브라우저</strong>에 자동 저장됩니다. 새로고침 후
              이어 할 수 있고 새 런을 시작하면 현재 진행을 교체합니다. 저장은 이
              브라우저에만 남으며 브라우저 데이터 삭제 시 사라집니다. 서버
              동기화와 멀티플레이가 없는 싱글 플레이입니다.
            </p>
          </RuleSection>
          <div className="guide-bottom">
            <div>
              <span className="knowledge-eyebrow">KNOW YOUR MOVES</span>
              <h2>이제 {Object.keys(CARDS).length}장의 기술을 살펴보세요.</h2>
              <p>타격, 던지기, 서브미션과 운영. 당신의 다음 수를 찾아보세요.</p>
            </div>
            <button
              type="button"
              className="knowledge-primary"
              onClick={onOpenLibrary}
            >
              전체 카드 도감
              <BookOpen size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LibraryCard({ card, onSelect }) {
  return (
    <button
      type="button"
      className={`knowledge-card rarity-${card.rarity}`}
      onClick={() => onSelect(card.id)}
      aria-label={`${card.name}, ${card.discipline}, 에너지 ${card.cost}. 상세 보기`}
    >
      <div className="knowledge-card-image">
        <Artwork art={card.art} alt={card.alt} loading="lazy" />
        <span className="knowledge-cost">
          <Lightning size={13} weight="fill" />
          {card.cost}
        </span>
        <span className="knowledge-discipline">{card.discipline}</span>
      </div>
      <div className="knowledge-card-copy">
        <span className="knowledge-card-english">{card.nameEn}</span>
        <h2>{card.name}</h2>
        <div className="knowledge-card-tags">
          <span>{CARD_TYPE_LABELS[card.type]}</span>
          <span>{CARD_RARITY_LABELS[card.rarity]}</span>
          {card.exhaust && <span className="exhaust-tag">소멸</span>}
        </div>
        <p>{card.description}</p>
        <span className="knowledge-card-open">
          기술 자세히 보기
          <ArrowRight size={15} />
        </span>
      </div>
    </button>
  );
}

function CardDetail({ id, onClose }) {
  const ref = useRef(null);
  const base = getCard(id);
  const upgraded = getCard({ id, upgraded: true });
  const detail = CARD_DETAILS[id];
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return (
    <dialog
      ref={ref}
      className="knowledge-dialog"
      aria-labelledby="card-detail-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button
        type="button"
        className="knowledge-dialog-close"
        onClick={close}
        aria-label="카드 상세 닫기"
        autoFocus
      >
        <X size={23} />
      </button>
      <div className="knowledge-detail-art">
        <Artwork art={detail.art} alt={detail.alt} />
        <span>{detail.discipline}</span>
      </div>
      <div className="knowledge-detail-copy">
        <span className="knowledge-eyebrow">{base.nameEn}</span>
        <h2 id="card-detail-title">{base.name}</h2>
        <div className="knowledge-detail-tags">
          <span>
            <Lightning size={15} />
            에너지 {base.cost}
          </span>
          <span>{CARD_TYPE_LABELS[base.type]}</span>
          <span>{CARD_RARITY_LABELS[base.rarity]}</span>
          <span>{base.exhaust ? "사용 후 소멸" : "사용 후 버린 카드"}</span>
        </div>
        <p className="knowledge-technique">{detail.technique}</p>
        <div className="knowledge-effect-comparison">
          <section>
            <span>ORIGINAL</span>
            <h3>기본 효과</h3>
            <p>{base.description}</p>
          </section>
          <section className="upgraded">
            <span>UPGRADED</span>
            <h3>강화 효과</h3>
            <p>{upgraded.description}</p>
          </section>
        </div>
        {base.type === "nightmare" && (
          <p className="knowledge-small-note">
            악몽의 강화 효과는 데이터 비교용입니다. 실제 런에서는 악몽을
            훈련으로 강화할 수 없습니다.
          </p>
        )}
        <div className="knowledge-acquisition">
          <Compass size={22} />
          <div>
            <h3>획득 방법</h3>
            <p>{detail.acquisition}</p>
          </div>
        </div>
        <p className="knowledge-small-note">
          위 효과는 카드의 기본 정의입니다. 실제 경기에서는 선수 패시브, 콤보,
          상대의 약화·취약과 방어가 결과에 반영됩니다.
        </p>
      </div>
    </dialog>
  );
}

export function CardLibraryPage({ onOpenGuide, onBack }) {
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("all");
  const [type, setType] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [upgraded, setUpgraded] = useState(false);
  const [selected, setSelected] = useState(null);
  const cards = useMemo(
    () => getLibraryCards({ search, discipline, type, rarity, upgraded }),
    [search, discipline, type, rarity, upgraded],
  );
  const reset = () => {
    setSearch("");
    setDiscipline("all");
    setType("all");
    setRarity("all");
  };
  return (
    <section
      className="knowledge-page library-page"
      aria-labelledby="knowledge-title"
    >
      <KnowledgeHeader
        eyebrow="THE COMPLETE MOVE LIBRARY"
        title="카드 도감"
        description={`모든 기술에는 고유한 리듬이 있습니다. ${Object.keys(CARDS).length}장의 기술과 악몽을 살펴보고, 기본과 강화를 비교하세요.`}
        onBack={onBack}
        onRelated={onOpenGuide}
        relatedLabel="카드 시스템 가이드"
      >
        <div className="library-summary">
          <span>
            <strong>{Object.keys(CARDS).length}</strong> ALL CARDS
          </span>
          <span>
            <strong>{Object.keys(WRESTLERS).length}</strong> SIGNATURE STYLES
          </span>
          <span>타격부터 피니셔까지</span>
        </div>
      </KnowledgeHeader>
      <div className="library-controls">
        <label className="library-search">
          <MagnifyingGlass size={21} />
          <span className="knowledge-sr-only">카드 이름 또는 기술 검색</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="카드 이름, 기술, 효과 검색"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="검색어 지우기"
            >
              <X size={17} />
            </button>
          )}
        </label>
        <div
          className="library-version"
          role="group"
          aria-label="표시할 카드 효과"
        >
          <button
            type="button"
            aria-pressed={!upgraded}
            onClick={() => setUpgraded(false)}
          >
            기본
          </button>
          <button
            type="button"
            aria-pressed={upgraded}
            onClick={() => setUpgraded(true)}
          >
            <Sparkle size={15} />
            강화
          </button>
        </div>
        <div className="library-filter-row">
          <label>
            기술 분류
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            >
              <option value="all">모든 기술</option>
              {CARD_DISCIPLINES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            카드 타입
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">모든 타입</option>
              {Object.entries(CARD_TYPE_LABELS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            희귀도
            <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
              <option value="all">모든 희귀도</option>
              {Object.entries(CARD_RARITY_LABELS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="library-reset" onClick={reset}>
            필터 초기화
          </button>
        </div>
      </div>
      <div className="library-result-heading">
        <p role="status" aria-live="polite">
          <strong>{cards.length}</strong> / {Object.keys(CARDS).length} CARDS
          <span>{upgraded ? "강화 효과 표시 중" : "기본 효과 표시 중"}</span>
        </p>
        <span>카드를 선택해 기술과 획득 방법을 확인하세요.</span>
      </div>
      <div className="knowledge-card-grid">
        {cards.map((card) => (
          <LibraryCard key={card.id} card={card} onSelect={setSelected} />
        ))}
      </div>
      {cards.length === 0 && (
        <div className="library-empty">
          <MagnifyingGlass size={38} />
          <h2>조건에 맞는 카드가 없습니다.</h2>
          <p>검색어를 줄이거나 다른 기술 분류를 선택해 보세요.</p>
          <button type="button" className="knowledge-primary" onClick={reset}>
            전체 카드 보기
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      <footer className="knowledge-footer">
        <span>시작·시그니처·보상·악몽 카드 전체 수록</span>
        <button type="button" onClick={onOpenGuide}>
          규칙이 궁금하다면
          <ArrowRight size={15} />
        </button>
      </footer>
      {selected && (
        <CardDetail id={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
