import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useIsPresent,
} from "motion/react";
import {
  Sword,
  MapTrifold,
  Stack,
  UsersThree,
  GearSix,
  Question,
  SpeakerHigh,
  SpeakerSlash,
  Heart,
  Shield,
  Lightning,
  Fire,
  Coins,
  Skull,
  ArrowRight,
  ArrowCounterClockwise,
  X,
  CaretRight,
  Trophy,
  Brain,
  Eye,
  HandFist,
  Sparkle,
  Crosshair,
  Moon,
  Check,
  Backpack,
  ArrowSquareOut,
  Coffee,
  Storefront,
  Footprints,
  Crown,
} from "@phosphor-icons/react";
import {
  CARDS,
  WRESTLERS,
  newRun,
  playCard,
  endTurn,
  chooseReward,
  advanceToNode,
  rest,
  buyItem,
  leaveShop,
  resolveEvent,
  upgradeCard,
  getCard,
  canPlayCard,
  mapForFloor,
} from "./game.js";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800-italic.css";
import "@fontsource/noto-sans-kr/korean-400.css";
import "@fontsource/noto-sans-kr/korean-700.css";
import "./style.css";

const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
const SAVE_KEY = "slay.run.v1";
const typeNames = {
  attack: "공격",
  skill: "기술",
  power: "능력",
  finisher: "피니셔",
  curse: "악몽",
  nightmare: "악몽",
  defense: "방어",
  guard: "방어",
};
const art = (id) =>
  asset(`${["raven", "valkyrie", "nova"].includes(id) ? id : "nova"}.webp`);
const portraitFor = (card) =>
  ["guard", "grapple"].includes(card.artKey)
    ? "valkyrie"
    : ["focus", "counter"].includes(card.artKey)
      ? "nova"
      : "raven";
const navItems = [
  { id: "battle", label: "아레나", icon: Sword },
  { id: "map", label: "챔피언 로드", icon: MapTrifold },
  { id: "deck", label: "내 덱", icon: Stack },
  { id: "roster", label: "선수", icon: UsersThree },
];

function loadRun() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (
      data?.saveVersion === 1 &&
      WRESTLERS[data.player?.id] &&
      Number.isFinite(data.player.hp) &&
      [
        "combat",
        "reward",
        "map",
        "rest",
        "event",
        "shop",
        "victory",
        "defeat",
      ].includes(data.phase) &&
      ["deck", "hand", "draw", "discard", "exhaust", "log", "relics"].every(
        (key) => Array.isArray(data[key]),
      ) &&
      ["deck", "hand", "draw", "discard", "exhaust"].every((key) =>
        data[key].every((c) => CARDS[c.id]),
      )
    )
      return data;
  } catch {}
  return newRun("raven", crypto.getRandomValues(new Uint32Array(1))[0]);
}

