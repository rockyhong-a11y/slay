"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { Fire, Heartbeat, Shield, Sparkle } from "@phosphor-icons/react";
import { FIGHTER_STATES, fighterPoseArt } from "./presentation.js";
import "./combat-presentation.css";
import { Artwork } from "./Artwork.jsx";
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
            ? `${condition.rule}. 컨디션과 표정 보기`
            : condition.rule
      }
      aria-label={
        onClick
          ? `현재 선수 상태: ${condition.label}. 컨디션과 표정 보기`
          : `${enemy ? "상대" : "선수"} 상태: ${condition.label}`
      }
    >
      <Icon size={12} weight="fill" />
      <span>{condition.label}</span>
    </Element>
  );
}

export function FighterSprite({ actor, condition, name, side }) {
  const requested = fighterPoseArt(actor, condition);
  return (
    <div className={`fighter ${side}-fighter`} data-condition={condition.id}>
      <div className="fighter-sprite-frame">
        <Artwork
          art={requested}
          alt={`${name} · ${condition.label} 자세`}
          className="fighter-pose"
          condition={condition.id}
          mirrored={side === "enemy"}
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
  const still = reduced || shortened;
  const duration = still ? 650 : cue.duration;
  const camera = cue.camera;
  useEffect(() => {
    const timer = setTimeout(() => complete.current(cue.id), duration);
    return () => clearTimeout(timer);
  }, [cue.id, duration]);
  const scene = (
    <motion.div
      className={`technique-scene scene-${cue.disciplineSlug} ${cue.finisher ? "scene-finisher" : ""} ${still ? "scene-still" : ""}`}
      data-card={cue.cardId}
      data-motion={camera.kind}
      data-duration={duration}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : motionTokens.duration.fast }}
      style={{
        "--scene-duration": `${duration}ms`,
        "--portrait-ratio": 1.5 * camera.portrait.field,
        "--portrait-focus": camera.portrait.center
          .map((value) => `${value * 100}%`)
          .join(" "),
      }}
    >
      <span className="combat-sr-only">{cue.announcement}</span>
      <div className="technique-backdrop" aria-hidden="true">
        <Artwork art={cue.art} alt="" fit="cover" />
      </div>
      <div className="technique-film-shade" aria-hidden="true" />
      <div className="technique-broadcast-head" aria-hidden="true">
        <strong>
          SLAY<span> / </span>
          {cue.finisher ? "MAIN EVENT" : "RINGSIDE"}
        </strong>
        <span>
          {still ? "TECHNIQUE" : "REPLAY"} <i /> {cue.discipline}
        </span>
      </div>
      <div className="technique-scene-visual" aria-hidden="true">
        <div className="technique-art-stage">
          <div className="technique-art-window">
            <motion.div
              className="technique-art-frame"
              initial={false}
              animate={
                still
                  ? { x: 0, y: 0, scale: 1, rotate: 0 }
                  : {
                      x: camera.x,
                      y: camera.y,
                      scale: camera.scale,
                      rotate: camera.rotate,
                    }
              }
              transition={{
                duration: duration / 1000,
                times: camera.times,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: camera.origin }}
            >
              <Artwork art={cue.art} alt={cue.alt} />
            </motion.div>
            {!still &&
              camera.impacts.map((at, index) => (
                <motion.div
                  key={index}
                  className={`technique-impact ${camera.heavy ? "impact-heavy" : ""} ${camera.pressure ? "impact-pressure" : ""}`}
                  initial={{ opacity: 0, scale: 0.55 }}
                  animate={{
                    opacity: [0, 0, camera.pressure ? 0.25 : 0.55, 0],
                    scale: [0.55, 0.55, 1, 1.35],
                  }}
                  transition={{
                    duration: duration / 1000,
                    times: [
                      0,
                      Math.max(0.01, at - 0.015),
                      at,
                      Math.min(1, at + 0.11),
                    ],
                  }}
                  style={{
                    left: camera.origin.split(" ")[0],
                    top: camera.origin.split(" ")[1],
                  }}
                />
              ))}
          </div>
          <div className="technique-phase-track">
            {camera.phases.map((phase, index) => (
              <span key={phase}>
                <small>0{index + 1}</small>
                {phase}
              </span>
            ))}
          </div>
        </div>
        <div className="technique-caption-panel">
          <div className="technique-scene-copy">
            <span className="technique-kicker">
              {cue.finisher ? "FINISHER" : cue.discipline}
              <i />
              {cue.nameEn}
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
        </div>
      </div>
      <div className="technique-scene-progress" aria-hidden="true" />
    </motion.div>
  );
  return createPortal(scene, document.body);
}

export function ConditionGuide({ actor, name }) {
  const [selected, setSelected] = useState("normal");
  const condition = FIGHTER_STATES[selected];
  return (
    <div className="condition-guide">
      <p>
        체력과 마음의 변화가 선수의 표정과 자세에 드러납니다. 아래 상태를 선택해{" "}
        {name}의 완성된 상태별 일러스트를 미리 볼 수 있습니다.
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
            <Artwork
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
          <p>{condition.description}</p>
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
            aria-label={`${item.label} 표정과 자세 미리보기. ${item.rule}`}
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
