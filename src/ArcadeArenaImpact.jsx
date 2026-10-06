import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
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
  useEffect(() => {
    const contact = setTimeout(
      () => callbacks.current.onContact?.(cue),
      still ? 40 : duration * 0.29,
    );
    const finish = setTimeout(
      () => callbacks.current.onComplete?.(cue.id),
      duration,
    );
    return () => {
      clearTimeout(contact);
      clearTimeout(finish);
    };
  }, [cue.id, duration, still]);
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
      style={{ "--impact-duration": `${duration}ms` }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="combat-sr-only">{cue.announcement}</span>
      {!still && <div className="arcade-arena-vignette" aria-hidden="true" />}
      <div className="arena-contact" aria-hidden="true">
        {!still && (
          <>
            <div className="arcade-contact-aura" />
            {family === "submission" || family === "grip" ? (
              <svg
                className="arcade-contact-glyph arcade-joint-lock"
                viewBox="0 0 240 240"
              >
                <circle cx="120" cy="120" r="72" />
                <circle cx="120" cy="120" r="53" />
                <path d="M56 100 L82 108 L68 127 L99 123 M178 139 L159 124 L177 110 L146 111 M115 47 L107 72 L125 65 L122 96 M137 183 L128 160 L111 175 L111 143" />
                <path
                  className="arcade-lock-bracket"
                  d="M52 77 V52 H77 M163 52 H188 V77 M188 163 V188 H163 M77 188 H52 V163"
                />
              </svg>
            ) : family === "guard" ? (
              <svg
                className="arcade-contact-glyph arcade-guard-ripple"
                viewBox="0 0 240 240"
              >
                <path d="M120 35 L182 61 V116 Q180 164 120 204 Q60 164 58 116 V61 Z" />
                <path d="M92 118 L114 141 L151 94" />
                <path
                  className="arcade-guard-edge"
                  d="M42 73 Q12 120 46 168 M198 73 Q228 120 194 168"
                />
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
