import React from "react";
import "./combat-contact-art.css";

// The parent stage positions and fades this single contact on its cue clock.
// Strike, mat impact, guard and joint pressure retain different silhouettes.
export function CombatContactArt() {
  return (
    <svg
      className="combat-contact-art"
      viewBox="-50 -50 100 100"
      focusable="false"
    >
      <g className="contact-hit">
        <path
          className="contact-gold"
          d="M0-47 6-19 24-38 17-13 46-16 22 0 48 12 21 15 33 44 9 26-2 49-9 24-35 39-22 13-48 11-21-3-40-29-14-16-19-46-3-21Z"
        />
        <path
          className="contact-white"
          d="M0-29 5-10 22-16 11-1 26 12 8 8-3 31-8 10-25 15-13-2-25-15-9-9Z"
        />
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            className="contact-spark"
            d="M-1-35 1-35 0-49Z"
            transform={`rotate(${i * 36 + 8})`}
          />
        ))}
      </g>
      <g className="contact-mat">
        <path
          className="contact-dust"
          d="M-45 12Q-48-5-34-6Q-29-23-15-11Q-4-34 6-14Q24-25 30-7Q48-5 44 12Z"
        />
        <path
          className="contact-gold"
          d="M0-40 7-14 28-27 17-5 48 8 19 12 40 29 8 20 0 31-9 20-42 28-22 12-49 8-18-5-26-27-7-14Z"
        />
        <path
          className="contact-white"
          d="M0-24 6-5 20-13 11 3 33 11 8 12-2 22-9 12-32 12-12 2-18-12-6-4Z"
        />
        <path
          className="contact-chip"
          d="M-43-15-38-19-33-13-40-10ZM29-23 34-30 41-26 37-18ZM-27 24-21 21-16 29-22 31ZM39 22 44 20 48 27 42 30Z"
        />
      </g>
      <g className="contact-hold">
        <path
          className="contact-gold"
          d="M-24-13-14-17-10-5-16 3-22-2ZM24-13 14-17 10-5 16 3 22-2ZM-22 12-15 7-9 16-13 23-22 20ZM22 12 15 7 9 16 13 23 22 20Z"
        />
        <path
          className="contact-pressure"
          d="M-32-22-24-15M32-22 24-15M-30 29-23 21M30 29 23 21"
        />
      </g>
      <g className="contact-guard">
        <path
          className="contact-pressure"
          d="M-7-37Q-25 0-7 37M-16-27Q-30 0-16 27"
        />
        <path
          className="contact-gold"
          d="M3-24 9-8 25-15 15 1 29 13 11 9 4 28-2 11-20 20-11 2-22-10-4-7Z"
        />
        <path
          className="contact-white"
          d="M4-13 9-1 18 5 7 9 3 17-1 7-11 3 0-3Z"
        />
      </g>
    </svg>
  );
}
