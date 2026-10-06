import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  artworkProjection,
  projectedArtworkPoint,
  techniqueEffectLayers,
} from "./technique-effects.js";
import "./arcade-technique-fx.css";

const rays = Array.from({ length: 10 }, (_, index) => index * 36);
const motes = [
  [18, 78, 3],
  [35, 43, 2],
  [72, 64, 2.8],
  [52, 20, 2],
  [84, 25, 1.8],
  [12, 29, 1.5],
  [66, 87, 2],
  [42, 68, 1.4],
];

function Trace({ d, item, transition, still, className = "" }) {
  return (
    <motion.path
      className={className}
      d={d}
      initial={still ? false : { pathLength: item.pathLength?.[0] ?? 1 }}
      animate={still ? { pathLength: 1 } : { pathLength: item.pathLength ?? 1 }}
      transition={transition}
    />
  );
}

// The SVGs are original procedural graphics. All movement belongs to the
// parent replay clock, including the traced lift, so nothing loops or drifts.
function EffectGraphic({ item, effect, transition, still }) {
  const { kind } = item;
  if (kind === "lift" || kind === "arc") {
    const start = effect.grip || effect.target;
    const [sx, sy] = start.map((value) => value * 100);
    const [tx, ty] = effect.target.map((value) => value * 100);
    const apex = Math.max(6, sy - (kind === "lift" ? 25 : 31));
    const bend = kind === "lift" ? sx : sx + effect.direction * 25;
    const path = `M${sx} ${sy} C${sx - effect.direction * 12} ${apex},${bend} ${apex},${tx} ${ty}`;
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Trace
          d={path}
          item={item}
          transition={transition}
          still={still}
          className="arcade-energy-trace-halo"
        />
        <Trace
          d={path}
          item={item}
          transition={transition}
          still={still}
          className="arcade-energy-trace"
        />
        <Trace
          d={path}
          item={item}
          transition={transition}
          still={still}
          className="arcade-energy-trace-core"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 100 100"
      className="arcade-effect-glyph"
      preserveAspectRatio={
        kind === "streak" || kind === "guard-rail" ? "none" : "xMidYMid meet"
      }
    >
      {kind === "streak" ? (
        <g className="arcade-fire-trail">
          <path
            className="arcade-fire-halo"
            d="M2 48Q20 33 35 40L22 23Q44 34 54 40L46 20Q63 33 69 39L82 29L96 49L78 64L64 60L70 81L44 63L23 71L33 56L1 61L16 50Z"
          />
          <path
            className="arcade-fire-flame"
            d="M7 49L38 44L28 35L58 44L52 32L78 44L94 49L75 57L53 54L39 61L45 52L11 58L29 49Z"
          />
          <path
            className="arcade-fire-white"
            d="M25 49L71 47L93 50L70 53L44 50L25 53Z"
          />
          <path
            className="arcade-trail-stroke"
            d="M0 37L31 40M7 66L29 62M39 21L49 31"
          />
        </g>
      ) : kind === "burst" ? (
        <g>
          <path
            className="arcade-burst-outer"
            d="M50 1L56 33L79 13L66 39L98 34L70 49L96 65L65 61L76 91L55 70L48 99L43 69L18 88L33 61L2 67L29 50L3 33L34 39L22 10L43 33Z"
          />
          <path
            className="arcade-burst-inner"
            d="M50 17L55 41L73 29L62 45L84 50L61 56L69 77L53 62L47 86L43 61L26 71L37 55L16 49L39 44L31 25L45 40Z"
          />
          <circle className="arcade-burst-core" cx="50" cy="50" r="10" />
        </g>
      ) : kind === "embers" ? (
        <g className="arcade-embers">
          {rays.map((angle, index) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <path
                d={`M${48 + (index % 2)} ${9 + (index % 3) * 3}L50 ${24 + (index % 2) * 3}L52 ${12 + (index % 3) * 3}L50 ${3 + (index % 2) * 3}Z`}
              />
              <circle
                cx="57"
                cy={25 + (index % 3) * 4}
                r={index % 2 ? 1 : 1.6}
              />
            </g>
          ))}
        </g>
      ) : kind === "grip" || kind === "clamp" ? (
        <g
          className={`arcade-lock-bracket ${kind === "grip" ? "arcade-grip-bracket" : ""}`}
        >
          <path
            className="arcade-bracket-halo"
            d="M72 12L40 12L21 31V69L40 88H72"
          />
          <path d="M68 17H42L27 33V67L42 83H68M40 39L34 50L40 61" />
          <path
            className="arcade-lock-electric"
            d="M52 5L41 19L52 29L40 43M52 94L43 80L51 72"
          />
        </g>
      ) : kind === "tension" ? (
        <g className="arcade-joint-electric">
          <path d="M6 50L20 37L26 58L37 36L44 58L51 39L60 62L68 39L79 54L94 47" />
          <path
            className="arcade-electric-secondary"
            d="M12 61L26 49L36 70L48 54M61 35L73 28L84 43"
          />
        </g>
      ) : kind === "electric-lock" ? (
        <g className="arcade-joint-electric">
          <path d="M19 62L9 49L20 44L15 27L31 30L35 14L49 21L60 10L65 25L82 22L78 39L93 47L82 55L88 68L71 66" />
          <path
            className="arcade-electric-secondary"
            d="M27 75L33 88L45 79L54 91L61 76L74 82L77 65M32 20L35 31L26 38"
          />
        </g>
      ) : kind === "pressure" ? (
        <g className="arcade-pressure-ring">
          <circle cx="50" cy="50" r="37" />
          <circle cx="50" cy="50" r="43" strokeDasharray="40 16 12 20" />
          <path
            className="arcade-pressure-inner"
            d="M24 42A27 27 0 0 1 65 26M76 59A27 27 0 0 1 35 74M23 36L23 45L32 45M77 64L77 55L68 55"
          />
        </g>
      ) : kind === "target" ? (
        <g className="arcade-target-lock">
          <path d="M18 37V18H37M63 18H82V37M82 63V82H63M37 82H18V63" />
          <circle cx="50" cy="50" r="18" />
          <path d="M50 24V35M50 65V76M24 50H35M65 50H76" />
        </g>
      ) : kind === "shield" ? (
        <g className="arcade-shield">
          <path
            className="arcade-shield-glass"
            d="M50 5L86 24V54Q85 80 50 96Q15 80 14 54V24Z"
          />
          <path d="M50 5L86 24V54Q85 80 50 96Q15 80 14 54V24ZM50 15L76 29V53Q75 73 50 85Q25 73 24 53V29Z" />
          <path
            className="arcade-shield-strut"
            d="M50 16V85M25 31L74 70M75 31L26 70M25 49H75"
          />
        </g>
      ) : kind === "shield-ripple" ? (
        <g className="arcade-shield-ripple">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="46" strokeDasharray="32 14" />
          <path d="M3 50H12M88 50H97M50 3V12M50 88V97" />
        </g>
      ) : kind === "mat" || kind === "floor-aura" ? (
        <g
          className={`arcade-ground-ring ${kind === "floor-aura" ? "arcade-ground-aura" : ""}`}
        >
          <circle className="arcade-ground-glow" cx="50" cy="50" r="37" />
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="46" strokeDasharray="65 8 30 16" />
          <circle className="arcade-ground-core" cx="50" cy="50" r="25" />
        </g>
      ) : kind === "mat-crack" ? (
        <g className="arcade-mat-cracks">
          <path d="M50 50L38 42L25 44L18 32L3 29M50 50L61 40L71 41L76 23L93 16M50 50L63 58L78 57L84 71L99 74M50 50L43 62L26 66L18 82M51 51L58 72L52 89" />
          <path
            className="arcade-crack-core"
            d="M50 50L40 46L30 48M50 50L62 43L68 44M50 50L62 57L71 57M50 50L44 61"
          />
        </g>
      ) : kind === "dust" ? (
        <g className="arcade-dust-cloud">
          <ellipse cx="52" cy="68" rx="40" ry="20" />
          <circle cx="29" cy="54" r="20" />
          <circle cx="53" cy="43" r="24" />
          <circle cx="74" cy="58" r="19" />
          <path d="M9 74Q38 57 91 73Q54 91 9 74Z" />
        </g>
      ) : kind === "debris" ? (
        <g className="arcade-debris-chips">
          <path d="M15 27L26 20L34 27L28 36L19 36ZM64 12L73 16L70 25L61 23ZM76 55L89 58L87 71L77 67ZM41 63L47 58L55 65L50 74Z" />
          <path
            className="arcade-debris-highlight"
            d="M15 27L26 20L34 27M64 12L73 16M76 55L89 58M41 63L47 58"
          />
        </g>
      ) : kind === "guard-rail" ? (
        <g className="arcade-guard-rail">
          <path d="M48 4L35 17V83L48 96M62 17V83M70 29V71" />
        </g>
      ) : kind === "rising-motes" ? (
        <g className="arcade-focus-motes">
          {motes.map(([x, y, r], index) => (
            <g key={index}>
              <circle cx={x} cy={y} r={r} />
              {index % 2 === 0 && (
                <path
                  d={`M${x} ${y - r * 3}V${y + r * 3}M${x - r * 3} ${y}H${x + r * 3}`}
                />
              )}
            </g>
          ))}
        </g>
      ) : kind === "breath" || kind === "spotlight" || kind === "release" ? (
        <g className="arcade-focus-aura">
          <circle cx="50" cy="50" r="38" />
          <circle cx="50" cy="50" r="46" strokeDasharray="75 17 20 31" />
          <path d="M27 75Q9 46 31 24M70 76Q91 48 69 24" />
          {kind === "spotlight" && (
            <path
              className="arcade-spot-rays"
              d="M40 78L23 8M60 78L77 8M50 79V1"
            />
          )}
        </g>
      ) : kind === "card-echo" ? (
        <g className="arcade-card-echo">
          <path d="M22 10H78V90H22ZM29 17H71V83H29Z" />
          <path d="M49 30L58 49L50 71L40 50Z" />
        </g>
      ) : kind === "fracture" || kind === "veil" ? (
        <g className="arcade-nightmare-fracture">
          <path d="M50 50L37 34L44 20L26 3M50 50L65 43L71 26L94 16M50 50L44 68L51 78L40 98M50 50L24 58L11 44L1 46M50 50L70 69L87 67L97 88" />
          <path
            className="arcade-fracture-secondary"
            d="M37 34L23 31L17 14M71 26L63 10M44 68L30 75L29 92M70 69L74 87"
          />
        </g>
      ) : null}
    </svg>
  );
}

