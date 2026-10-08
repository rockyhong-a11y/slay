"use client";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion, useAnimationControls } from "motion/react";
import { createPortal } from "react-dom";
import { Fire, Heartbeat, Shield, Sparkle } from "@phosphor-icons/react";
import {
  FIGHTER_STATES,
  fighterPoseArt,
  fighterImpactFrames,
  frameTechniqueCamera,
} from "./presentation.js";
import "./combat-presentation.css";
import { Artwork } from "./Artwork.jsx";
import { motionTokens } from "./motion-config.js";
import { CrowdCallout } from "./CrowdAtmosphere.jsx";
import { TechniqueEffects } from "./ArcadeTechniqueFX.jsx";
import { fighterWearProfile } from "./fighter-wear.js";
import { SDCombatStage } from "./SDCombatStage.jsx";
import { ClassicCombatStage } from "./ClassicCombatStage.jsx";
import { SDArtwork } from "./SDArtwork.jsx";
import { gearWearProfile } from "./gear-wear.js";
import { cuePlayback, scheduleCueEvents } from "./cue-timing.js";
import { techniqueSequence } from "./technique-sequence.js";
import {
  techniqueEffectProfile,
  TECHNIQUE_EFFECT_MOTION,
} from "./technique-effects.js";

const icons = {
  normal: Shield,
  excited: Sparkle,
  fiery: Fire,
  frustrated: Heartbeat,
  tired: Heartbeat,
  groggy: Heartbeat,
};

export function FighterCondition({ condition, enemy = false, onClick }) {
  const Icon = icons[condition.id];
  const Element = onClick ? "button" : "span";
  return (
    <Element
      type={onClick ? "button" : undefined}
      className={`fighter-condition condition-${condition.id}`}
      onClick={onClick}
      title={
        enemy
          ? "상대는 체력과 약화 상태에 따라 자세가 바뀝니다."
          : onClick
            ? `${condition.rule}. 컨디션과 표정 보기`
            : condition.rule
      }
      aria-label={
        onClick
          ? `현재 선수 상태: ${condition.label}. 컨디션과 표정 보기`
          : `${enemy ? "상대" : "선수"} 상태: ${condition.label}`
      }
    >
      <Icon size={12} weight="fill" />
      <span>{condition.label}</span>
    </Element>
  );
}

export function FighterSprite({
  actor,
  condition,
  name,
  side,
  impact,
  vitals,
  shortened = false,
}) {
  const requested = fighterPoseArt(actor, condition);
  const reduced = useReducedMotion();
  const controls = useAnimationControls();
  const attacking = impact?.attacker === side;
  const struck = impact?.target === side;
  const still = reduced || shortened;
  useEffect(() => {
    controls.stop();
    controls.set({ x: 0, y: 0, rotate: 0, filter: "brightness(1)" });
    const frames = fighterImpactFrames(impact, side, still);
    if (!frames) return;
    // The duplicated contact values create a short visual freeze, then a
    // pronounced recoil. Both animation layers move the complete illustration.
    controls.start({
      ...frames,
      transition: {
        ...frames.transition,
        delay: cuePlayback(impact, impact.duration, performance.now())
          .animationDelay,
      },
    });
    return () => controls.stop();
  }, [impact?.id, side, controls, still, attacking, struck]);
  return (
    <div
      className={`fighter ${side}-fighter`}
      data-condition={condition.id}
      data-impact={
        impact && (attacking || struck)
          ? attacking
            ? "attack"
            : impact.damage
              ? "hit"
              : "guard"
          : undefined
      }
    >
      <motion.div className="fighter-sprite-frame" animate={controls}>
        <Artwork
          art={requested}
          alt={`${name} · ${condition.label} 자세`}
          className="fighter-pose"
          condition={condition.id}
          vitals={vitals}
          mirrored={side === "enemy"}
          position={[0.5, 1]}
        />
      </motion.div>
    </div>
  );
}

export { ArcadeArenaImpact as ArenaImpact } from "./ArcadeArenaImpact.jsx";

