import React, { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cuePlayback, scheduleCueEvents } from "./cue-timing.js";
import "./arcade-arena-impact.css";

const rays = Array.from({ length: 14 }, (_, index) => index * (360 / 14));
const rubble = Array.from({ length: 9 }, (_, index) => ({
  x: (index - 4) * 27,
  y: -25 - ((index * 17) % 60),
  rotation: index * 47,
}));

/** Contact presentation only. The engine has already resolved the action. */
export function ArcadeArenaImpact({
  cue,
  onComplete,
  onContact,
  shortened = false,
}) {
  const reduced = useReducedMotion();
  const callbacks = useRef({ onComplete, onContact });
  callbacks.current = { onComplete, onContact };
  const still = reduced || shortened;
  const duration = still ? 650 : cue.duration;
  const playback = useMemo(
    () => cuePlayback(cue, duration, performance.now()),
    [cue.id, duration],
  );
  const delivered = useMemo(() => new Set(), [cue.id]);
  useEffect(() => {
    return scheduleCueEvents(
      cuePlayback(playback, duration, performance.now()),
      [{ key: "contact", at: still ? 40 : duration * 0.29 }],
      (key) => {
        if (key === "complete") callbacks.current.onComplete?.(cue.id);
        else callbacks.current.onContact?.(cue);
      },
      { delivered },
    );
  }, [cue.id, duration, still, playback, delivered]);
  const guard = !cue.damage;
  const family = guard
    ? "guard"
    : cue.pressure
      ? "submission"
      : cue.throwing
        ? "slam"
        : cue.effectFamily === "grapple"
          ? "grip"
          : "strike";
  return (
    <div
      className={`arena-impact arcade-arena-impact arcade-contact-${family} arena-impact-${cue.target} ${cue.heavy ? "arcade-heavy" : ""} ${cue.knockout ? "arcade-knockout" : ""} ${still ? "arcade-still" : ""}`}
      data-impact-id={cue.id}
      data-impact-family={family}
      data-damage={cue.damage}
      data-blocked={cue.blocked}
      data-duration={duration}
      style={{
        "--impact-duration": `${duration}ms`,
        "--impact-delay": playback.cssDelay,
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="combat-sr-only">{cue.announcement}</span>
      {!still && <div className="arcade-arena-vignette" aria-hidden="true" />}
      <div className="arena-contact" aria-hidden="true">
        {!still && (
          <>
            <div className="arcade-contact-flare" />
            {family === "submission" || family === "grip" ? (
              <svg
                className="arcade-contact-glyph arcade-joint-pressure"
                viewBox="0 0 240 240"
              >
                <path
                  className="arcade-pressure-shell"
                  d="M120 78L131 108L160 96L142 122L164 141L132 136L118 168L109 136L77 146L98 120L78 101L109 108Z"
                />
                <path
                  className="arcade-white-core"
                  d="M119 99L128 116L144 122L128 130L118 147L111 131L94 121L111 114Z"
                />
                <path
                  className="arcade-pressure-ticks"
                  d="M65 65L89 92M175 65L152 92M58 134L83 129M181 144L158 134M118 186V163"
                />
              </svg>
            ) : family === "guard" ? (
              <svg
                className="arcade-contact-glyph arcade-guard-brace"
                viewBox="0 0 240 240"
              >
                <path
                  className="arcade-guard-contact"
                  d="M120 54L134 103L185 81L154 122L193 151L140 140L119 192L106 140L56 162L86 121L44 91L105 105Z"
                />
                <path d="M63 49Q108 70 150 158M48 74Q84 94 107 154M177 68L155 90M185 127L164 123M138 184L130 165" />
              </svg>
            ) : (
              <svg
                className="arcade-contact-glyph arcade-impact-bloom"
                viewBox="0 0 240 240"
              >
                <path
                  className="arcade-fire-shell"
                  d="M121 18 L133 76 L173 35 L157 87 L222 80 L170 114 L232 141 L168 146 L194 211 L143 173 L117 236 L102 171 L43 210 L73 151 L7 145 L70 116 L24 66 L92 86 L80 23 L115 77 Z"
                />
                <path
                  className="arcade-white-core"
                  d="M121 58 L134 103 L178 87 L146 120 L184 149 L137 140 L116 185 L107 140 L57 153 L94 119 L67 91 L108 105 Z"
                />
              </svg>
            )}
            {family !== "submission" &&
              family !== "grip" &&
              rays.map((angle, index) => (
                <i
                  className="arcade-contact-spark"
                  key={angle}
                  style={{
                    "--spark-angle": `${angle}deg`,
                    "--spark-length": `${46 + (index % 4) * 18}px`,
                  }}
                />
              ))}
            {family === "slam" && (
              <div className="arcade-mat-shock">
                <span />
                <span />
                {rubble.map((piece, index) => (
                  <i
                    key={index}
                    style={{
                      "--debris-x": `${piece.x}px`,
                      "--debris-y": `${piece.y}px`,
                      "--debris-r": `${piece.rotation}deg`,
                    }}
                  />
                ))}
                <b />
                <b />
                <b />
              </div>
            )}
          </>
        )}
        <div className="arcade-contact-score">
          <small>
            {cue.knockout ? "K.O." : guard ? "COUNTER GUARD" : cue.label}
          </small>
          <strong>{guard ? "BLOCK" : `−${cue.damage}`}</strong>
          {cue.blocked > 0 && <span>가드 흡수 {cue.blocked}</span>}
          {cue.combo > 1 && cue.damage > 0 && <b>{cue.combo} COMBO</b>}
        </div>
      </div>
      {cue.knockout && (
        <span className="arcade-ko-stamp" aria-hidden="true">
          KNOCKOUT
        </span>
      )}
    </div>
  );
}