const channelsToAnimate = ["x", "y", "scale", "scaleX", "scaleY", "rotate"];
const staticKinds = new Set([
  "target",
  "shield",
  "breath",
  "floor-aura",
  "clamp",
  "grip",
]);

export const TechniqueEffects = memo(function TechniqueEffects({
  cue,
  effect,
  duration,
  still = false,
}) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = still || prefersReducedMotion;
  const frame = useRef(null);
  const [projection, setProjection] = useState(() => artworkProjection(0, 0));
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const measure = () => {
      const image = node.parentElement?.querySelector(".artwork img");
      const imageStyle = image ? getComputedStyle(image) : null;
      const position = imageStyle?.objectPosition
        .split(" ")
        .map((value) => parseFloat(value) / 100) || [0.5, 0.5];
      const next = artworkProjection(
        node.clientWidth,
        node.clientHeight,
        imageStyle?.objectFit,
        position,
      );
      setProjection((previous) =>
        Object.keys(next).every((key) => next[key] === previous[key])
          ? previous
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [cue.id]);
  // Crowd captions, sound and health UI update at contact. Their re-renders
  // must never create fresh keyframes and restart this finite replay clock.
  const allLayers = useMemo(
    () =>
      techniqueEffectLayers(effect, cue.camera, {
        attacking: cue.attacking,
        damage: cue.damage,
      }),
    [effect, cue.camera, cue.attacking, cue.damage],
  );
  const layers = useMemo(
    () =>
      reduced
        ? allLayers.filter((item) => staticKinds.has(item.kind)).slice(0, 3)
        : allLayers,
    [allLayers, reduced],
  );
  return (
    <div
      className={`arcade-technique-fx arcade-family-${effect.family} ${reduced ? "arcade-fx-still" : ""}`}
      ref={frame}
      data-effect-family={effect.family}
      data-effect-variant={effect.variant}
      data-effect-count={layers.length}
      data-vfx="arcade"
      aria-hidden="true"
    >
      {layers.map((item) => (
        <ArcadeEffectLayer
          key={item.id}
          item={item}
          effect={effect}
          projection={projection}
          duration={duration}
          reduced={reduced}
        />
      ))}
    </div>
  );
});

