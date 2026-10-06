import React, { useId } from "react";
import { fighterWearAnchors, fighterWearProfile } from "./fighter-wear.js";
import "./fighter-wear.css";

function SweatDrop({ x, y, size = 1, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <g className="wear-sweat-drop" style={{ "--wear-delay": `${delay}s` }}>
        <path
          d="M0 -12 C-1 -5 -5 0 -5 5 C-5 12 5 12 5 5 C5 0 1 -5 0 -12Z"
          fill="#bfe8f1"
          fillOpacity=".58"
          stroke="#526b72"
          strokeOpacity=".55"
          strokeWidth="1.5"
        />
        <path
          d="M-1 -5 C-1 0 -3 3 -2 7"
          fill="none"
          stroke="#fff6e4"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function Scuff({ x = 0, y = 0, size = 1, heavy = false, warm = false }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-13) scale(${size})`}>
      <path
        d="M-18 -4 Q-6 -16 15 -6 L19 3 Q5 11 -15 5Z"
        fill={warm ? "#c27d71" : "#b95a62"}
        opacity={heavy ? ".35" : ".22"}
      />
      <path
        d="M-13 -2 l15 -3 M-7 4 l16 -3 M1 -8 l11 -2"
        fill="none"
        stroke={warm ? "#733c49" : "#88434e"}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity=".85"
      />
      <path
        d="M-11 0 l12 -2 M-5 6 l11 -2"
        fill="none"
        stroke="#f9be9e"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity=".65"
      />
    </g>
  );
}

export function FighterWear({ art, src, crop, rect, vitals }) {
  const rawId = useId();
  const id = `wear-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const anchors = fighterWearAnchors(art, crop);
  if (!anchors || !rect) return null;
  const profile = fighterWearProfile(anchors.condition, vitals);
  if (!profile.visible) return null;
  const warm = anchors.palette === "warm";
  const [faceX, faceY] = anchors.face;
  return (
    <svg
      className="fighter-wear"
      style={rect}
      viewBox="0 0 1000 1500"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-wear-state={profile.condition}
      data-wear-sweat={profile.sweat}
      data-wear-abrasion={profile.abrasion}
      data-wear-bruise={profile.bruise}
      data-wear-blood={profile.blood}
    >
      <defs>
        <mask
          id={`${id}-silhouette`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1000"
          height="1500"
          style={{ maskType: "alpha" }}
        >
          <image href={src} x="0" y="0" width="1000" height="1500" />
        </mask>
        <radialGradient id={`${id}-bruise`}>
          <stop
            offset="0"
            stopColor={warm ? "#59374e" : "#713c63"}
            stopOpacity=".64"
          />
          <stop
            offset=".58"
            stopColor={warm ? "#8c515c" : "#a95572"}
            stopOpacity=".43"
          />
          <stop offset="1" stopColor="#c17479" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask={`url(#${id}-silhouette)`}>
        <g
          transform={`translate(${faceX} ${faceY}) rotate(${anchors.tilt}) scale(${anchors.faceScaleX} 1)`}
        >
          {profile.bruise > 0 && (
            <ellipse
              cx="-31"
              cy="6"
              rx={profile.bruise === 2 ? 29 : 22}
              ry="15"
              fill={`url(#${id}-bruise)`}
            />
          )}
          {profile.abrasion > 0 && (
            <Scuff
              x="32"
              y="10"
              size={profile.abrasion === 3 ? 1.05 : 0.85}
              heavy={profile.abrasion > 1}
              warm={warm}
            />
          )}
          {profile.abrasion > 1 && (
            <Scuff x="-25" y="22" size=".6" warm={warm} />
          )}
          {profile.blood > 0 && (
            <g className="wear-blood-traces">
              <path
                d="M24 -27 l14 -4 -7 5 2 10 -3 13 -3 -3 1 -16Z"
                fill="#a32135"
                stroke="#651e2c"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M26 -26 l8 -2"
                fill="none"
                stroke="#f17473"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {profile.blood > 1 && (
                <path
                  d="M8 29 l8 1 -3 5 2 8 -3 6 -2 -3 1 -9 -5 -3Z"
                  fill="#a32135"
                  stroke="#651e2c"
                  strokeWidth="1"
                />
              )}
            </g>
          )}
          {profile.sweat > 0 && <SweatDrop x="45" y="-3" size=".78" />}
          {profile.sweat > 1 && (
            <SweatDrop x="-42" y="-3" size=".65" delay="-.9" />
          )}
          {profile.sweat > 2 && (
            <>
              <SweatDrop x="14" y="-48" size=".7" delay="-1.7" />
              <SweatDrop x="-34" y="30" size=".55" delay="-2.4" />
            </>
          )}
        </g>
        {profile.sweat > 0 &&
          anchors.shoulders.map(([x, y], index) => (
            <g key={index}>
              <SweatDrop
                x={x}
                y={y}
                size={profile.sweat > 1 ? 1.35 : 1}
                delay={index ? "-1.2" : "-.4"}
              />
              {profile.sweat > 1 && (
                <SweatDrop
                  x={x + (index ? 12 : -12)}
                  y={y + 45}
                  size=".85"
                  delay={index ? "-2.2" : "-1.5"}
                />
              )}
              {profile.sweat > 2 && (
                <SweatDrop
                  x={x + (index ? -15 : 14)}
                  y={y + 89}
                  size="1.15"
                  delay={index ? "-.8" : "-2.7"}
                />
              )}
            </g>
          ))}
        {profile.abrasion > 1 && (
          <Scuff
            x={anchors.shoulders[0][0] + 10}
            y={anchors.shoulders[0][1] + 39}
            size="1.8"
            heavy={profile.abrasion > 2}
            warm={warm}
          />
        )}
        {profile.bruise > 1 && (
          <ellipse
            cx={anchors.shoulders[1][0]}
            cy={anchors.shoulders[1][1] + 63}
            rx="30"
            ry="23"
            fill={`url(#${id}-bruise)`}
          />
        )}
      </g>
    </svg>
  );
}