export function TechniqueScene(props) {
  const {
    cue,
    displayMode = "classic",
    shortened = false,
    onComplete,
    includeFighterReplay = false,
  } = props;
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState({ cueId: cue.id, index: 0 });
  const shotIndex = progress.cueId === cue.id ? progress.index : 0;
  const completed = useRef(null);
  const activeShot = useRef(null);
  const shots = useMemo(
    () =>
      techniqueSequence(cue, {
        displayMode,
        still: !!reduced || shortened,
        now: performance.now(),
        includeFighterReplay,
      }),
    [cue, displayMode, reduced, shortened, includeFighterReplay],
  );
  const shot = shots[Math.min(shotIndex, shots.length - 1)];
  activeShot.current = { cueId: cue.id, shotId: shot.cue.id };
  const finishShot = (id) => {
    if (
      completed.current === cue.id ||
      activeShot.current.cueId !== cue.id ||
      activeShot.current.shotId !== id
    )
      return;
    if (shotIndex < shots.length - 1) {
      setProgress({ cueId: cue.id, index: shotIndex + 1 });
    } else {
      completed.current = cue.id;
      onComplete(cue.id);
    }
  };
  return (
    <TechniqueSceneShot
      {...props}
      key={shot.cue.id}
      cue={shot.cue}
      shotKind={shot.kind}
      shotIndex={shotIndex}
      shotCount={shots.length}
      emitCrowd={shotIndex === 0}
      onComplete={finishShot}
    />
  );
}

