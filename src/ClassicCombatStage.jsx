import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Artwork } from "./Artwork.jsx";
import { fighterPoseArt } from "./presentation.js";
import { sdActorId } from "./sd-combat.js";
import { sdBodyBounds } from "./sd-artwork.js";
import {
  classicArtworkStyle,
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
  const ratios = useRef([classicBodyRatio(player), classicBodyRatio(enemy)]);
  ratios.current = [classicBodyRatio(player), classicBodyRatio(enemy)];
  const failures = useRef(new Set());
  const callback = useRef(onUnavailable);
  callback.current = onUnavailable;
  const reduced = useReducedMotion();
  const [statuses, setStatuses] = useState(["loading", "loading"]);

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
    const cancel = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const schedule = () => {
      if (!alive || raf || !visible || document.hidden || latest.current.paused)
        return;
      raf = requestAnimationFrame(draw);
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
    function draw(now) {
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
      }
      const duration = playback.still
        ? 650
        : Math.max(300, playback.cue?.duration || 1000);
      const progress = playback.cue
        ? clip((now - cueStart) / duration, 0, 1)
        : 0;
      const frame = classicCombatFrame(playback.cue, progress, {
        still: playback.still,
        incoming: playback.incoming,
        bodyRatios: ratios.current,
        width,
        height,
      });
      const projection = classicSceneProjection(
        width,
        height,
        frame,
        ratios.current,
        playback.cinematic,
      );
      const nextPoses = [];
      [frame.player, frame.enemy].forEach((body, index) => {
        const point = classicScreenPoint(body.x, body.y, projection);
        const node = bodies.current[index];
        const ratio = ratios.current[index];
        const pose = characterPose(
          body,
          index ? playback.enemyCondition : playback.playerCondition,
        );
        nextPoses.push(pose);
        if (node) {
          node.style.left = `${point.x}px`;
          node.style.top = `${point.y}px`;
          node.style.width = `${3 * projection.unit * ratio}px`;
          node.style.height = `${3 * projection.unit}px`;
          node.style.transform = `translate(-50%, -50%) rotate(${-body.rz}rad) scale(${body.scale || 1})`;
          node.style.zIndex = `${20 + Math.round((body.depth || 0) * 5) + index}`;
          node.dataset.classicPose = pose;
        }
        const ground = classicScreenPoint(body.x, 0.01, projection);
        const bounds = sdBodyBounds(body, ratio);
        const shadow = shadows.current[index];
        if (shadow) {
          shadow.style.left = `${ground.x}px`;
          shadow.style.top = `${ground.y}px`;
          shadow.style.width = `${projection.unit * 1.22}px`;
          shadow.style.height = `${projection.unit * 0.18}px`;
          shadow.style.opacity = `${clip(0.32 - Math.max(0, bounds.bottom) * 0.08, 0.08, 0.32)}`;
        }
      });
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
      // The authoritative cue clock aligns independently mounted stages. Hidden or
      // modal pauses stop work; a cue removed during a pause cannot replay later.
      if (playback.cue && progress < 1 && !playback.still) schedule();
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
    controller.current = { refresh };
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
              className="classic-art-window"
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
          </span>
        </React.Fragment>
      ))}
      <span className="classic-contact" ref={contact} aria-hidden="true">
        <svg viewBox="-50 -50 100 100" focusable="false">
          <path
            className="classic-contact-cloud"
            d="M0-31 9-21 26-24 27-8 40 0 27 9 25 25 9 22 0 36-9 22-26 25-27 8-40 0-26-8-26-23-10-21Z"
          />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              className="classic-contact-streak"
              d="M0-30 0-44"
              transform={`rotate(${i * 45})`}
            />
          ))}
        </svg>
      </span>
    </div>
  );
}
