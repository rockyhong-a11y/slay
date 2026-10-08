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
          className="arcade-speed-trace-halo"
        />
        <Trace
          d={path}
          item={item}
          transition={transition}
          still={still}
          className="arcade-speed-trace"
        />
        <Trace
          d={path}
          item={item}
          transition={transition}
          still={still}
          className="arcade-speed-trace-core"
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
      ) : kind === "burst" || kind === "slam-flare" ? (
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
        <g className="arcade-bracing-strokes">
          <path d="M11 21L44 39L18 25ZM4 46L41 49L6 52ZM14 79L44 61L20 78Z" />
          <path
            className="arcade-bracing-white"
            d="M26 29L43 39M18 49H40M26 71L43 61"
          />
        </g>
      ) : kind === "tension" ||
        kind === "pressure" ||
        kind === "pressure-sparks" ? (
        <g className="arcade-pressure-sparks">
          <path d="M50 32L54 45L69 39L59 50L71 59L55 56L49 71L45 57L29 63L40 51L29 41L44 45Z" />
          <path
            className="arcade-pressure-white"
            d="M50 40L54 48L62 50L54 54L49 63L46 55L37 51L46 48Z"
          />
          <path
            className="arcade-pressure-ticks"
            d="M18 22L33 37M12 57L28 54M77 18L65 36M82 70L68 61M46 87L47 73"
          />
        </g>
      ) : kind === "target" ? (
        <g className="arcade-contact-mark">
          <path d="M49 27L54 45L73 49L55 55L50 74L45 56L26 50L44 45Z" />
        </g>
      ) : kind === "shield" ? (
        <g className="arcade-shield">
          <path
            className="arcade-brace-wash"
            d="M50 23L58 40L84 31L69 49L90 61L64 60L58 85L47 65L25 77L35 57L10 47L37 43L34 19Z"
          />
          <path d="M24 20Q53 35 68 64M18 32Q40 40 55 66M79 30L68 41M81 58L69 54M58 83L54 71" />
        </g>
      ) : kind === "brace-streaks" ? (
        <g className="arcade-brace-streaks">
          <path d="M5 27L33 39M3 50H28M7 73L32 62M95 27L70 39M97 50H73M93 74L71 62" />
        </g>
      ) : kind === "mat" ? (
        <g className="arcade-mat-burst">
          <path d="M49 1L56 33L77 15L65 39L99 31L72 49L96 67L64 62L80 88L54 70L47 99L42 67L18 87L32 61L1 68L29 49L4 29L34 37L25 9L43 32Z" />
          <path
            className="arcade-mat-white"
            d="M49 20L55 43L72 34L62 49L79 57L57 57L49 80L42 59L24 66L36 51L18 43L42 44Z"
          />
          <path
            className="arcade-mat-rays"
            d="M4 7L30 33M94 10L72 34M2 92L29 71M97 88L73 70"
          />
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
        <g className="arcade-focus-streaks">
          <path d="M23 82L30 23M34 72L37 39M74 81L68 26M63 70L61 41" />
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
      ) : kind === "stress-slash" || kind === "veil" ? (
        <g className="arcade-stress-slashes">
          <path d="M10 20L69 49L29 34ZM5 41L58 53L9 48ZM83 20L54 74L72 35ZM87 64L36 85L84 73Z" />
          <path
            className="arcade-stress-accent"
            d="M15 23L54 43M79 32L66 61M48 80L78 69"
          />
        </g>
      ) : null}
    </svg>
  );
}

const channelsToAnimate = ["x", "y", "scale", "scaleX", "scaleY", "rotate"];
const staticKinds = new Set(["target", "shield", "breath", "clamp", "grip"]);

export const TechniqueEffects = memo(function TechniqueEffects({
  cue,
  effect,
  duration,
  still = false,
  animationDelay = 0,
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
          animationDelay={animationDelay}
        />
      ))}
    </div>
  );
});

const staticFrame = { opacity: 0.45 };
const staticTransition = { duration: 0 };

const ArcadeEffectLayer = memo(function ArcadeEffectLayer({
  item,
  effect,
  projection,
  duration,
  reduced,
  animationDelay,
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
      delay: animationDelay,
      times: item.times,
      // Explicit normalized contact times must remain on the cue clock.
      // WAAPI may otherwise ease the entire keyframe timeline.
      ease: "linear",
    }),
    [duration, item.times, animationDelay],
  );
  return (
    <motion.div
      className={`arcade-fx arcade-fx-${item.kind}`}
      data-effect-layer={item.kind}
      data-direction={item.direction}
      data-side={item.side}
      initial={reduced ? false : initial}
      animate={reduced ? staticFrame : channels}
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