const staticFrame = { opacity: 0.45 };
const staticFloorFrame = { opacity: 0.45, scaleX: 1, scaleY: 0.2 };
const staticTransition = { duration: 0 };

const ArcadeEffectLayer = memo(function ArcadeEffectLayer({
  item,
  effect,
  projection,
  duration,
  reduced,
}) {
  const center = projectedArtworkPoint(item.center, projection);
  const channels = useMemo(() => {
    const result = { opacity: item.opacity };
    for (const channel of channelsToAnimate)
      if (item[channel]) result[channel] = item[channel];
    return result;
  }, [item]);
  const initial = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(channels).map(([channel, values]) => [
          channel,
          values[0],
        ]),
      ),
    [channels],
  );
  const transition = useMemo(
    () => ({
      duration: duration / 1000,
      times: item.times,
      // Explicit normalized contact times must remain on the cue clock.
      // WAAPI may otherwise ease the entire keyframe timeline.
      ease: "linear",
    }),
    [duration, item.times],
  );
  return (
    <motion.div
      className={`arcade-fx arcade-fx-${item.kind}`}
      data-effect-layer={item.kind}
      data-direction={item.direction}
      data-side={item.side}
      initial={reduced ? false : initial}
      animate={
        reduced
          ? item.kind === "floor-aura"
            ? staticFloorFrame
            : staticFrame
          : channels
      }
      transition={reduced ? staticTransition : transition}
      style={{
        left: `${center[0] * 100}%`,
        top: `${center[1] * 100}%`,
        width: `${item.width * projection.scaleX}%`,
        ...(item.kind === "lift" || item.kind === "arc"
          ? { height: `${100 * projection.scaleY}%` }
          : {}),
        "--effect-angle": `${item.angle || 0}deg`,
      }}
    >
      <EffectGraphic
        item={item}
        effect={effect}
        transition={transition}
        still={reduced}
      />
    </motion.div>
  );
});
