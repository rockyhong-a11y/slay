import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Backpack,
  Check,
  Coins,
  Coffee,
  Crown,
  Eye,
  Fire,
  Skull,
  Stack,
  Storefront,
  Sword,
  X,
} from "@phosphor-icons/react";
import {
  getRouteView,
  getWaveInfo,
  ITEMS,
  GIMMICKS,
  GIMMICK_CAPACITY,
  WRESTLERS,
} from "./game.js";
import { Artwork } from "./Artwork.jsx";
import { EquipmentArt } from "./WrestlingEquipment.jsx";
import { fighterPoseArt, selectFighterState } from "./presentation.js";
import { createRouteTapTracker } from "./route-gestures.js";
import { HAND_DOUBLE_TAP_MS, TOUCH_CONFIRM_MS } from "./hand-interaction.js";
import "./touch-feedback.css";
import "./run-journey.css";

const asset = (path) => `${import.meta.env.BASE_URL}assets/${path}`;
const nodeIcons = {
  fight: Sword,
  combat: Sword,
  elite: Fire,
  risk: Skull,
  highrisk: Skull,
  rest: Coffee,
  event: Eye,
  shop: Storefront,
  boss: Crown,
};
const rarityNames = {
  common: "일반",
  uncommon: "고급",
  rare: "희귀",
  signature: "시그니처",
};
function rewardText(node) {
  const reward = node.reward || {};
  return [
    reward.coins ? `${reward.coins} 크레딧` : null,
    reward.cardChoices ? `${reward.cardChoices}장 중 카드 선택` : null,
    Array.isArray(reward.rarities) && reward.rarities.length
      ? `${reward.rarities.map((rarity) => rarityNames[rarity] || rarity).join(" · ")} 카드`
      : null,
    typeof reward.loot === "string"
      ? reward.loot
      : reward.loot
        ? "소모품·기믹 보급 보장"
        : null,
  ].filter(Boolean);
}
function dangerText(node) {
  const danger = node.danger || {};
  return [
    danger.hpMultiplier && danger.hpMultiplier !== 1
      ? `상대 체력 ×${danger.hpMultiplier}`
      : null,
    danger.attackBonus ? `상대 공격 +${danger.attackBonus}` : null,
  ].filter(Boolean);
}

export function ChoiceFeedback({ choice, onDismiss }) {
  if (!choice) return null;
  return (
    <div className="journey-feedback" role="status">
      <Check size={21} />
      <div>
        <span>선택 결과</span>
        <strong>{choice.label}</strong>
        <ul>
          {(choice.result || []).map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="선택 결과 닫기">
          <X size={17} />
        </button>
      )}
    </div>
  );
}

