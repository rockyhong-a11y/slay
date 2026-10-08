import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Artwork } from "./Artwork.jsx";
import { CombatContactArt } from "./CombatContactArt.jsx";
import { ClassicActionArtwork } from "./ClassicActionArtwork.jsx";
import { FluidActionArtwork } from "./FluidActionArtwork.jsx";
import {
  applyClassicActionFrame,
  hasClassicActionArt,
} from "./action-motion.js";
import {
  createFluidCombatTimeline,
  fluidCombatFrame,
  fluidEase,
} from "./fluid-combat.js";
import { fighterPoseArt } from "./presentation.js";
import { sdActorId } from "./sd-combat.js";
import {
  classicArtworkStyle,
  classicBodyBounds,
  classicBodyRatio,
  classicCombatFrame,
  classicSceneProjection,
  classicScreenPoint,
} from "./classic-combat.js";
import "./classic-combat.css";

const asset = (path) => `${import.meta.env.BASE_URL}assets/${path}`;
const clip = (n, min, max) => Math.max(min, Math.min(max, n));
const characterPose = (body, condition) =>
  body.pose === "idle" && ["tired", "groggy"].includes(condition)
    ? "groggy"
    : body.pose;

export function ClassicCombatStage({
  player = "raven",
  enemy = "nova",
  playerCondition = "normal",
  enemyCondition = "normal",
  playerVitals,
  enemyVitals,
  cue = null,
  incoming = false,
  shortened = false,
  paused = false,
  cinematic = false,
  backgroundArt = "arena.webp",
  onUnavailable,
}) {
  const stage = useRef(null);
  const bodies = useRef([]);
  const contact = useRef(null);
  const shadows = useRef([]);
  const latest = useRef(null);
  const controller = useRef(null);
  const actionMetadata = useRef([null, null]);
  const fluidRenderers = useRef([]);
  const originalWindows = useRef([]);
  const ratios = useRef([classicBodyRatio(player), classicBodyRatio(enemy)]);
  ratios.current = [classicBodyRatio(player), classicBodyRatio(enemy)];
  const failures = useRef(new Set());
  const callback = useRef(onUnavailable);
  callback.current = onUnavailable;
  const reduced = useReducedMotion();
  const [statuses, setStatuses] = useState(["loading", "loading"]);
  const [actionPoses, setActionPoses] = useState([null, null]);

  const status = statuses.includes("fallback")
    ? "fallback"
    : statuses.every((s) => s === "ready")
      ? "ready"
      : "loading";
  latest.current = {
    cue,
    incoming,
    still: !!reduced || shortened,
    paused,
    cinematic,
    playerCondition,
    enemyCondition,
    actors: [player, enemy],
  };
  const setStatus = (index, value) => {
    setStatuses((current) =>
      current[index] === value
        ? current
        : current.map((v, i) => (i === index ? value : v)),
    );
    if (value === "fallback" && !failures.current.has(index)) {
      failures.current.add(index);
      callback.current?.();
    }
  };
  useEffect(() => {
    failures.current.clear();
    setStatuses(["loading", "loading"]);
  }, [player, enemy]);
  useLayoutEffect(() => {
    const host = stage.current;
    if (!host) return;
    let alive = true,
      raf = 0,
      visible = true,
      width = 1,
      height = 1;
    let cueKey = null,
      cueStart = 0;
    let previousActionPoses = [null, null];
    let timeline = null,
      timelineKey = null,
      timelineMetadata = [];
    let frameCount = 0,
      frameElapsed = 0,
      renderElapsed = 0,
      previousFrameTime = 0;
    let frameIntervals = [];
    const requestedFrame = import.meta.env.DEV
      ? new URLSearchParams(window.location.search).get("qaFluidFrame")
      : null;
    const diagnosticFrame =
      requestedFrame != null && Number.isFinite(Number(requestedFrame))
        ? clip(Number(requestedFrame), 0, 0.999)
        : null;
    const cancel = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const schedule = () => {
      if (!alive || raf || !visible || document.hidden || latest.current.paused)
        return;
      raf = requestAnimationFrame((now) => draw(now, true));
    };
    const refresh = () => {
      cancel();
      if (!alive || !visible || document.hidden || latest.current.paused)
        return;
      draw(performance.now());
    };
    const size = () => {
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      refresh();
    };
    function draw(now, animationFrame = false) {
      const renderStart = performance.now();
      raf = 0;
      if (!alive || !visible || document.hidden || latest.current.paused)
        return;
      const playback = latest.current;
      const nextKey = playback.cue
        ? `${playback.incoming ? "incoming" : "technique"}-${playback.cue.id}`
        : null;
      if (nextKey !== cueKey) {
        cueKey = nextKey;
        cueStart = Number.isFinite(playback.cue?.startedAt)
          ? playback.cue.startedAt
          : now;
        frameCount = frameElapsed = renderElapsed = previousFrameTime = 0;
        frameIntervals = [];
      }
      const duration = playback.still
        ? 650
        : Math.max(300, playback.cue?.duration || 1000);
      const frozenFrame = playback.cinematic ? diagnosticFrame : null;
      const progress =
        frozenFrame ??
        (playback.cue ? clip((now - cueStart) / duration, 0, 1) : 0);
      const options = {
        still: playback.still,
        incoming: playback.incoming,
        bodyRatios: ratios.current,
        width,
        height,
      };
      let frame = applyClassicActionFrame(
        classicCombatFrame(playback.cue, progress, options),
        playback.cue,
        progress,
        {
          ...options,
          actors: playback.actors,
          metadata: actionMetadata.current,
        },
      );
      const fluidMetadata = actionMetadata.current.map((entry) =>
        entry?.fluid ? entry : null,
      );
      const currentTimelineKey = `${cueKey}:${width}:${height}:${playback.still}`;
      if (
        currentTimelineKey !== timelineKey ||
        fluidMetadata.some((entry, index) => entry !== timelineMetadata[index])
      ) {
        timelineKey = currentTimelineKey;
        timelineMetadata = fluidMetadata;
        timeline =
          playback.cue && !playback.still && fluidMetadata.some(Boolean)
            ? createFluidCombatTimeline(playback.cue, {
                ...options,
                actors: playback.actors,
                metadata: fluidMetadata,
              })
            : null;
      }
      if (timeline && !playback.still && progress < 1) {
        const fluid = fluidCombatFrame(timeline, progress);
        // An unavailable GPU keeps the existing illustrated fallback. Only the
        // supported actors with successfully prepared surfaces use new motion.
        frame = {
          ...fluid,
          player: fluidMetadata[0] ? fluid.player : frame.player,
          enemy: fluidMetadata[1] ? fluid.enemy : frame.enemy,
        };
      }
      let projection = classicSceneProjection(
        width,
        height,
        frame,
        ratios.current,
        playback.cinematic,
      );
      if (timeline?.bounds && progress < 1 && !playback.still) {
        const { left, right, bottom, top } = timeline.bounds;
        const envelope = {
          x: (left + right) / 2,
          y: (bottom + top) / 2,
          drawWidth: right - left,
          drawHeight: top - bottom,
          rz: 0,
          scale: 1,
        };
        projection = classicSceneProjection(
          width,
          height,
          { player: envelope, enemy: envelope, camera: frame.camera },
          ratios.current,
          playback.cinematic,
        );
      }
      const nextPoses = [];
      const nextActionPoses = [];
      [frame.player, frame.enemy].forEach((body, index) => {
        const point = classicScreenPoint(body.x, body.y, projection);
        const node = bodies.current[index];
        const ratio = ratios.current[index];
        const pose = characterPose(
          body,
          index ? playback.enemyCondition : playback.playerCondition,
        );
        nextPoses.push(pose);
        nextActionPoses.push(body.actionPose || null);
        const original = originalWindows.current[index];
        if (body.fluid) {
          const presence = fluidEase(
            Math.min(
              (progress * duration) / 100,
              ((1 - progress) * duration) / 120,
            ),
          );
          body.fluid.opacity = presence;
          if (original) {
            // The original condition illustration keeps its own proportions
            // inside the fixed action canvas, sharing the same foot anchor.
            const w = (3 * ratio) / body.drawWidth;
            const h = 3 / body.drawHeight;
            original.style.width = `${w * 100}%`;
            original.style.height = `${h * 100}%`;
            original.style.left = `${(1 - w) * 50}%`;
            original.style.top = `${(1 - h) * 100}%`;
            original.style.visibility = "visible";
            original.style.opacity = String(1 - presence);
          }
        } else if (original) {
          original.style.width = original.style.height = "100%";
          original.style.left = original.style.top = "0%";
          original.style.opacity = "1";
          original.style.visibility = body.actionPose ? "hidden" : "visible";
        }
        if (node) {
          const logicalWidth = (body.drawWidth || 3 * ratio) * 100;
          const logicalHeight = (body.drawHeight || 3) * 100;
          node.style.left = "0px";
          node.style.top = "0px";
          const cssWidth = `${logicalWidth}px`,
            cssHeight = `${logicalHeight}px`;
          if (node.style.width !== cssWidth) node.style.width = cssWidth;
          if (node.style.height !== cssHeight) node.style.height = cssHeight;
          node.style.transform = `translate3d(${point.x - logicalWidth / 2}px, ${point.y - logicalHeight / 2}px, 0) rotate(${-body.rz}rad) scale(${(projection.unit / 100) * (body.scale || 1)})`;
          node.style.zIndex = `${20 + Math.round((body.depth || 0) * 5) + index}`;
          node.dataset.classicPose = pose;
          node.dataset.actionPose = body.actionPose || "original";
          fluidRenderers.current[index]?.draw(body);
        }
        const ground = classicScreenPoint(body.x, 0.01, projection);
        const bounds = classicBodyBounds(body, ratio);
        const shadow = shadows.current[index];
        if (shadow) {
          shadow.style.left = `${ground.x}px`;
          shadow.style.top = `${ground.y}px`;
          shadow.style.width = `${projection.unit * 1.22}px`;
          shadow.style.height = `${projection.unit * 0.18}px`;
          shadow.style.opacity = `${clip(0.32 - Math.max(0, bounds.bottom) * 0.08, 0.08, 0.32)}`;
        }
      });
      if (
        nextActionPoses.some(
          (pose, index) => pose !== previousActionPoses[index],
        )
      ) {
        previousActionPoses = nextActionPoses;
        setActionPoses(nextActionPoses);
      }
      const impact = contact.current;
      if (impact) {
        const point = classicScreenPoint(
          frame.contact.x,
          frame.contact.y,
          projection,
        );
        const strength = playback.still
          ? 0
          : clip(frame.contact.strength, 0, 1.4);
        impact.style.left = `${point.x}px`;
        impact.style.top = `${point.y}px`;
        impact.style.width = `${projection.unit * (frame.contact.family === "submission" ? 1.2 : 1.48)}px`;
        impact.style.height = impact.style.width;
        impact.style.opacity = frame.contact.visible
          ? String(Math.min(0.88, strength))
          : "0";
        impact.style.transform = `translate(-50%, -50%) scale(${0.65 + strength * 0.38})`;
        impact.dataset.family = frame.contact.family;
      }
      host.dataset.classicPhase = frame.phase;
      host.dataset.classicPlayerPose = nextPoses[0];
      host.dataset.classicEnemyPose = nextPoses[1];
      host.dataset.classicProgress = progress.toFixed(3);
      host.dataset.fluidStage = String(!!timeline && !playback.still);
      if (
        import.meta.env.DEV &&
        playback.cue &&
        progress < 1 &&
        !playback.still &&
        animationFrame
      ) {
        if (previousFrameTime) {
          frameCount++;
          frameElapsed += now - previousFrameTime;
          frameIntervals.push(now - previousFrameTime);
        }
        previousFrameTime = now;
        renderElapsed += performance.now() - renderStart;
        if (frameCount > 0 && frameCount % 15 === 0) {
          host.dataset.fluidFps = ((frameCount * 1000) / frameElapsed).toFixed(
            1,
          );
          host.dataset.fluidDrawMs = (renderElapsed / (frameCount + 1)).toFixed(
            2,
          );
          host.dataset.fluidSamples = String(frameCount);
          const ordered = [...frameIntervals].sort((a, b) => a - b);
          host.dataset.fluidP95Ms =
            ordered[Math.floor((ordered.length - 1) * 0.95)].toFixed(2);
        }
      }
      // The authoritative cue clock aligns independently mounted stages. Hidden or
      // modal pauses stop work; a cue removed during a pause cannot replay later.
      if (
        playback.cue &&
        progress < 1 &&
        !playback.still &&
        frozenFrame == null
      )
        schedule();
    }
    const resize =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(size);
    resize?.observe(host);
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) refresh();
            else cancel();
          });
    intersection?.observe(host);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("resize", size);
    controller.current = { refresh, schedule };
    size();
    return () => {
      alive = false;
      cancel();
      resize?.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("resize", size);
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    controller.current?.refresh();
  }, [
    cue,
    incoming,
    reduced,
    shortened,
    paused,
    cinematic,
    playerCondition,
    enemyCondition,
    player,
    enemy,
    status,
  ]);
  return (
    <div
      ref={stage}
      className={`classic-stage ${cinematic ? "classic-stage-cinematic" : ""}`}
      data-classic-status={status}
      data-classic-card={cue?.cardId || "idle"}
      data-classic-motion={reduced || shortened ? "reduced" : "full"}
      role="img"
      aria-label={`원본 2D 전투 · ${sdActorId(player).toUpperCase()} 대 ${sdActorId(enemy).toUpperCase()}`}
    >
      {cinematic && (
        <span
          className="classic-ring-backdrop"
          style={{ backgroundImage: `url("${asset(backgroundArt)}")` }}
          aria-hidden="true"
        />
      )}
      <span className="classic-stage-shade" aria-hidden="true" />
      {[player, enemy].map((actor, index) => (
        <React.Fragment key={index}>
          <span
            className="classic-floor-shadow"
            ref={(node) => {
              shadows.current[index] = node;
            }}
            aria-hidden="true"
          />
          <span
            className={`classic-fighter classic-fighter-${index ? "enemy" : "player"}`}
            ref={(node) => {
              bodies.current[index] = node;
            }}
            aria-hidden="true"
          >
            <span
              ref={(node) => {
                originalWindows.current[index] = node;
              }}
              className="classic-art-window"
              data-action-active={!!actionPoses[index]}
              onLoadCapture={() => setStatus(index, "ready")}
              onErrorCapture={() => setStatus(index, "fallback")}
            >
              <Artwork
                art={fighterPoseArt(
                  actor,
                  index ? enemyCondition : playerCondition,
                )}
                alt=""
                className="classic-fighter-art"
                style={classicArtworkStyle(actor, !!index)}
                condition={index ? enemyCondition : playerCondition}
                vitals={index ? enemyVitals : playerVitals}
                mirrored={!!index}
                loading="eager"
              />
            </span>
            {hasClassicActionArt(actor) ? (
              <FluidActionArtwork
                ref={(renderer) => {
                  fluidRenderers.current[index] = renderer;
                }}
                actor={actor}
                pose={actionPoses[index] || "ready"}
                active={!!actionPoses[index]}
                still={!!reduced || shortened}
                mirrored={!!index}
                onReady={(metadata) => {
                  actionMetadata.current[index] = metadata;
                  controller.current?.schedule();
                }}
              />
            ) : (
              <ClassicActionArtwork
                actor={actor}
                pose={actionPoses[index] || "ready"}
                active={!!actionPoses[index]}
                still={!!reduced || shortened}
                mirrored={!!index}
                onReady={(metadata) => {
                  actionMetadata.current[index] = metadata;
                  controller.current?.refresh();
                }}
              />
            )}
          </span>
        </React.Fragment>
      ))}
      <span className="classic-contact" ref={contact} aria-hidden="true">
        <CombatContactArt />
      </span>
    </div>
  );
}