function TechniqueSceneShot({
  cue,
  onComplete,
  onCrowd,
  onContact,
  shortened = false,
  shotKind,
  shotIndex,
  shotCount,
  emitCrowd = true,
  paused = false,
  playerActor = "raven",
  enemyActor = "nova",
  playerCondition = "normal",
  enemyCondition = "normal",
  playerVitals,
  enemyVitals,
  backgroundArt = "arena.webp",
  embedded = false,
  includeFighterReplay = false,
}) {
  const reduced = useReducedMotion();
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const reactionCallback = useRef(onCrowd);
  reactionCallback.current = onCrowd;
  const contactCallback = useRef(onContact);
  contactCallback.current = onContact;
  const [crowdVisible, setCrowdVisible] = useState(false);
  const still = reduced || shortened;
  const sdIllustration = cue.artStyle === "sd2d";
  const sdStage =
    shotKind === "sd" && (!sdIllustration || includeFighterReplay);
  const classicStage = shotKind === "fighters";
  const duration = still ? 650 : cue.duration;
  const playback = useMemo(
    () => cuePlayback(cue, duration, performance.now()),
    [cue.id, duration],
  );
  const delivered = useMemo(() => new Set(), [cue.id]);
  const camera = cue.camera;
  const effect =
    cue.effect || techniqueEffectProfile(cue.cardId, cue.disciplineSlug);
  const artWindow = useRef(null);
  const [viewport, setViewport] = useState(null);
  useLayoutEffect(() => {
    const node = artWindow.current;
    if (!node) return;
    const measure = () => {
      const image = node.querySelector(".artwork img");
      const style = image ? getComputedStyle(image) : null;
      const next = {
        width: node.clientWidth,
        height: node.clientHeight,
        fit: style?.objectFit || "contain",
        position: style?.objectPosition
          .split(" ")
          .map((value) => parseFloat(value) / 100) || [0.5, 0.5],
      };
      setViewport((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [cue.id]);
  const framedCamera = useMemo(
    () => frameTechniqueCamera(camera, effect, viewport),
    [camera, effect, viewport],
  );
  useEffect(() => {
    setCrowdVisible(delivered.has("crowd"));
    const contacts = camera.impacts.length ? camera.impacts : [0.35];
    const events = [
      ...(still ? [0] : contacts).map((at, index) => ({
        key: `contact-${index}`,
        at: still ? 40 : duration * at,
      })),
      ...(emitCrowd
        ? [{ key: "crowd", at: still ? 80 : duration * (contacts[0] ?? 0.35) }]
        : []),
    ];
    return scheduleCueEvents(
      cuePlayback(playback, duration, performance.now()),
      events,
      (key) => {
        if (key === "complete") complete.current(cue.id);
        else if (key === "crowd") {
          setCrowdVisible(true);
          reactionCallback.current?.(cue.crowd);
        } else contactCallback.current?.(cue);
      },
      { delivered },
    );
  }, [
    cue.id,
    duration,
    still,
    camera,
    cue.crowd,
    playback,
    delivered,
    emitCrowd,
  ]);
  const scene = (
    <motion.div
      className={`technique-scene scene-${cue.disciplineSlug} scene-effect-${effect.family} ${cue.finisher ? "scene-finisher" : ""} ${still ? "scene-still" : ""} ${sdStage ? "scene-sd" : ""} ${classicStage ? "scene-classic" : ""} ${sdIllustration ? "scene-sd-illustration" : ""}`}
      data-art-style={cue.artStyle}
      data-presentation={shotKind}
      data-sequence-step={shotIndex + 1}
      data-sequence-count={shotCount}
      data-card={cue.cardId}
      data-motion={camera.kind}
      data-duration={duration}
      data-hitstop={still ? 0 : camera.hitstop}
      data-damage={cue.damage}
      data-effect-family={effect.family}
      data-effect-variant={effect.variant}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: shotIndex > 0 ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : motionTokens.duration.fast }}
      style={{
        "--scene-duration": `${duration}ms`,
        "--portrait-ratio": 1.5 * camera.portrait.field,
        "--portrait-focus": camera.portrait.center
          .map((value) => `${value * 100}%`)
          .join(" "),
      }}
    >
      <span className="combat-sr-only">{cue.announcement}</span>
      <div className="technique-backdrop" aria-hidden="true">
        <Artwork art={cue.art} alt="" fit="cover" />
      </div>
      <div className="technique-film-shade" aria-hidden="true" />
      <div className="technique-broadcast-head" aria-hidden="true">
        <strong>
          SLAY<span> / </span>
          {cue.finisher ? "MAIN EVENT" : "RINGSIDE"}
        </strong>
        <span>
          {shotCount > 1
            ? `${shotIndex + 1}/${shotCount} · ${classicStage || sdStage ? "FIGHTER REPLAY" : "CARD TECHNIQUE"}`
            : still
              ? "TECHNIQUE"
              : "REPLAY"}{" "}
          <i /> {cue.discipline}
        </span>
      </div>
      <div className="technique-scene-visual" aria-hidden="true">
        <div className="technique-art-stage">
          <div className="technique-art-window" ref={artWindow}>
            {sdIllustration && !classicStage && (
              <span className="sd-technique-edition">SD · 유틸리티</span>
            )}
            {sdStage ? (
              <SDCombatStage
                player={playerActor}
                enemy={enemyActor}
                playerCondition={playerCondition}
                enemyCondition={enemyCondition}
                playerVitals={playerVitals}
                enemyVitals={enemyVitals}
                backgroundArt={backgroundArt}
                cue={cue}
                shortened={still}
                cinematic
              />
            ) : classicStage ? (
              <>
                <ClassicCombatStage
                  player={playerActor}
                  enemy={enemyActor}
                  playerCondition={playerCondition}
                  enemyCondition={enemyCondition}
                  playerVitals={playerVitals}
                  enemyVitals={enemyVitals}
                  backgroundArt={backgroundArt}
                  cue={cue}
                  shortened={still}
                  paused={paused}
                  cinematic
                />
                <div className="technique-reference-card">
                  <Artwork art={cue.art} alt="" />
                  <span>{cue.discipline}</span>
                </div>
              </>
            ) : (
              <motion.div
                className="technique-art-frame"
                initial={false}
                animate={
                  still
                    ? { x: 0, y: 0, scale: 1, rotate: 0 }
                    : {
                        x: framedCamera.x,
                        y: framedCamera.y,
                        scale: framedCamera.scale,
                        rotate: framedCamera.rotate,
                      }
                }
                transition={{
                  duration: duration / 1000,
                  delay: playback.animationDelay,
                  times: camera.times,
                  ease: "linear",
                }}
                style={{ transformOrigin: framedCamera.origin }}
              >
                <Artwork art={cue.art} alt={cue.alt} />
                <TechniqueEffects
                  cue={cue}
                  effect={effect}
                  duration={duration}
                  still={still}
                  animationDelay={playback.animationDelay}
                />
              </motion.div>
            )}
            {!still &&
              cue.attacking &&
              camera.impacts.map((at, index) => (
                <motion.div
                  key={`score-${index}`}
                  className={`technique-hit-score ${cue.knockout ? "technique-hit-ko" : ""} ${!cue.damage ? "technique-hit-guard" : ""}`}
                  initial={{ opacity: 0, scale: 0.65, y: 15 }}
                  animate={{
                    opacity: TECHNIQUE_EFFECT_MOTION.scoreOpacity,
                    scale: TECHNIQUE_EFFECT_MOTION.scoreScale,
                    y: TECHNIQUE_EFFECT_MOTION.scoreY,
                  }}
                  transition={{
                    duration: duration / 1000,
                    delay: playback.animationDelay,
                    ease: "linear",
                    times: [
                      0,
                      Math.max(0.01, at - 0.01),
                      at,
                      Math.min(0.96, at + 0.16),
                      Math.min(1, at + 0.28),
                    ],
                  }}
                  aria-hidden="true"
                >
                  <small>
                    {cue.knockout
                      ? "K.O."
                      : !cue.damage
                        ? "GUARD"
                        : cue.finisher
                          ? "FINISHER"
                          : camera.pressure
                            ? "LOCKED IN"
                            : cue.hits > 1
                              ? `${index + 1} HIT`
                              : "IMPACT"}
                  </small>
                  <strong>
                    {cue.damage
                      ? index === camera.impacts.length - 1
                        ? `−${cue.damage}`
                        : "CONTACT"
                      : "BLOCK"}
                  </strong>
                </motion.div>
              ))}
          </div>
          <div className="technique-phase-track">
            {camera.phases.map((phase, index) => (
              <span key={phase}>
                <small>0{index + 1}</small>
                {phase}
              </span>
            ))}
          </div>
        </div>
        <div className="technique-caption-panel">
          <div className="technique-scene-copy">
            <span className="technique-kicker">
              {cue.finisher ? "FINISHER" : cue.discipline}
              <i />
              {cue.nameEn}
            </span>
            <strong>{cue.name}</strong>
            <span className="technique-effect-label">{effect.label}</span>
          </div>
          <div className="technique-results">
            {cue.results.map((result, index) => (
              <span
                key={`${result.kind}-${index}`}
                className={`result-${result.kind}`}
              >
                {result.text}
              </span>
            ))}
          </div>
          <div className="technique-crowd-slot">
            {crowdVisible && <CrowdCallout reaction={cue.crowd} />}
          </div>
        </div>
      </div>
      <div
        className="technique-scene-progress"
        style={{ animationDelay: playback.cssDelay }}
        aria-hidden="true"
      />
    </motion.div>
  );
  return embedded ? scene : createPortal(scene, document.body);
}

export function ConditionGuide({
  actor,
  name,
  initialCondition = "normal",
  displayMode = "classic",
  vitals,
}) {
  const [selected, setSelected] = useState(initialCondition);
  const [style, setStyle] = useState(displayMode);
  const [preview, setPreview] = useState(false);
  const condition = FIGHTER_STATES[selected];
  const previewVitals =
    !preview && selected === initialCondition ? vitals : undefined;
  const wear = fighterWearProfile(selected, previewVitals);
  const gear = gearWearProfile(selected, previewVitals);
  const gearLabels = [
    "기어 정비 완료",
    "상의·하의 실밥 터짐",
    "옆선 찢김 · 피부 드러남",
    "찢김 확대 · 한쪽 끈 풀림",
    "접힌 옷단 · 천 조각 분리",
  ];
  const wearLabel =
    [
      wear.sweat && (wear.sweat > 1 ? "많은 땀" : "땀"),
      wear.abrasion && "찰과상",
      wear.bruise && "멍",
      wear.blood && "혈흔",
    ]
      .filter(Boolean)
      .join(" · ") || "깨끗한 컨디션";
  return (
    <div className="condition-guide">
      <p>
        체력과 마음의 변화가 선수의 표정과 자세에 드러납니다. 아래 상태를 선택해{" "}
        {name}의 상태별 일러스트와 상의·하의의 찢김을 미리 볼 수 있습니다.
      </p>
      <div
        className="condition-style-options"
        role="group"
        aria-label="상태 미리보기 스타일"
      >
        <button
          type="button"
          aria-pressed={style === "classic"}
          onClick={() => setStyle("classic")}
        >
          카툰
        </button>
        <button
          type="button"
          aria-pressed={style === "sd"}
          onClick={() => setStyle("sd")}
        >
          SD 2D
        </button>
      </div>
      <div className="condition-preview" data-condition={condition.id}>
        {style === "sd" ? (
          <SDArtwork
            actor={actor}
            condition={selected}
            pose={["tired", "groggy"].includes(selected) ? "groggy" : "idle"}
            vitals={previewVitals}
            alt={`${name} · ${condition.label} SD 기어 상태`}
            className="condition-sd-body"
          />
        ) : (
          <FighterSprite
            actor={actor}
            condition={condition}
            name={name}
            side="preview"
            vitals={previewVitals}
          />
        )}
        <div className="condition-preview-copy">
          <div className="condition-face-heading">
            {style === "sd" ? (
              <SDArtwork
                actor={actor}
                condition={selected}
                pose={
                  ["tired", "groggy"].includes(selected) ? "groggy" : "idle"
                }
                vitals={previewVitals}
                alt={`${name} · ${condition.label} SD 표정 확대`}
                className="condition-face-portrait"
                portrait
              />
            ) : (
              <Artwork
                art={fighterPoseArt(actor, condition)}
                alt={`${name} · ${condition.label} 표정 확대`}
                className="condition-face-portrait"
                condition={condition.id}
                vitals={previewVitals}
                portrait
                position={[0.5, 0]}
              />
            )}
            <div>
              <span>{condition.subtitle}</span>
              <h3>{condition.label}</h3>
            </div>
          </div>
          <p>{condition.description}</p>
          {style === "classic" && (
            <p className="condition-wear-note">{wearLabel}</p>
          )}
          <p className="condition-gear-note" data-gear-summary={gear.level}>
            <span className="gear-wear-meter" aria-hidden="true">
              {[1, 2, 3, 4].map((step) => (
                <i key={step} data-active={gear.level >= step} />
              ))}
            </span>
            기어 {gear.level}/4 · {gearLabels[gear.level]}
          </p>
        </div>
      </div>
      <div
        className="condition-options"
        role="group"
        aria-label="선수 상태 미리보기"
      >
        {Object.values(FIGHTER_STATES).map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={selected === item.id}
            aria-label={`${item.label} 표정과 자세 미리보기. ${item.rule}`}
            onClick={() => {
              setPreview(true);
              setSelected(item.id);
            }}
          >
            <FighterCondition condition={item} />
            <span>{item.rule}</span>
          </button>
        ))}
      </div>
      <p className="condition-priority">
        체력이 25% 이하면 그로기, 50% 이하면 지침이 우선합니다. 그다음 압박 60
        이상, 열기 6 이상, 열기 3 이상 순서로 판단합니다. 미리보기는 실제 경기
        수치를 바꾸지 않습니다. 체력이 낮아질수록 찰과상과 멍이 늘고, 25%
        이하에서는 눈썹 부근에, 10% 이하에서는 입가에도 작은 혈흔이 나타납니다.
        회복하면 상처 표현도 완화됩니다.
      </p>
      <p className="condition-priority">
        열혈 → 좌절 → 지침 → 그로기 순으로 손상이 커집니다. 목둘레·가슴
        옆선·옆구리·골반 앞쪽 바깥 가장자리는 찢긴 틈으로 피부가 보이고,
        가슴·골반 중앙은 경기복이 덮습니다. 지침부터 한쪽 끈이 풀리고 옷단이
        접혀 벌어집니다. 같은 경기의 최고 손상은 회복·스타일 전환·새로고침
        후에도 유지되고, 다음 경기는 현재 컨디션에서 다시 시작합니다.
      </p>
    </div>
  );
}