function useSound() {
  const [enabled, setEnabled] = useState(false);
  const ctx = useRef(null);
  const play = (kind) => {
    if (!enabled) return;
    try {
      ctx.current ||= new (window.AudioContext || window.webkitAudioContext)();
      const c = ctx.current;
      c.resume();
      const osc = c.createOscillator(),
        gain = c.createGain();
      osc.type = kind === "attack" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(
        kind === "attack" ? 170 : 660,
        c.currentTime,
      );
      osc.frequency.exponentialRampToValueAtTime(
        kind === "attack" ? 40 : 330,
        c.currentTime + 0.16,
      );
      gain.gain.setValueAtTime(0.16, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.24);
    } catch {}
  };
  useEffect(
    () => () => {
      ctx.current?.close();
    },
    [],
  );
  return { enabled, toggle: () => setEnabled((v) => !v), play };
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          {subtitle && <span className="eyebrow">{subtitle}</span>}
          <h2>{title}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="닫기">
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function Card({
  instance,
  onClick,
  index,
  disabled = false,
  compact = false,
  ref,
}) {
  const present = useIsPresent();
  const card = getCard(instance);
  if (!card) return null;
  const finisher = card.type === "finisher" || card.artKey === "finisher";
  const nightmare = ["nightmare", "curse"].includes(card.type);
  const Element = onClick ? motion.button : motion.article;
  const sceneArt = ["strike", "finisher"].includes(card.artKey)
    ? "card-strike.webp"
    : ["guard", "grapple"].includes(card.artKey)
      ? "card-guard.webp"
      : "card-focus.webp";
  return (
    <Element
      ref={ref}
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        y: -55,
        scale: 0.85,
        transition: { duration: 0.18, delay: 0 },
      }}
      transition={{ duration: 0.22, delay: (index || 0) * 0.035 }}
      className={`game-card ${finisher ? "finisher" : ""} ${nightmare ? "nightmare" : ""} ${compact ? "compact" : ""} ${disabled ? "unplayable" : ""}`}
      onClick={onClick}
      disabled={disabled || !present}
      aria-hidden={!present || undefined}
      tabIndex={!present ? -1 : undefined}
      aria-label={`${card.name}, 에너지 ${card.cost}, ${card.description}`}
    >
      <div className="card-top">
        <span className="card-cost">{card.cost}</span>
        <span className="card-type">{typeNames[card.type] || "기술"}</span>
        {finisher ? <Crown size={15} /> : <span className="rarity-dot" />}
      </div>
      <div
        className={`card-art ${card.artKey || card.type} ${sceneArt ? "scene-art" : ""}`}
      >
        <img src={sceneArt ? asset(sceneArt) : art(portraitFor(card))} alt="" />
        <span className="card-art-shade" />
        {nightmare && <Moon className="curse-icon" size={48} />}
      </div>
      <div className="card-text">
        <h3>{card.name}</h3>
        <span className="card-en">
          {card.nameEn || card.id?.toUpperCase().replaceAll("_", " ")}
        </span>
        <p>{card.description}</p>
      </div>
      <div className="card-foot">
        <span>
          {card.rarity === "rare"
            ? "RARE"
            : card.rarity === "uncommon"
              ? "UNCOMMON"
              : "COMMON"}
        </span>
        {index != null && <kbd>{index === 9 ? 0 : index + 1}</kbd>}
      </div>
    </Element>
  );
}

function Health({ hp, maxHp, block, enemy }) {
  return (
    <div className={`health ${enemy ? "enemy" : ""}`}>
      <div className="health-label">
        <Heart size={14} weight="fill" />
        <strong>
          {hp}
          <small> / {maxHp}</small>
        </strong>
        {block > 0 && (
          <span className="block-stat">
            <Shield size={14} weight="fill" />
            {block}
          </span>
        )}
      </div>
      <div className="health-track">
        <div style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }} />
      </div>
    </div>
  );
}