export function ChampionRoad({
  state,
  onChoose,
  preview = false,
  locked = false,
  contextKey,
  feedback,
  onDismissFeedback,
}) {
  const graph = getRouteView(state);
  const waveInfo = getWaveInfo(state);
  const [selectedId, setSelectedId] = useState(null);
  const [tapFeedback, setTapFeedback] = useState(null);
  const tapTimers = useRef({ arm: null, commit: null });
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;
  const clearTapTimers = () => {
    clearTimeout(tapTimers.current.arm);
    clearTimeout(tapTimers.current.commit);
    tapTimers.current = { arm: null, commit: null };
  };
  const tapTrackerRef = useRef(null);
  if (!tapTrackerRef.current) {
    tapTrackerRef.current = createRouteTapTracker();
  }
  const tapTracker = tapTrackerRef.current;
  const routeContext = `${state.phase}:${state.wave || 1}:${state.floor}:${graph.currentNodeId}:${preview}:${locked}:${contextKey || ""}`;
  tapTracker.setContext(routeContext);
  useEffect(() => {
    clearTapTimers();
    tapTracker.reset();
    setTapFeedback(null);
    setSelectedId(null);
    return clearTapTimers;
  }, [routeContext]);
  useEffect(() => {
    const abort = () => {
      clearTapTimers();
      tapTracker.reset();
      setTapFeedback(null);
    };
    const hide = () => {
      if (document.hidden) abort();
    };
    const rejectMultitouch = (event) => {
      if (
        event.isPrimary === false ||
        !event.target.closest?.('[data-route-available="true"]')
      )
        abort();
    };
    window.addEventListener("pointerdown", rejectMultitouch, true);
    window.addEventListener("blur", abort);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("pointerdown", rejectMultitouch, true);
      window.removeEventListener("blur", abort);
      document.removeEventListener("visibilitychange", hide);
      abort();
    };
  }, [tapTracker]);
  const columns =
    graph.laneCount || Math.max(3, ...graph.nodes.map((node) => node.lane + 1));
  const maxFloor = graph.maxFloor || state.maxFloor;
  const rowHeight = 112;
  const width = 1000;
  const height = rowHeight * maxFloor;
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const available = graph.nodes.filter(
    (node) => node.available && !preview && !locked,
  );
  const chooseNode = (nodeId) => {
    if (
      preview ||
      locked ||
      state.phase !== "map" ||
      !tapTracker.claimEntry(
        nodeId,
        available.map((node) => node.id),
      )
    ) {
      return;
    }
    clearTapTimers();
    setSelectedId(nodeId);
    setTapFeedback({ nodeId, stage: "confirmed", detail: "✓ 2/2 · 이동 확정" });
    tapTimers.current.commit = setTimeout(
      () => chooseRef.current(nodeId),
      TOUCH_CONFIRM_MS,
    );
  };
  const beginNodeTap = (event) => {
    const node = event.target.closest('[data-route-available="true"]');
    const primary =
      event.isPrimary !== false &&
      (event.pointerType !== "mouse" || event.button === 0);
    tapTracker.begin({
      pointerId: event.pointerId,
      nodeId: node?.dataset.node || null,
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      primary,
    });
    if (node && primary && !tapTracker.locked) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setTapFeedback({
        nodeId: node.dataset.node,
        stage: "pressed",
        detail: "누르는 중",
      });
    }
  };
  const finishNodeTap = (event) => {
    const activeNodeId = tapTracker.activeNodeId;
    if (tapTracker.locked && !activeNodeId) return;
    const node = activeNodeId
      ? event.currentTarget.querySelector(`[data-node="${activeNodeId}"]`)
      : null;
    const rect = node?.getBoundingClientRect();
    const inside =
      rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    const tap = tapTracker.finish({
      pointerId: event.pointerId,
      nodeId: inside ? activeNodeId : null,
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    });
    if (!tap) {
      setTapFeedback(null);
      clearTimeout(tapTimers.current.arm);
      return;
    }
    setSelectedId(tap.nodeId);
    if (tap.double) chooseNode(tap.nodeId);
    else {
      clearTimeout(tapTimers.current.arm);
      setTapFeedback({
        nodeId: tap.nodeId,
        stage: "armed",
        detail: "1/2 · 같은 곳을 한 번 더 탭",
      });
      tapTimers.current.arm = setTimeout(() => {
        tapTracker.expire();
        setTapFeedback((current) =>
          current?.stage === "armed"
            ? {
                ...current,
                stage: "selected",
                detail: "선택됨 · 두 번 탭해 이동",
              }
            : current,
        );
      }, HAND_DOUBLE_TAP_MS + 1);
    }
  };
  const selected =
    available.find((node) => node.id === selectedId) ||
    available[0] ||
    graph.nodes.find((node) => node.current);
  const point = (node) => [
    ((node.lane + 0.5) / columns) * width,
    (maxFloor - node.floor + 0.5) * rowHeight,
  ];
  return (
    <div className="journey-road">
      <header className="journey-road-heading">
        <div>
          <span>
            WAVE {waveInfo.wave} / {waveInfo.total} · {waveInfo.difficulty} ·
            CHAMPIONSHIP ROAD
          </span>
          <h2>
            왕좌까지 이어지는 선택<span>.</span>
          </h2>
        </div>
        <p>
          지금 서 있는 곳에서 연결된 길만 선택할 수 있습니다. 강한 상대에게
          도전하면 더 큰 보상이 기다립니다. 한 번 눌러 살펴보고, 같은 경로를
          빠르게 두 번 누르면 바로 이동합니다.
        </p>
      </header>
      <div className="journey-combat-checkpoints">
        <strong>
          이번 웨이브 보스 전 최소 {graph.minPreBossCombats || 4}경기 · 현재{" "}
          {graph.completedCombats || 0}승
        </strong>
        <span>1·3·5·7구간 필수 전투 / 2·4·6구간 준비 또는 추가 도전</span>
      </div>
      {state.route?.migratedFrom && (
        <p className="loadout-note">
          기존 진행을 새 예선 경로에 연결했습니다. 승리 횟수에 맞춰 구간을
          배정했으며, 선수·덱·크레딧과 진행 중인 경기는 유지됩니다.
        </p>
      )}
      <ChoiceFeedback choice={feedback} onDismiss={onDismissFeedback} />
      <div className="journey-road-legend">
        <span>
          <i className="visited" />
          지나온 길
        </span>
        <span>
          <i className="available" />
          선택 가능한 길
        </span>
        <span>
          <i />
          아직 닿지 않은 길
        </span>
      </div>
      <div className="journey-road-layout">
        <div
          className="journey-graph"
          onPointerDown={beginNodeTap}
          onPointerMove={(event) => {
            tapTracker.move({
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            });
            if (!tapTracker.activeNodeId) {
              clearTimeout(tapTimers.current.arm);
              setTapFeedback((current) =>
                current?.stage === "confirmed" ? current : null,
              );
            }
          }}
          onPointerUp={finishNodeTap}
          onPointerCancel={(event) => {
            tapTracker.cancel(event.pointerId);
            clearTimeout(tapTimers.current.arm);
            setTapFeedback(null);
          }}
          onLostPointerCapture={(event) => tapTracker.cancel(event.pointerId)}
          onDoubleClick={(event) => event.preventDefault()}
          style={{
            "--route-columns": columns,
            "--route-row-height": `${rowHeight}px`,
          }}
        >
          <svg
            className="journey-connections"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {graph.edges.map((edge) => {
              const from = byId.get(edge.from),
                to = byId.get(edge.to);
              if (!from || !to) return null;
              const [x1, y1] = point(from),
                [x2, y2] = point(to);
              const middle = (y1 + y2) / 2;
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  className={
                    edge.visited
                      ? "visited"
                      : edge.available && !preview
                        ? "available"
                        : "future"
                  }
                  d={`M${x1},${y1} C${x1},${middle} ${x2},${middle} ${x2},${y2}`}
                />
              );
            })}
          </svg>
          {Array.from({ length: maxFloor }, (_, index) => maxFloor - index).map(
            (floor) => (
              <div
                className="journey-route-floor"
                key={floor}
                aria-label={`${floor}번째 구간 · ${graph.stageLabels?.[floor] || ""}`}
              >
                <span className="journey-floor-number">
                  {String(floor).padStart(2, "0")}
                </span>
                {graph.nodes
                  .filter((node) => node.floor === floor)
                  .map((node) => {
                    const Icon = nodeIcons[node.type] || Sword;
                    const enabled = node.available && !preview && !locked;
                    const rewards = rewardText(node),
                      dangers = dangerText(node);
                    return (
                      <button
                        type="button"
                        key={node.id}
                        className={`journey-node type-${node.type} ${node.visited ? "visited" : ""} ${node.current ? "current" : ""} ${enabled ? "available" : ""} ${selected?.id === node.id ? "selected" : ""}`}
                        style={{
                          gridColumn: Number.isInteger(node.lane)
                            ? node.lane + 1
                            : `${Math.floor(node.lane) + 1} / span 2`,
                        }}
                        disabled={!enabled}
                        aria-current={node.current ? "step" : undefined}
                        aria-pressed={
                          enabled ? selected?.id === node.id : undefined
                        }
                        aria-label={`${node.label}. ${node.description}. ${[...dangers, ...rewards].join(". ")}${enabled ? ". 선택 가능한 경로" : node.visited ? ". 방문한 경로" : ". 잠긴 경로"}`}
                        data-node={node.id}
                        data-route-available={enabled}
                        data-touch-stage={
                          tapFeedback?.nodeId === node.id
                            ? tapFeedback.stage
                            : undefined
                        }
                        onClick={(event) => {
                          // Pointer taps are handled above; keyboard and assistive
                          // clicks still select without consuming a route.
                          if (event.detail === 0 && !tapTracker.locked) {
                            tapTracker.abort();
                            clearTimeout(tapTimers.current.arm);
                            setSelectedId(node.id);
                            setTapFeedback({
                              nodeId: node.id,
                              stage: "selected",
                              detail: "선택됨 · 아래 진입 버튼으로 이동",
                            });
                          }
                        }}
                      >
                        <span className="journey-node-symbol">
                          <Icon
                            size={23}
                            weight={node.current ? "fill" : "regular"}
                          />
                          {node.visited && (
                            <Check className="journey-node-check" size={11} />
                          )}
                        </span>
                        <strong>{node.label}</strong>
                        {tapFeedback?.nodeId === node.id && (
                          <span className="journey-node-tap" aria-hidden="true">
                            {tapFeedback.stage === "confirmed"
                              ? "✓ 이동"
                              : tapFeedback.stage === "armed"
                                ? "1/2 탭"
                                : tapFeedback.stage === "pressed"
                                  ? "●"
                                  : "✓ 선택"}
                          </span>
                        )}
                        {enabled && node.reward?.coins > 0 && (
                          <small>
                            <Coins size={10} />
                            {node.reward.coins}
                            {node.reward.cardChoices
                              ? ` · ${node.reward.cardChoices}장`
                              : ""}
                          </small>
                        )}
                        {node.risk && (
                          <em>
                            {typeof node.risk === "string"
                              ? node.risk
                              : "HIGH RISK"}
                          </em>
                        )}
                      </button>
                    );
                  })}
              </div>
            ),
          )}
        </div>
        <div className="journey-route-inspector" aria-live="polite">
          <div>
            <span>
              {preview || !selected?.available
                ? "경로 미리보기"
                : `${selected.floor}번째 구간 · 다음 선택`}
            </span>
            <h3>{selected?.label || "다음 경기를 준비하세요"}</h3>
            <p>
              {selected?.description || "경기를 마치면 다음 경로가 열립니다."}
            </p>
            {!!selected && (
              <div className="journey-node-facts">
                {dangerText(selected).map((text) => (
                  <span className="danger" key={text}>
                    {text}
                  </span>
                ))}
                {rewardText(selected).map((text) => (
                  <span key={text}>{text}</span>
                ))}
              </div>
            )}
            {!preview && selected?.available && (
              <p className="journey-route-hint">
                {tapFeedback?.nodeId === selected.id
                  ? `${selected.label} · ${tapFeedback.detail}`
                  : "경로를 한 번 눌러 선택 · 같은 곳을 두 번 탭해 이동"}
              </p>
            )}
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={
              preview ||
              locked ||
              !selected?.available ||
              tapFeedback?.stage === "confirmed"
            }
            onClick={() => chooseNode(selected.id)}
          >
            {tapFeedback?.stage === "confirmed"
              ? "이동 확정"
              : "이 경로로 진입"}
            {tapFeedback?.stage === "confirmed" ? (
              <Check size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InventoryTrigger({ state, onClick }) {
  const count = state.inventory?.length || 0;
  const active = state.activeGimmick && GIMMICKS[state.activeGimmick.id];
  const queued = state.gimmicks?.find(
    (item) => item.uid === state.equippedGimmickUid,
  );
  const corner = active?.name || GIMMICKS[queued?.id]?.name || "없음";
  return (
    <button
      type="button"
      className="journey-inventory-trigger inventory-trigger"
      onClick={onClick}
      aria-label={`보급 버튼으로 코너 보관함 열기. 소모품 ${count}개. 코너 기믹 ${corner}`}
      title={`소모품 ${count}/3 · 코너 기믹 ${corner}${active ? " · 이번 경기 종료 후 만료" : queued ? " · 다음 경기 예약" : ""}`}
    >
      <Backpack size={17} />
      <strong>{count}</strong>
      <span>보급</span>
    </button>
  );
}

export function JourneyInventory({
  state,
  onUse,
  onEquip,
  onOpenPile,
  locked = false,
}) {
  const inventory = state.inventory || [],
    stock = state.gimmicks || [];
  const staging = [
    "map",
    "rest",
    "shop",
    "event",
    "reward",
    "wave-clear",
  ].includes(state.phase);
  const active = state.activeGimmick && GIMMICKS[state.activeGimmick.id];
  return (
    <div className="journey-inventory">
      <section>
        <div className="journey-section-heading">
          <h3>링사이드 도구 · 1회 사용</h3>
          <span>{inventory.length}/3 슬롯</span>
        </div>
        <p>
          체어, 링벨과 정비 도구를 전투 중 에너지 없이 한 번 사용합니다. 사용한
          도구는 이번 런의 보관함에서 소모됩니다.
        </p>
        <div className="journey-item-slots">
          {inventory.map((entry) => {
            const definition = ITEMS[entry.id];
            if (!definition) return null;
            return (
              <article key={entry.uid} className="journey-item">
                <EquipmentArt definition={definition} />
                <h4>{definition.name}</h4>
                <p>{definition.description}</p>
                <button
                  type="button"
                  onClick={() => onUse(entry.uid)}
                  disabled={state.phase !== "combat" || locked}
                >
                  사용 · 에너지 0
                </button>
              </article>
            );
          })}
          {Array.from(
            { length: Math.max(0, 3 - inventory.length) },
            (_, index) => (
              <div className="journey-empty-slot" key={index}>
                <Backpack size={22} />
                <span>빈 슬롯</span>
              </div>
            ),
          )}
        </div>
      </section>
      <section>
        <div className="journey-section-heading">
          <h3>경기 장비 · 1경기 지속</h3>
          <span>
            {stock.length}/{GIMMICK_CAPACITY} 보관
          </span>
        </div>
        <p>
          테이블, 사다리, 벨트 등 다음 경기에서 사용할 장비입니다. 경기 시작 때
          소모되고, 그 경기의 승패가 정해지면 효과가 끝납니다.
        </p>
        {active && (
          <div className="journey-active-gimmick">
            <EquipmentArt definition={active} />
            <div>
              <span>이번 경기 적용 중 · {state.turn}라운드</span>
              <strong>{active.name}</strong>
              <p>{active.description}</p>
              <small>{active.tradeoff}</small>
              <em>이번 경기 종료 후 만료</em>
            </div>
          </div>
        )}
        {!staging && (
          <p className="journey-staging-note">
            다음 기믹 예약은 경기를 마친 뒤 가능합니다.
          </p>
        )}
        <div className="journey-gimmick-list">
          {stock.map((entry) => {
            const definition = GIMMICKS[entry.id];
            if (!definition) return null;
            const selected = entry.uid === state.equippedGimmickUid;
            return (
              <article className={selected ? "queued" : ""} key={entry.uid}>
                <EquipmentArt definition={definition} />
                <div>
                  <span>{selected ? "다음 경기 예약" : "1경기 사용"}</span>
                  <h4>{definition.name}</h4>
                  <p>{definition.description}</p>
                  <small>{definition.tradeoff}</small>
                </div>
                <button
                  type="button"
                  onClick={() => onEquip(selected ? null : entry.uid)}
                  disabled={!staging || locked}
                >
                  {selected ? "예약 취소" : "예약"}
                  {selected ? <Check size={15} /> : <ArrowRight size={15} />}
                </button>
              </article>
            );
          })}
          {!stock.length && (
            <div className="journey-empty-gimmick">
              보관 중인 경기 장비가 없습니다. 경기 보상, 상점과 이벤트에서
              획득할 수 있습니다.
            </div>
          )}
        </div>
      </section>
      <div className="journey-pile-links">
        <button type="button" onClick={() => onOpenPile("draw")}>
          <Stack size={17} />
          드로우 덱 {state.draw.length}
        </button>
        <button type="button" onClick={() => onOpenPile("discard")}>
          <Backpack size={17} />
          버린 카드 {state.discard.length}
        </button>
      </div>
    </div>
  );
}

export function RewardLoot({ state, onClaim }) {
  const offers = [
    ...(state.rewardLoot?.items || []).map((id) => ({
      kind: "item",
      id,
      definition: ITEMS[id],
      full: (state.inventory?.length || 0) >= 3,
    })),
    ...(state.rewardLoot?.gimmicks || []).map((id) => ({
      kind: "gimmick",
      id,
      definition: GIMMICKS[id],
      full: (state.gimmicks?.length || 0) >= GIMMICK_CAPACITY,
    })),
  ].filter((offer) => offer.definition);
  if (!offers.length) return null;
  return (
    <div className="journey-reward-loot">
      <span>경기 보급 · 카드 선택 전에 수령하세요</span>
      {offers.map(({ kind, id, definition, full }) => (
        <button
          type="button"
          key={`${kind}-${id}`}
          onClick={() => onClaim(kind, id)}
          disabled={full}
        >
          <EquipmentArt definition={definition} />
          <div>
            <strong>{definition.name}</strong>
            <small>{definition.description}</small>
          </div>
          <span>{full ? "보관함 가득 참" : "무료 수령"}</span>
        </button>
      ))}
    </div>
  );
}

function sceneFor(state) {
  const arrival = state.arrival;
  return (
    arrival?.cutscene?.artKey ||
    arrival?.artKey ||
    state.event?.cutscene?.artKey ||
    state.event?.artKey ||
    (state.phase === "rest"
      ? "events/lockerroom.webp"
      : "events/backstage.webp")
  );
}

export function JourneyLocation({ state, children }) {
  const condition = selectFighterState(state.player);
  const scene = sceneFor(state);
  return (
    <section
      className={`journey-location ${scene.includes("highstakes") ? "highstakes" : ""}`}
    >
      <img
        className="journey-location-background"
        src={asset(scene)}
        alt="선수의 다음 선택을 기다리는 백스테이지"
      />
      <div className="journey-location-shade" />
      <Artwork
        art={fighterPoseArt(state.player.id, condition)}
        alt=""
        className="journey-location-actor"
        condition={condition.id}
        vitals={state.player}
      />
      <div className="journey-location-content">{children}</div>
    </section>
  );
}

export function RunArrival({ state, onContinue, shortened = false }) {
  const dialog = useRef(null),
    heading = useRef(null);
  const titleId = useId();
  const establishTimer = useRef(null);
  const reduced = useReducedMotion();
  const still = reduced || shortened;
  const [beat, setBeat] = useState(still ? 0 : -1);
  const arrival = state.arrival || {};
  const cutscene = arrival.cutscene || state.event?.cutscene || {};
  const scene = sceneFor(state);
  const actor = WRESTLERS[state.player.id];
  const condition = selectFighterState(state.player);
  const beats = [
    ...new Set(
      [
        cutscene.subtitle,
        state.event?.description || arrival.description,
        "선택의 비용과 보상을 확인한 뒤 진행하세요.",
      ].filter(Boolean),
    ),
  ];
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    heading.current?.focus({ preventScroll: true });
    establishTimer.current = setTimeout(() => setBeat(0), still ? 0 : 550);
    return () => {
      clearTimeout(establishTimer.current);
      element?.close();
    };
  }, [still]);
  return (
    <dialog
      ref={dialog}
      className={`journey-arrival ${scene.includes("highstakes") ? "highstakes" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <motion.img
        className="journey-arrival-background"
        src={asset(scene)}
        alt=""
        initial={{ scale: still ? 1 : 1.035 }}
        animate={{ scale: 1 }}
        transition={{ duration: still ? 0 : 0.85 }}
      />
      <div className="journey-arrival-shade" />
      <div className="journey-arrival-header">
        <span>
          SLAY / {state.phase === "rest" ? "LOCKER ROOM" : "BACKSTAGE"}
        </span>
        <button type="button" onClick={onContinue}>
          연출 건너뛰기
          <ArrowRight size={15} />
        </button>
      </div>
      <motion.div
        className="journey-arrival-actor"
        initial={{ opacity: still ? 1 : 0, x: still ? 0 : -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: still ? 0 : 0.45 }}
      >
        <Artwork
          art={fighterPoseArt(state.player.id, condition)}
          alt={`${actor?.name || state.player.id} · ${condition.label} 자세`}
          condition={condition.id}
          vitals={state.player}
        />
      </motion.div>
      <div className="journey-arrival-dialogue">
        <span>
          {actor?.name || state.player.id} /{" "}
          {String(Math.max(0, beat) + 1).padStart(2, "0")}
        </span>
        <h2 id={titleId} ref={heading} tabIndex={-1}>
          {cutscene.title ||
            arrival.label ||
            state.event?.title ||
            "링 밖의 선택"}
        </h2>
        <p aria-live="polite">
          {beat < 0 ? "잠시, 링 밖에서 숨을 고릅니다." : beats[beat]}
        </p>
        <div className="journey-arrival-controls">
          <span>
            {beats.map((_, index) => (
              <i className={index === beat ? "active" : ""} key={index} />
            ))}
          </span>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              clearTimeout(establishTimer.current);
              beat < beats.length - 1
                ? setBeat(Math.max(0, beat + 1))
                : onContinue();
            }}
          >
            {beat < beats.length - 1 ? "다음" : "선택 보기"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </dialog>
  );
}
