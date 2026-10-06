import React from "react";
import { useReducedMotion } from "motion/react";
import { UsersThree } from "@phosphor-icons/react";
import "./crowd-atmosphere.css";

const spectators = Array.from({ length: 30 }, (_, i) => ({
  x: 12 + i * 34,
  y: 28 + (i % 3) * 12,
  scale: 0.66 + (i % 4) * 0.08,
  delay: (i % 7) * 0.09,
  color: ["#172031", "#30222e", "#283035", "#2d2923"][i % 4],
}));

export function CrowdCallout({ reaction, compact = false }) {
  if (!reaction) return null;
  return (
    <div
      className={`crowd-callout crowd-${reaction.kind} ${compact ? "crowd-compact" : ""}`}
      data-crowd-reaction={reaction.kind}
    >
      <UsersThree size={18} weight="fill" />
      <div>
        <span>{reaction.label}</span>
        <strong>{reaction.chant}</strong>
      </div>
      <span className="crowd-meter" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} style={{ "--bar": i }} />
        ))}
      </span>
    </div>
  );
}

export function CrowdAtmosphere({ reaction, shortened = false }) {
  const reduced = useReducedMotion();
  if (!reaction) return null;
  return (
    <div
      className={`crowd-atmosphere crowd-${reaction.kind} ${reduced || shortened ? "crowd-still" : ""}`}
      key={reaction.id}
      aria-hidden="true"
      style={{ "--crowd-duration": `${reaction.duration}ms` }}
    >
      <div className="crowd-light-wash" />
      <svg
        className="crowd-ringside"
        viewBox="0 0 1040 110"
        preserveAspectRatio="none"
      >
        {spectators.map((fan, i) => (
          <g
            key={i}
            transform={`translate(${fan.x},${fan.y}) scale(${fan.scale})`}
          >
            <g
              className="crowd-fan"
              style={{ "--fan-delay": `${fan.delay}s`, fill: fan.color }}
            >
              <path d="M-13 64 L-11 24 Q0 15 11 24 L14 64Z" />
              <circle cx="0" cy="10" r="8" />
              <path
                className="crowd-arm left"
                d="M-9 28 L-22 13 L-25 -4"
                fill="none"
                stroke={fan.color}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                className="crowd-arm right"
                d="M9 28 L22 13 L25 -4"
                fill="none"
                stroke={fan.color}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {i % 6 === 2 && (
                <rect
                  x="-20"
                  y="-18"
                  width="40"
                  height="25"
                  rx="2"
                  fill="#e7d7b6"
                  opacity=".9"
                />
              )}
            </g>
          </g>
        ))}
      </svg>
      <div className="arena-crowd-caption">
        <CrowdCallout reaction={reaction} compact />
      </div>
    </div>
  );
}
