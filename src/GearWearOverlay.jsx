import React, { useId } from "react";
import { gearWearProfile } from "./gear-wear.js";
import "./gear-wear.css";

// All geometry stays inside an authored equipment patch. The illustration and
// its overlay share one source rectangle, so fit, mirroring and impact motion
// can never separate a limb from its clothing.
function GearPatch({ zone, level, palette, id }) {
  const { x, y, width, height, angle = 0, minLevel = 1 } = zone;
  if (level < minLevel) return null;
  const openness = [0, 0, 0.5, 1, 1.45][level];
  const split = level >= 2 && zone.skin;
  const loose = level >= 3 && ["strap", "boot", "pad"].includes(zone.kind);
  const fabric = zone.fabric || palette.fabric;
  const accent = zone.accent || palette.accent;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${width / 100} ${height / 100})`}
      data-gear-part={zone.kind}
      data-gear-area={zone.area}
      className="gear-wear-patch"
    >
      <g clipPath={`url(#${id}-patch)`}>
        {split ? (
          <g transform={`scale(1 ${openness})`} data-gear-opening="true">
            <path
              d="M-43-17-30-23-19-16-8-27 3-19 17-23 25-13 43-17 33-3 40 8 25 15 12 11 2 23-13 16-27 22-33 9-44 6-35-5Z"
              fill={`url(#${id}-skin)`}
              stroke={palette.shadow}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M-41-18-30-25-19-18-8-29 3-21 17-25 25-15 43-19M-43 8-33 11-27 24-13 18 2 25 12 13 25 17 39 10"
              fill="none"
              stroke={fabric}
              strokeWidth="7"
              strokeLinejoin="bevel"
            />
            <path
              d="M-39-20-31-26-22-21M-14-24-8-31 1-24M13-25 17-28 24-18M-31 17-26 26-16 22M-5 22 2 27 8 21M21 19 29 18"
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
              opacity=".85"
            />
          </g>
        ) : (
          <g opacity={level === 1 ? 0.8 : 1}>
            <path
              d="M-38 6-20-4-12 1 5-9 17-6 35-19M-25 18-8 9 6 12 27-2"
              fill="none"
              stroke={palette.shadow}
              strokeWidth="6"
            />
            <path
              d="M-38 3-20-7-12-2 5-12 17-9 35-22M-25 15-8 6 6 9 27-5"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              opacity=".82"
            />
          </g>
        )}
        <path
          d={
            level >= 3
              ? "M-29-17-34-32M-11-23-15-39M16-21 22-35M28 11 36 29M-22 20-27 35M1 25 6 39"
              : "M-25-2-31-15M4-10 8-22M-10 11-14 24"
          }
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          opacity=".78"
        />
        {loose && (
          <g data-gear-loose="true">
            <path
              d="M14 2Q33 5 39 20L34 43 23 39 29 21Q25 14 9 13Z"
              fill={palette.shadow}
              opacity=".45"
            />
            <path
              d="M10-2Q30 1 35 17L29 39 24 35 19 38 16 33 24 16Q21 10 6 9Z"
              fill={fabric}
              stroke={palette.shadow}
              strokeWidth="2.5"
            />
            <path
              d="M12 1Q28 4 31 17L25 31"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              opacity=".9"
            />
            {level === 4 && (
              <path
                d="M-36 29-21 26-15 34-23 43-29 38-37 41Z"
                fill={fabric}
                stroke={accent}
                strokeWidth="1.5"
                data-gear-fragment="true"
              />
            )}
          </g>
        )}
      </g>
    </g>
  );
}

export function GearWearOverlay({
  actor,
  condition = "normal",
  vitals,
  gearLevel,
  anchors,
  mask,
  style,
}) {
  const id = `gear-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const profile = gearWearProfile(condition, vitals);
  const level = Number.isFinite(gearLevel)
    ? Math.max(0, Math.min(4, Math.floor(gearLevel)))
    : profile.level;
  if (!anchors || !level) return null;
  const [width, height] = anchors.viewBox;
  const { palette } = anchors;
  return (
    <svg
      className="gear-wear-overlay"
      style={style}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-gear-actor={actor}
      data-gear-level={level}
      data-gear-condition={condition}
    >
      <defs>
        <clipPath id={`${id}-patch`}>
          <rect x="-49" y="-49" width="98" height="98" />
        </clipPath>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={palette.shadow} />
          <stop offset=".2" stopColor={palette.skin} />
          <stop offset=".75" stopColor={palette.skin} />
          <stop offset="1" stopColor={palette.shadow} />
        </linearGradient>
        {mask && (
          <mask
            id={`${id}-silhouette`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={width}
            height={height}
            style={{ maskType: "alpha" }}
          >
            <image
              href={mask.src}
              x={mask.x || 0}
              y={mask.y || 0}
              width={mask.width}
              height={mask.height}
              preserveAspectRatio="none"
            />
          </mask>
        )}
      </defs>
      <g mask={mask ? `url(#${id}-silhouette)` : undefined}>
        {anchors.zones.map((zone, index) => (
          <GearPatch
            key={index}
            zone={zone}
            level={level}
            palette={palette}
            id={id}
          />
        ))}
      </g>
    </svg>
  );
}
