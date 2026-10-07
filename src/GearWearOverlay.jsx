import React, { useId } from "react";
import { gearWearProfile } from "./gear-wear.js";
import "./gear-wear.css";

// A shredded outer garment reveals its opaque athletic lining. Only authored
// side/hem patches may reveal skin; the drawing never removes coverage layers.
function GarmentTear({ zone, level, palette, id, index }) {
  const fabric = zone.fabric || palette.fabric;
  const edge = zone.thread || "#c5c3bd";
  const lining = zone.lining || palette.shadow;
  const opening = [0, 0.2, 0.5, 0.78, 1][level];
  const width = [0, 0.62, 0.82, 0.94, 1][level];
  const liningId = `${id}-lining-${index}`;
  const foldId = `${id}-fold-${index}`;
  const fill = zone.skin ? `url(#${id}-skin)` : `url(#${liningId})`;
  const tearPath =
    "M-47-24-33-31-27-24-14-40-2-32 18-41 22-29 41-34 36-17 48-13 40 0 47 15 33 17 40 32 21 28 13 43-1 33-19 42-23 29-40 33-34 15-48 17-40 3-48-8Z";
  return (
    <g
      data-gear-garment={zone.area}
      data-gear-coverage={zone.skin ? "side-skin" : "opaque-lining"}
    >
      <defs>
        <linearGradient id={liningId} x1="0" y1="0" x2=".15" y2="1">
          <stop offset="0" stopColor={palette.shadow} />
          <stop offset=".2" stopColor={lining} />
          <stop offset=".6" stopColor={lining} />
          <stop offset="1" stopColor={palette.shadow} />
        </linearGradient>
        <linearGradient id={foldId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fabric} />
          <stop offset=".48" stopColor={fabric} />
          <stop offset=".54" stopColor={palette.shadow} />
          <stop offset="1" stopColor={fabric} />
        </linearGradient>
      </defs>
      <g
        transform={`scale(${width} ${opening})`}
        data-gear-opening={level >= 2 ? "true" : undefined}
      >
        <path
          d={tearPath}
          fill={fill}
          stroke={palette.shadow}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {!zone.skin && (
          <path
            d="M-31-9 3-22M-25 6 22-13M-13 18 28 1M-5 29 22 15"
            fill="none"
            stroke={zone.thread || "#c5c3bd"}
            strokeWidth=".85"
            opacity=".2"
          />
        )}
        <path
          d={tearPath}
          fill="none"
          stroke={fabric}
          strokeWidth="2.5"
          strokeLinejoin="bevel"
        />
        <path
          d="M-45-23-33-29-26-22-14-38M1-32 17-39 21-27 40-32M-38 32-22 27-18 40-1 31M13 41 20 26 37 30"
          fill="none"
          stroke={edge}
          strokeWidth="1.2"
          opacity=".75"
        />
      </g>
      {level >= 2 && (
        <g
          data-gear-frayed="true"
          fill="none"
          stroke={zone.thread || "#dfd2bc"}
          strokeWidth="1.2"
          opacity=".85"
        >
          <path
            d={`M-34 ${-24 * opening}q-10-5-10-12M-14 ${-30 * opening}q-3-11 4-14M24 ${-26 * opening}q8-3 14-10M-27 ${26 * opening}q-6 6-5 13M10 ${29 * opening}q3 9 10 15M30 ${19 * opening}q8 4 13 1`}
          />
        </g>
      )}
      {level >= 3 && (
        <g data-gear-loose="true" data-gear-flap={zone.area}>
          <path
            d="M-32-19-14-33-7-21-20 1-25 11-33 2-28-6-38-10Z"
            fill={lining}
            stroke={palette.shadow}
            strokeWidth="2"
          />
          <path
            d="M-34-21-17-35-10-24-19-9-24 4-29-3-34 1-28-9-40-11Z"
            fill={`url(#${foldId})`}
            stroke={palette.shadow}
            strokeWidth="1.7"
          />
          <path
            d="M-33-20-18-31-13-23-24-2"
            fill="none"
            stroke={edge}
            strokeWidth="1.2"
            opacity=".65"
          />
          <path
            d="M15 15 30 6 44 15 38 31 43 38 35 45 31 38 25 41 27 28Z"
            fill={`url(#${foldId})`}
            stroke={palette.shadow}
            strokeWidth="2"
          />
          <path
            d="M18 15 31 10 40 16 33 31 36 37"
            fill="none"
            stroke={edge}
            strokeWidth="1.2"
            opacity=".65"
          />
        </g>
      )}
      {level === 4 && (
        <g
          data-gear-fragment="true"
          fill={fabric}
          stroke={edge}
          strokeWidth="1.6"
        >
          <path d="M-44 32-30 28-26 35-32 44-38 39-45 43Z" />
          <path d="M32-45 42-41 45-33 38-35 33-31 29-38Z" />
        </g>
      )}
    </g>
  );
}

// All geometry stays inside an authored equipment patch. The illustration and
// its overlay share one source rectangle, so fit, mirroring and impact motion
// can never separate a limb from its clothing.
function GearPatch({ zone, level, palette, id, index }) {
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
        {zone.kind === "garment" ? (
          <GarmentTear
            zone={zone}
            level={level}
            palette={palette}
            id={id}
            index={index}
          />
        ) : (
          <>
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
          </>
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
            index={index}
          />
        ))}
      </g>
    </svg>
  );
}
