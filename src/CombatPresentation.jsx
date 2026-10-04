"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Fire, Heartbeat, Shield, Sparkle } from "@phosphor-icons/react";
import { FIGHTER_STATES, fighterPoseArt } from "./presentation.js";
import "./combat-presentation.css";
import { LiveArt } from "./LiveArt.jsx";
import { motionTokens } from "./motion-config.js";

const icons = {
  normal: Shield,
  excited: Sparkle,
  fiery: Fire,
  frustrated: Heartbeat,
  tired: Heartbeat,
  groggy: Heartbeat,
};

export function FighterCondition({ condition, enemy = false, onClick }) {
  const Icon = icons[condition.id];
  const Element = onClick ? "button" : "span";
  return (
    <Element
      type={onClick ? "button" : undefined}
      className={`fighter-condition condition-${condition.id}`}
      onClick={onClick}
      title={
        enemy
          ? "상대는 체력과 약화 상태에 따라 자세가 바뀝니다."
          : onClick
            ? `${condition.rule}. 컨디션과 모션 보기`
            : condition.rule
      }
      aria-label={
        onClick
          ? `현재 선수 상태: ${condition.label}. 컨디션과 모션 보기`
          : `${enemy ? "상대" : "선수"} 상태: ${condition.label}`
      }
    >
      <Icon size={12} weight="fill" />
      <span>{condition.label}</span>
    </Element>
  );
}

export function FighterSprite({
  actor,
  condition,
  name,
  side,
  hit = false,
  hitId = null,
  cast = null,
  still = false,
  shortened = false,
}) {
  const reduced = useReducedMotion();
  const requested = fighterPoseArt(actor, condition);
  return (
    <div
      className={`fighter ${side}-fighter ${hit ? "hit" : ""} ${cast ? `casting casting-${cast.disciplineSlug}` : ""}`}
      data-condition={condition.id}
    >
      <div
        className={`fighter-sprite-frame pose-${condition.id} ${still ? "pose-still" : ""}`}
      >
        <LiveArt
          art={requested}
          alt={`${name} · ${condition.label} 자세`}
          className="fighter-pose"
          condition={condition.id}
          still={still}
          cast={cast}
          castDuration={reduced || shortened ? 650 : cast?.duration}
          hit={hit}
          hitId={hitId}
          side={side}
          position={[0.5, 1]}
        />
      </div>
    </div>
  );
}

export function TechniqueScene({ cue, onComplete, shortened = false }) {
  const reduced = useReducedMotion();
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const duration = reduced || shortened ? 650 : cue.duration;
  useEffect(() => {
    const timer = setTimeout(() => complete.current(cue.id), duration);
    return () => clearTimeout(timer);
  }, [cue.id, duration]);
  return (
    <motion.div
      className={`technique-scene scene-${cue.disciplineSlug} ${cue.finisher ? "scene-finisher" : ""} ${reduced || shortened ? "scene-still" : ""}`}
      data-card={cue.cardId}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : motionTokens.duration.fast }}
      style={{ "--scene-duration": `${duration}ms` }}
    >
      <span className="combat-sr-only">{cue.announcement}</span>
      <div className="technique-scene-visual" aria-hidden="true">
        <div className="technique-art-frame">
          <LiveArt
            art={cue.art}
            alt={cue.alt}
            still={!!(reduced || shortened)}
          />
        </div>
        <div className="technique-film-shade" />
        <div className="technique-scene-copy">
          <span className="technique-kicker">
            {cue.finisher ? "FINISHER" : cue.discipline} <i /> {cue.nameEn}
          </span>
          <strong>{cue.name}</strong>
        </div>
        <div className="technique-results">
          {cue.results.map((result, index) => (
            <span
              key={`${result.kind}-${index}`}
              className={`result-${result.kind}`}
            >
              {result.text}
            </span>
          ))}
        </div>
        <div className="technique-scene-progress" />
      </div>
    </motion.div>
  );
}

export function ConditionGuide({ actor, name }) {
  const [selected, setSelected] = useState("normal");
  const condition = FIGHTER_STATES[selected];
  return (
    <div className="condition-guide">
      <p>
        체력과 마음의 변화가 선수의 표정·자세·대기 움직임에 드러납니다. 아래
        상태를 선택해 {name}의 모션을 미리 볼 수 있습니다.
      </p>
      <div className="condition-preview" data-condition={condition.id}>
        <FighterSprite
          actor={actor}
          condition={condition}
          name={name}
          side="preview"
        />
        <div className="condition-preview-copy">
          <div className="condition-face-heading">
            <LiveArt
              art={fighterPoseArt(actor, condition)}
              alt={`${name} · ${condition.label} 표정 확대`}
              className="condition-face-portrait"
              condition={condition.id}
              portrait
              position={[0.5, 0]}
            />
            <div>
              <span>{condition.subtitle}</span>
              <h3>{condition.label}</h3>
            </div>
          </div>
          <p>{condition.motion}</p>
        </div>
      </div>
      <div
        className="condition-options"
        role="group"
        aria-label="선수 상태 미리보기"
      >
        {Object.values(FIGHTER_STATES).map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={selected === item.id}
            aria-label={`${item.label} 모션 미리보기. ${item.rule}`}
            onClick={() => setSelected(item.id)}
          >
            <FighterCondition condition={item} />
            <span>{item.rule}</span>
          </button>
        ))}
      </div>
      <p className="condition-priority">
        체력이 25% 이하면 그로기, 50% 이하면 지침이 우선합니다. 그다음 압박 60
        이상, 열기 6 이상, 열기 3 이상 순서로 판단합니다. 미리보기는 실제 경기
        수치를 바꾸지 않습니다.
      </p>
    </div>
  );
}
