import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Stop,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { WRESTLERS, getCard } from "./game.js";
import { CARD_DISCIPLINES, getLibraryCards } from "./card-library.js";
import { createAnimationPreview } from "./animation-preview.js";
import { TechniqueScene } from "./CombatPresentation.jsx";
import { ClassicCombatStage } from "./ClassicCombatStage.jsx";
import { SDCombatStage } from "./SDCombatStage.jsx";
import { Artwork } from "./Artwork.jsx";
import "./animation-preview.css";

export function RosterAnimationPreview({
  actor,
  displayMode,
  shortened,
  modeControl,
  onBack,
}) {
  const fighter = WRESTLERS[actor];
  const [selected, setSelected] = useState("strike");
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("all");
  const [preview, setPreview] = useState(null);
  const [playing, setPlaying] = useState(false);
  const serial = useRef(0);
  const stage = useRef(null);
  useEffect(() => setPlaying(false), [displayMode, shortened]);
  const cards = getLibraryCards({ search, discipline });
  const play = (cardId = selected) => {
    const next = createAnimationPreview(actor, cardId, {
      id: `roster-${actor}-${++serial.current}`,
      now: performance.now(),
    });
    setSelected(cardId);
    setPreview(next);
    setPlaying(!!next);
    stage.current?.scrollIntoView({ behavior: "auto", block: "start" });
  };
  const Stage = displayMode === "sd" ? SDCombatStage : ClassicCombatStage;
  return (
    <div className="roster-animation-preview">
      <div className="roster-preview-toolbar">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={17} /> 선수 목록
        </button>
        {modeControl}
      </div>
      <p className="replay-note">
        카드를 선택하면 {fighter.nameKo}의 전투 연출을 시연합니다. 상대는
        시연마다 무작위로 배정됩니다. 현재 경기와 저장 데이터는 유지됩니다.
      </p>
      <div
        className="roster-replay-stage"
        ref={stage}
        data-replay-actor={actor}
      >
        <div className="roster-replay-matchup" aria-live="polite">
          <strong>{fighter.nameKo}</strong>
          <span>VS</span>
          <strong>
            {preview ? WRESTLERS[preview.opponent].nameKo : "무작위 상대"}
          </strong>
        </div>
        {playing && preview ? (
          <TechniqueScene
            key={`${preview.cue.id}-${displayMode}`}
            cue={preview.cue}
            displayMode={displayMode}
            shortened={shortened}
            playerActor={actor}
            enemyActor={preview.opponent}
            embedded
            includeFighterReplay
            onComplete={(id) => {
              if (id === preview.cue.id) setPlaying(false);
            }}
          />
        ) : preview ? (
          <Stage player={actor} enemy={preview.opponent} cinematic />
        ) : (
          <div className="replay-start-hint">
            <Play size={36} />
            <strong>카드를 선택해 전투 애니메이션 보기</strong>
          </div>
        )}
      </div>
      <div className="replay-controls">
        <span role="status">
          {getCard(selected).name} ·{" "}
          {playing ? "시연 중" : preview ? "시연 완료" : "준비"}
        </span>
        <button
          type="button"
          className="replay-play-button"
          onClick={() => play()}
        >
          <ArrowCounterClockwise size={17} />{" "}
          {preview ? "다시 시연 · 새 상대" : "시연 시작"}
        </button>
        {playing && (
          <button type="button" onClick={() => setPlaying(false)}>
            <Stop size={17} /> 중지
          </button>
        )}
      </div>
      <div className="replay-filters">
        <label>
          카드 검색
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="카드 이름 또는 기술"
            type="search"
          />
        </label>
        <label>
          기술 분류
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          >
            <option value="all">모든 카드</option>
            {CARD_DISCIPLINES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="replay-card-count">
        {cards.length}개 카드 · 선수 전용 카드도 시연할 수 있습니다.
      </p>
      <div className="replay-card-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className="replay-card"
            aria-pressed={selected === card.id}
            onClick={() => play(card.id)}
            aria-label={`${fighter.nameKo} · ${card.name} 전투 애니메이션 시연`}
          >
            <Artwork art={card.art} alt="" />
            <span>
              <b>{card.name}</b>
              <small>
                {card.discipline}
                {fighter.startingDeck.includes(card.id) ? " · 시작 덱" : ""}
              </small>
            </span>
            <Play size={15} weight="fill" />
          </button>
        ))}
      </div>
      {!cards.length && <p className="muted">검색 결과가 없습니다.</p>}
    </div>
  );
}
