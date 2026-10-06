import React, { useId } from "react";
import {
  fighterWearAnchors,
  fighterWearProfile,
  skinMoistureGeometry,
} from "./fighter-wear.js";
import "./fighter-wear.css";

function SweatBead({ x, y, size = 1, id }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      className="wear-sweat-bead"
    >
      <ellipse
        cx="0"
        cy="0"
        rx="3.3"
        ry="4.4"
        fill={`url(#${id}-bead)`}
        stroke="#79634c"
        strokeOpacity=".2"
        strokeWidth=".65"
      />
      <path
        d="M-2 -1.8 Q-1.4 -3.7 .4 -3.1"
        fill="none"
        stroke="#fffaf1"
        strokeOpacity=".9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M-.9 3.5 Q1.3 4 2.2 2"
        fill="none"
        stroke="#745744"
        strokeOpacity=".22"
        strokeWidth=".8"
        strokeLinecap="round"
      />
    </g>
  );
}

function WetStreak({ x, y, length, bend, width, id }) {
  const path = `M${x} ${y} C${x + bend * 0.2} ${y + length * 0.32} ${x + bend} ${y + length * 0.62} ${x + bend} ${y + length}`;
  return (
    <g className="wear-wet-streak">
      <path
        d={path}
        fill="none"
        stroke="#876e55"
        strokeOpacity=".14"
        strokeWidth={width + 1.4}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke={`url(#${id}-streak)`}
        strokeWidth={width}
        strokeLinecap="round"
      />
      <SweatBead x={x + bend} y={y + length + 1.5} size=".55" id={id} />
    </g>
  );
}

function SkinMoisture({ surface, sweat, id, delay = 0 }) {
  const moisture = skinMoistureGeometry(surface, sweat);
  return (
    <g
      className="wear-skin-moisture"
      data-moisture-surface={surface}
      style={{ "--wear-delay": `${delay}s` }}
    >
      <g className="wear-skin-film" opacity={moisture.filmOpacity}>
        {moisture.sheen.map((patch, index) => (
          <ellipse
            key={index}
            cx={patch.x}
            cy={patch.y}
            rx={patch.rx}
            ry={patch.ry}
            transform={`rotate(${patch.tilt} ${patch.x} ${patch.y})`}
            fill={`url(#${id}-skin-film)`}
          />
        ))}
      </g>
      <g
        className="wear-moisture-catchlight"
        opacity={moisture.specularOpacity}
      >
        {surface === "shoulder" ? (
          <>
            <path
              d="M-15 0 C-12 -11 -5 -16 1 -14 C-5 -9 -8 -2 -8 8Z"
              fill={`url(#${id}-specular)`}
            />
            <path
              d="M4 41 C1 49 3 64 6 68 C7 58 8 47 4 41Z"
              fill={`url(#${id}-specular)`}
            />
          </>
        ) : (
          <>
            <path
              d="M30 -12 Q34 -19 38 -17 Q35 -10 31 -6Z"
              fill={`url(#${id}-specular)`}
            />
            <path
              d="M-31 -13 Q-25 -17 -22 -13 Q-25 -9 -30 -7Z"
              fill={`url(#${id}-specular)`}
            />
          </>
        )}
      </g>
      {moisture.streaks.map((streak, index) => (
        <WetStreak key={index} {...streak} id={id} />
      ))}
      {moisture.beads.map((bead, index) => (
        <SweatBead key={index} {...bead} id={id} />
      ))}
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
      data-wear-sheen="skin-specular"
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
        <radialGradient id={`${id}-skin-film`} cx="42%" cy="37%" r="62%">
          <stop offset="0" stopColor="#fff7e8" stopOpacity=".8" />
          <stop offset=".35" stopColor="#fff1db" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff4e4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-specular`} x1="0" y1="0" x2=".65" y2="1">
          <stop offset="0" stopColor="#fffdf7" stopOpacity=".12" />
          <stop offset=".4" stopColor="#fffdf7" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffeed3" stopOpacity=".08" />
        </linearGradient>
        <radialGradient id={`${id}-bead`} cx="35%" cy="27%" r="73%">
          <stop offset="0" stopColor="#fffdf7" stopOpacity=".36" />
          <stop offset=".48" stopColor="#fff5e5" stopOpacity=".05" />
          <stop offset="1" stopColor="#bda386" stopOpacity=".13" />
        </radialGradient>
        <linearGradient id={`${id}-streak`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8ec" stopOpacity="0" />
          <stop offset=".25" stopColor="#fff8ec" stopOpacity=".64" />
          <stop offset=".72" stopColor="#fff8ec" stopOpacity=".36" />
          <stop offset="1" stopColor="#fff8ec" stopOpacity=".55" />
        </linearGradient>
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
        {anchors.shoulders.map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            <SkinMoisture
              surface="shoulder"
              sweat={profile.sweat}
              id={id}
              delay={index ? -2.6 : -0.8}
            />
          </g>
        ))}
        <g
          transform={`translate(${faceX} ${faceY}) rotate(${anchors.tilt}) scale(${anchors.faceScaleX} 1)`}
        >
          <SkinMoisture
            surface="face"
            sweat={profile.sweat}
            id={id}
            delay={-1.7}
          />
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
        </g>
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