function RouteMap({ state, onChoose, preview = false }) {
  const nodeIcon = (type) =>
    ({
      fight: Sword,
      combat: Sword,
      elite: Skull,
      rest: Coffee,
      event: Eye,
      shop: Storefront,
      boss: Crown,
    })[type] || Sword;
  return (
    <div className="route-view">
      <div className="route-intro">
        <span className="eyebrow">THE ROAD TO GLORY</span>
        <h2>
          모든 선택이
          <br />
          <em>당신의 경기를 바꾼다.</em>
        </h2>
        <p>경기를 치르고, 덱을 다듬고, 최후의 챔피언에게 도전하세요.</p>
      </div>
      <div className="route-progress">
        {Array.from({ length: 8 }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`route-step ${i < state.floor - 1 ? "done" : ""} ${i === state.floor - 1 ? "current" : ""}`}
            >
              {i < state.floor - 1 ? (
                <Check size={15} />
              ) : i === 7 ? (
                <Crown size={18} />
              ) : (
                i + 1
              )}
            </div>
            {i < 7 && <span />}
          </React.Fragment>
        ))}
      </div>
      <div className="route-choices">
        {(state.mapNodes?.length
          ? state.mapNodes
          : state.floor < 8 && !["victory", "defeat"].includes(state.phase)
            ? mapForFloor(state.floor + 1)
            : []
        ).map((node) => {
          const Icon = nodeIcon(node.type);
          return (
            <button
              key={node.index}
              className={`route-node ${node.type}`}
              onClick={() => onChoose(node.index)}
              disabled={preview || state.phase !== "map"}
            >
              <Icon size={30} />
              <span className="eyebrow">{node.type.toUpperCase()}</span>
              <h3>{node.label}</h3>
              <p>{node.description}</p>
              <span className="node-enter">
                {preview ? "다음 갈림길에서 선택" : "이 길로 진입"}
                <ArrowRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
      {preview && (
        <p className="muted route-note">
          현재 구간을 마치면 다음 경로를 선택할 수 있습니다.
        </p>
      )}
    </div>
  );
}

function App() {
  const [state, setState] = useState(loadRun);
  const [modal, setModal] = useState(null);
  const [nav, setNav] = useState("battle");
  const [hit, setHit] = useState(null);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("slay.theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const sound = useSound();
  const wrestler = WRESTLERS[state.player.id] || WRESTLERS.raven;
  const toastTimer = useRef(null);
  const hitTimer = useRef(null);
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  useEffect(() => {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ ...state, saveVersion: 1 }),
      );
    } catch {
      notify(
        "저장 공간을 사용할 수 없습니다. 이 탭에서는 계속 플레이할 수 있습니다.",
      );
    }
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("slay.theme", theme);
    } catch {}
  }, [theme]);
  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(hitTimer.current);
    },
    [],
  );
  const act = (fn) => setState((current) => fn(current));
  const play = (uid) => {
    if (state.phase !== "combat") return;
    const card = getCard(state.hand.find((c) => c.uid === uid));
    const next = playCard(state, uid);
    if (next === state) {
      notify(
        card?.type === "finisher"
          ? "피니셔에는 관중 열기 3이 필요합니다."
          : "에너지가 부족하거나 사용할 수 없는 카드입니다.",
      );
      return;
    }
    const damage = state.enemy.hp - next.enemy.hp;
    const block = next.player.block - state.player.block;
    setHit({
      target: damage > 0 ? "enemy" : "player",
      text: damage > 0 ? `-${damage}` : block > 0 ? `+${block} 가드` : "FOCUS",
      id: Date.now(),
    });
    clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(() => setHit(null), 650);
    sound.play(damage > 0 ? "attack" : "skill");
    setState(next);
  };
  const end = () => {
    const next = endTurn(state);
    if (next === state) return;
    const damage = state.player.hp - next.player.hp;
    if (damage > 0) {
      setHit({ target: "player", text: `-${damage}`, id: Date.now() });
      clearTimeout(hitTimer.current);
      hitTimer.current = setTimeout(() => setHit(null), 650);
    }
    sound.play("attack");
    setState(next);
  };
  useEffect(() => {
    const key = (e) => {
      if (
        modal ||
        nav !== "battle" ||
        e.target.closest("input,textarea,select,[contenteditable='true']") ||
        e.repeat
      )
        return;
      if (/^[0-9]$/.test(e.key)) {
        const c = state.hand[e.key === "0" ? 9 : Number(e.key) - 1];
        if (c) play(c.uid);
      }
      if (e.code === "Space" && state.phase === "combat") {
        if (e.target.closest("button,a,[role='button']")) return;
        e.preventDefault();
        end();
      }
      if (e.key === "Escape") {
        setNav("battle");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [state, modal, nav, sound.enabled]);
  const startRun = (id) => {
    setState(newRun(id, crypto.getRandomValues(new Uint32Array(1))[0]));
    setModal(null);
    setNav("battle");
    notify("새로운 챔피언 로드가 시작됩니다.");
  };
  const navigate = (id) => {
    if (id === "deck" || id === "roster") setModal(id);
    else setNav(id);
  };
  const intent = state.enemy?.intent;
  const enemyHUD = state.enemy || {
    name: "NEXT CHALLENGER",
    title: "WAITING IN THE WINGS",
    hp: 0,
    maxHp: 1,
    block: 0,
  };
  const intentAttack = intent?.type === "attack" || intent?.type === "heavy";
  const activePhase = state.phase;
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <aside className="sidebar">
          <a
            href={import.meta.env.BASE_URL}
            className="brand"
            aria-label="SLAY 홈"
          >
            S<span className="brand-cut" />
          </a>
          <div className="sidebar-rule" />
          <nav>
            {navItems.map((item) => (
              <button
                key={item.id}
                title={item.label}
                aria-label={item.label}
                aria-current={
                  nav === item.id || modal === item.id ? "page" : undefined
                }
                className={`nav-button ${nav === item.id || modal === item.id ? "active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <item.icon
                  size={24}
                  weight={nav === item.id ? "fill" : "regular"}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button
              className="nav-button"
              onClick={() => setModal("help")}
              title="플레이 가이드"
              aria-label="플레이 가이드"
            >
              <Question size={23} />
            </button>
            <button
              className="nav-button"
              onClick={() => setModal("settings")}
              title="설정"
              aria-label="설정"
            >
              <GearSix size={23} />
            </button>
            <div className="profile">
              <img src={art(state.player.id)} alt={wrestler.name} />
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="wordmark">
              SLAY<span>RING OF NIGHTMARES</span>
            </div>
            <div className="top-breadcrumb">
              챔피언 로드
              <CaretRight size={12} />
              <strong>언더그라운드</strong>
            </div>
            <div className="top-actions">
              <span
                className="coins"
                title="보유 크레딧"
                aria-label={`보유 크레딧 ${state.player.coins}`}
              >
                <Coins size={19} weight="duotone" />
                <strong>{state.player.coins}</strong>
              </span>
              <button
                className="icon-button audio"
                onClick={sound.toggle}
                aria-label={sound.enabled ? "효과음 끄기" : "효과음 켜기"}
                title={sound.enabled ? "효과음 끄기" : "효과음 켜기"}
              >
                {sound.enabled ? (
                  <SpeakerHigh size={20} />
                ) : (
                  <SpeakerSlash size={20} />
                )}
              </button>
              <button
                className="icon-button settings-top"
                aria-label="설정"
                onClick={() => setModal("settings")}
              >
                <GearSix size={18} />
              </button>
              <button
                className="help-button"
                aria-label="플레이 가이드"
                onClick={() => setModal("help")}
              >
                <Question size={17} />
                <span>플레이 가이드</span>
              </button>
            </div>
          </header>
          <main>
            <div className="chapter-header">
              <div>
                <div className="chapter-label">
                  <span>CHAPTER 01</span>
                  <span className="label-line" />
                  <span>
                    {state.floor === 8 ? "CHAMPIONSHIP" : "THE UNDERGROUND"}
                  </span>
                </div>
                <h1>
                  {state.floor === 8
                    ? "THE FINAL RECKONING"
                    : "THE UNDERGROUND"}
                  <span className="heading-point">.</span>
                </h1>
                <p>
                  {state.floor === 8
                    ? "왕관은 단 한 명의 것이다."
                    : "빛이 닿지 않는 링. 당신의 전설은 여기서 시작된다."}
                </p>
              </div>
              <button className="floor-button" onClick={() => setNav("map")}>
                <Footprints size={20} />
                <span>
                  현재 구간
                  <strong>
                    {String(state.floor).padStart(2, "0")}
                    <small> / 08</small>
                  </strong>
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
            {nav === "map" ? (
              <section className="map-panel">
                <button
                  className="text-button back"
                  onClick={() => setNav("battle")}
                >
                  <ArrowRight
                    size={16}
                    style={{ transform: "rotate(180deg)" }}
                  />
                  아레나로 돌아가기
                </button>
                <RouteMap
                  state={state}
                  onChoose={(i) => {
                    act((s) => advanceToNode(s, i));
                    setNav("battle");
                  }}
                  preview={state.phase !== "map"}
                />
              </section>
            ) : (
              <>
                <section
                  className={`arena ${activePhase === "reward" ? "reward-arena" : ""} ${hit?.target === "player" ? "player-hit" : ""}`}
                  aria-label="전투 아레나"
                >
                  <img
                    className="arena-background"
                    src={asset("arena.webp")}
                    alt="붉은 링 로프와 스포트라이트가 비추는 지하 프로레슬링 경기장"
                    fetchPriority="high"
                  />
                  <div className="arena-shade" />
                  <div className="fighter-hud player-hud">
                    <span className="fighter-side">YOUR WRESTLER</span>
                    <div className="fighter-name">
                      <h2>{wrestler.name || "RAVEN"}</h2>
                      <span>{wrestler.title || "THE CRIMSON REAPER"}</span>
                    </div>
                    <Health {...state.player} />
                    <div className="fighter-status">
                      <span>
                        <Shield size={14} />
                        가드 {state.player.block}
                      </span>
                      <span>
                        <Fire size={14} />
                        열기 {state.player.hype}
                      </span>
                    </div>
                  </div>
                  <div className="round-label">
                    <span>ROUND</span>
                    <strong>{String(state.turn).padStart(2, "0")}</strong>
                    <span className="round-line" />
                  </div>
                  <div
                    className="fighter-hud enemy-hud"
                    aria-hidden={!state.enemy}
                  >
                    <span className="fighter-side">
                      {state.floor === 8 ? "FINAL BOSS" : "OPPONENT"}
                    </span>
                    <div className="fighter-name">
                      <h2>{enemyHUD.name}</h2>
                      <span>{enemyHUD.title}</span>
                    </div>
                    <Health {...enemyHUD} enemy />
                    <div
                      className={`intent ${intentAttack ? "attack" : ""}`}
                      title="턴을 종료하면 상대가 이 행동을 합니다."
                    >
                      {intentAttack ? (
                        <Sword size={16} />
                      ) : intent?.type === "guard" ? (
                        <Shield size={16} />
                      ) : (
                        <Brain size={16} />
                      )}
                      <span>
                        {intentAttack
                          ? "다음 행동: 공격"
                          : intent?.type === "guard"
                            ? "다음 행동: 가드"
                            : "다음 행동: 압박"}
                        <strong>{intent?.value}</strong>
                      </span>
                      <Eye size={13} />
                    </div>
                  </div>
                  <div
                    className={`fighter player-fighter ${hit?.target === "player" ? "hit" : ""}`}
                  >
                    <img
                      src={art(state.player.id)}
                      alt={`${wrestler.name} 선수`}
                    />
                  </div>
                  <div
                    className={`fighter enemy-fighter ${hit?.target === "enemy" ? "hit" : ""}`}
                    aria-hidden={!state.enemy}
                  >
                    <img
                      src={art(
                        state.enemy?.artKey || state.enemy?.id || "valkyrie",
                      )}
                      alt={`${enemyHUD.name} 선수`}
                    />
                  </div>
                  <span className="vs-mark">VS</span>
                  <AnimatePresence>
                    {hit && (
                      <motion.div
                        key={hit.id}
                        className={`damage-number ${hit.target}`}
                        initial={{ opacity: 1, y: 15, scale: 0.7 }}
                        animate={{ opacity: 0, y: -55, scale: 1.15 }}
                        transition={{ duration: 0.65 }}
                      >
                        {hit.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="arena-bottom">
                    <span className="arena-location">
                      <Crosshair size={15} />
                      UNDERGROUND ARENA
                    </span>
                    <div className="turn-badge">
                      <span />
                      {activePhase === "combat"
                        ? "YOUR TURN"
                        : activePhase === "defeat"
                          ? "MATCH ENDED"
                          : "MATCH COMPLETE"}
                    </div>
                    <span className="arena-match">
                      {state.floor === 8 ? "TITLE MATCH" : "SINGLES MATCH"}
                    </span>
                  </div>
                  {activePhase !== "combat" && (
                    <div className="phase-overlay">
                      <PhasePanel
                        state={state}
                        act={act}
                        startRun={startRun}
                        setModal={setModal}
                      />
                    </div>
                  )}
                </section>
                <div className="combat-strip">
                  <div className="stress-meter">
                    <Brain size={19} />
                    <div>
                      <span>
                        심리적 압박{" "}
                        <strong>
                          {state.player.stress}
                          <small> / 100</small>
                        </strong>
                      </span>
                      <div className="stress-track">
                        <span style={{ width: `${state.player.stress}%` }} />
                      </div>
                    </div>
                    <span
                      className="stress-info"
                      title="압박이 쌓이면 악몽 카드가 덱에 추가됩니다."
                    >
                      악몽을 경계하세요
                    </span>
                  </div>
                  <div className="combo-meter">
                    <Fire size={19} />
                    <span>
                      COMBO <strong>{state.combo || 0}</strong>
                    </span>
                    <span className="combo-divide" />
                    <span>피니셔 열기</span>
                    <div className="hype-pips">
                      {Array.from({ length: 3 }, (_, i) => (
                        <span
                          key={i}
                          className={state.player.hype > i ? "on" : ""}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <section
                  className={`hand-area ${activePhase !== "combat" ? "inactive-hand" : ""}`}
                  aria-label="손에 든 카드"
                >
                  <div className="hand-controls">
                    <div className="energy-orb">
                      <Lightning size={28} weight="fill" />
                      <strong>
                        {state.energy}
                        <small>/{state.maxEnergy || 3}</small>
                      </strong>
                    </div>
                    <span className="energy-label">ENERGY</span>
                    <button
                      className="pile-button"
                      onClick={() => setModal("draw")}
                    >
                      <Stack size={21} />
                      <strong>{state.draw.length}</strong>
                      <span>드로우 덱</span>
                    </button>
                  </div>
                  <div className="hand-main">
                    <div className="hand-heading">
                      <h2>
                        당신의 패<span>{state.hand.length} CARDS</span>
                      </h2>
                      <span>
                        카드를 선택해 플레이하세요 <kbd>1</kbd>
                        <span className="shortcut-range">~</span>
                        <kbd>
                          {state.hand.length === 10
                            ? 0
                            : state.hand.length || 5}
                        </kbd>
                      </span>
                    </div>
                    <div className="card-hand">
                      <AnimatePresence mode="popLayout">
                        {state.hand.map((c, i) => (
                          <Card
                            key={c.uid}
                            instance={c}
                            index={i}
                            onClick={() => play(c.uid)}
                            disabled={!canPlayCard(state, c)}
                          />
                        ))}
                      </AnimatePresence>
                      {state.hand.length === 0 && (
                        <div className="empty-hand">
                          <Stack size={32} />
                          <p>패가 비었습니다.</p>
                          <span>
                            {activePhase === "combat"
                              ? "턴을 종료해 새로운 카드를 드로우하세요."
                              : "다음 경기를 준비하세요."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="turn-controls">
                    <button
                      className="end-turn"
                      onClick={end}
                      disabled={activePhase !== "combat"}
                    >
                      <span>턴 종료</span>
                      <ArrowRight size={19} />
                      <kbd>SPACE</kbd>
                    </button>
                    <button
                      className="pile-button discard"
                      onClick={() => setModal("discard")}
                    >
                      <Backpack size={21} />
                      <strong>{state.discard.length}</strong>
                      <span>버린 카드</span>
                    </button>
                  </div>
                </section>
                <footer className="game-footer">
                  <button
                    className="text-button"
                    onClick={() => setModal("log")}
                  >
                    <Eye size={14} />
                    경기 기록
                    <ArrowSquareOut size={12} />
                  </button>
                  <span>카드 순서를 설계하세요. 링의 흐름을 바꾸세요.</span>
                  <span className="autosave">
                    <Check size={12} />
                    자동 저장
                  </span>
                </footer>
              </>
            )}
          </main>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              className="toast"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Sparkle size={18} />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        {modal && (
          <Modal
            title={
              {
                deck: "나의 덱",
                draw: "드로우 덱",
                discard: "버린 카드",
                roster: "CHOOSE YOUR WRESTLER",
                settings: "설정",
                help: "링에 오를 준비가 되었나요?",
                log: "경기 기록",
                upgrade: "카드 강화",
              }[modal]
            }
            subtitle={
              {
                deck: `${state.deck.length} CARDS IN YOUR DECK`,
                roster: "THE CONTENDERS",
                help: "HOW TO PLAY",
                upgrade: "TRAINING ROOM",
              }[modal]
            }
            wide={["deck", "draw", "discard", "roster", "upgrade"].includes(
              modal,
            )}
            onClose={() => setModal(null)}
          >
            {["deck", "draw", "discard", "upgrade"].includes(modal) && (
              <>
                <p className="muted modal-desc">
                  {modal === "upgrade"
                    ? "강화할 카드를 선택하세요. 한 장을 영구적으로 강화합니다."
                    : modal === "draw"
                      ? "드로우 순서는 공개되지 않습니다. 덱이 비면 버린 카드를 섞습니다."
                      : modal === "deck"
                        ? "보상과 상점에서 카드를 추가하고, 휴식 구간에서 강화할 수 있습니다."
                        : "턴 종료 때 남은 패를 버립니다. 소멸한 카드는 이 경기에 돌아오지 않습니다."}
                </p>
                <div className="deck-grid">
                  {(modal === "upgrade"
                    ? state.deck.filter(
                        (c) =>
                          !c.upgraded &&
                          !["nightmare", "curse"].includes(getCard(c).type),
                      )
                    : modal === "deck"
                      ? state.deck
                      : state[modal]
                  ).map((c) => (
                    <Card
                      key={c.uid}
                      instance={c}
                      compact
                      onClick={
                        modal === "upgrade"
                          ? () => {
                              act((s) => upgradeCard(s, c.uid));
                              setModal(null);
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
                {modal !== "upgrade" &&
                  modal !== "deck" &&
                  state[modal].length === 0 && (
                    <div className="empty-state">
                      <Stack size={38} />
                      <p>이 카드 더미는 비어 있습니다.</p>
                    </div>
                  )}
              </>
            )}
            {modal === "roster" && (
              <>
                <p className="muted modal-desc">
                  선수마다 시작 덱과 전투 방식이 다릅니다. 선택하면 새 런을
                  시작합니다.
                </p>
                <div className="roster-grid">
                  {Object.entries(WRESTLERS).map(([id, w]) => (
                    <div className={`roster-card ${id}`} key={id}>
                      <img src={art(id)} alt={w.name} />
                      <div>
                        <span className="eyebrow">{w.title}</span>
                        <h3>{w.name}</h3>
                        <div className="roster-stats">
                          <span>
                            <Heart size={13} weight="fill" />
                            {w.maxHp}
                          </span>
                          <span>{w.passive}</span>
                        </div>
                        <p>
                          {w.description ||
                            (id === "raven"
                              ? "공격 콤보와 폭발적인 피니셔로 링을 지배합니다."
                              : id === "valkyrie"
                                ? "견고한 가드와 그래플링으로 흐름을 뒤집습니다."
                                : "빠른 드로우와 침착함으로 압박을 극복합니다.")}
                        </p>
                        <button
                          className="primary-button"
                          onClick={() => startRun(id)}
                        >
                          이 선수로 새 런 시작
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {modal === "help" && (
              <div className="guide">
                <p>
                  당신은 언더그라운드에서 챔피언을 향해 올라가는
                  프로레슬러입니다. 8개 구간을 돌파하고 최종 타이틀 매치를
                  승리하세요.
                </p>
                <div className="guide-row">
                  <Lightning size={26} />
                  <div>
                    <h3>에너지로 카드 플레이</h3>
                    <p>
                      매 턴 에너지 3과 카드 5장을 받습니다. 상대의 다음 행동을
                      보고 공격과 가드를 조합하세요. 남은 가드는 다음 턴에
                      사라집니다.
                    </p>
                  </div>
                </div>
                <div className="guide-row">
                  <Fire size={26} />
                  <div>
                    <h3>콤보로 피니셔 완성</h3>
                    <p>
                      공격을 연결해 열기를 쌓으세요. 관중 열기 3으로 피니셔를
                      사용할 수 있습니다. 카드 순서가 중요합니다.
                    </p>
                  </div>
                </div>
                <div className="guide-row">
                  <Brain size={26} />
                  <div>
                    <h3>압박과 악몽</h3>
                    <p>
                      상대의 도발은 심리적 압박을 높입니다. 압박 35부터 악몽이
                      덱에 추가됩니다. 악몽 카드도 에너지로 해소할 수 있습니다.
                      집중과 명상으로 압박을 관리하세요.
                    </p>
                  </div>
                </div>
                <div className="guide-row">
                  <MapTrifold size={26} />
                  <div>
                    <h3>나만의 덱, 나만의 경로</h3>
                    <p>
                      승리 후 카드 보상을 선택합니다. 갈림길에서 경기, 정예,
                      휴식, 상점, 이벤트를 선택하세요. 런은 브라우저에 자동
                      저장됩니다.
                    </p>
                  </div>
                </div>
                <div className="guide-shortcuts">
                  <span>
                    <kbd>1</kbd> ~ <kbd>9</kbd>, <kbd>0</kbd> 카드 플레이
                  </span>
                  <span>
                    <kbd>SPACE</kbd> 턴 종료
                  </span>
                  <span>
                    <kbd>ESC</kbd> 닫기
                  </span>
                </div>
                <button
                  className="primary-button full"
                  onClick={() => setModal(null)}
                >
                  링으로 돌아가기
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
            {modal === "settings" && (
              <div className="settings-content">
                <div className="setting-row">
                  <span>효과음</span>
                  <button
                    className={`toggle ${sound.enabled ? "on" : ""}`}
                    aria-pressed={sound.enabled}
                    onClick={sound.toggle}
                  >
                    {sound.enabled ? "켜짐" : "꺼짐"}
                  </button>
                </div>
                <div className="setting-row">
                  <span>화면 테마</span>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setTheme((v) => (v === "dark" ? "light" : "dark"))
                    }
                  >
                    {theme === "dark" ? "다크" : "라이트"}
                  </button>
                </div>
                <p className="muted">
                  현재 런은 자동으로 저장됩니다. 새 런을 시작하면 현재 진행을 새
                  경기로 바꿉니다.
                </p>
                <button
                  className="secondary-button full"
                  onClick={() => setModal("roster")}
                >
                  <ArrowCounterClockwise size={18} />새 런 시작
                </button>
              </div>
            )}
            {modal === "log" && (
              <div className="match-log">
                {(state.log || [])
                  .slice()
                  .reverse()
                  .map((line, i) => (
                    <p key={i}>
                      <span>
                        {String(state.log.length - i).padStart(2, "0")}
                      </span>
                      {typeof line === "string"
                        ? line
                        : line.text || JSON.stringify(line)}
                    </p>
                  ))}
              </div>
            )}
          </Modal>
        )}
      </div>
    </MotionConfig>
  );
}

function PhasePanel({ state, act, startRun, setModal }) {
  if (state.phase === "reward")
    return (
      <div className="reward-panel">
        <span className="eyebrow">VICTORY IS YOURS</span>
        <h2>
          MATCH WON<span>.</span>
        </h2>
        <p>당신의 덱에 새로운 기술을 더하세요.</p>
        <div className="reward-cards">
          {state.rewards.map((id) => (
            <Card
              key={id}
              instance={id}
              onClick={() => act((s) => chooseReward(s, id))}
              compact
            />
          ))}
        </div>
        <button
          className="text-button"
          onClick={() => act((s) => chooseReward(s, null))}
        >
          카드 보상 건너뛰기
          <ArrowRight size={15} />
        </button>
      </div>
    );
  if (state.phase === "map")
    return (
      <div className="phase-box">
        <RouteMap
          state={state}
          onChoose={(i) => act((s) => advanceToNode(s, i))}
        />
      </div>
    );
  if (state.phase === "rest")
    return (
      <div className="phase-box small">
        <Coffee size={36} />
        <span className="eyebrow">BACKSTAGE</span>
        <h2>다시 링에 오르기 전에.</h2>
        <p>한 번의 휴식으로 몸을 회복하거나, 마음과 기술을 다듬으세요.</p>
        <div className="phase-actions">
          <button onClick={() => act((s) => rest(s, "heal"))}>
            <Heart size={23} />
            <strong>회복</strong>
            <span>체력 30% 회복</span>
          </button>
          <button onClick={() => act((s) => rest(s, "meditate"))}>
            <Brain size={23} />
            <strong>명상</strong>
            <span>압박 감소 · 악몽 제거</span>
          </button>
          <button onClick={() => setModal("upgrade")}>
            <Sparkle size={23} />
            <strong>훈련</strong>
            <span>카드 한 장 강화</span>
          </button>
        </div>
      </div>
    );
  if (state.phase === "shop")
    return (
      <div className="phase-box small">
        <Storefront size={32} />
        <span className="eyebrow">THE CORNER STORE</span>
        <h2>다음 경기를 위한 준비.</h2>
        <p>
          보유 크레딧 <strong>{state.player.coins}</strong>
        </p>
        <div className="shop-list">
          {state.shopItems.map((item) => (
            <button
              key={item.id}
              onClick={() => act((s) => buyItem(s, item.id))}
              disabled={
                state.player.coins < item.cost ||
                item.sold ||
                (item.kind === "heal" &&
                  state.player.hp === state.player.maxHp) ||
                (item.kind === "upgrade" &&
                  !state.deck.some((c) => !c.upgraded && c.id !== "nightmare"))
              }
            >
              <div>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </div>
              <span>
                {item.sold ? (
                  "구매 완료"
                ) : (
                  <>
                    <Coins size={15} />
                    {item.cost}
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
        <button
          className="primary-button full"
          onClick={() => act((s) => leaveShop(s))}
        >
          상점 나가기
          <ArrowRight size={17} />
        </button>
      </div>
    );
  if (state.phase === "event")
    return (
      <div className="phase-box small">
        <Eye size={34} />
        <span className="eyebrow">AN UNEXPECTED ENCOUNTER</span>
        <h2>{state.event?.name || state.event?.title}</h2>
        <p>{state.event?.description}</p>
        <div className="event-choices">
          {state.event?.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => act((s) => resolveEvent(s, choice.id))}
            >
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  return (
    <div className="phase-box final small">
      {state.phase === "victory" ? (
        <Trophy size={54} weight="duotone" />
      ) : (
        <Skull size={50} />
      )}
      <span className="eyebrow">
        {state.phase === "victory"
          ? "THE NEW CHAMPION"
          : "EVERY LEGEND HAS A BEGINNING"}
      </span>
      <h2>
        {state.phase === "victory" ? "THE RING IS YOURS." : "DOWN. NEVER OUT."}
      </h2>
      <p>
        {state.phase === "victory"
          ? "타이틀 매치에서 승리했습니다. 당신이 새로운 챔피언입니다."
          : `${state.floor}번째 구간에서 경기가 끝났습니다. 다른 덱과 경로로 다시 도전하세요.`}
      </p>
      <button
        className="primary-button"
        onClick={() => startRun(state.player.id)}
      >
        다시 도전하기
        <ArrowCounterClockwise size={18} />
      </button>
      <button className="text-button" onClick={() => setModal("roster")}>
        다른 선수 선택
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
