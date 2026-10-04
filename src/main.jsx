import React, { useEffect, useId, useRef, useState } from "react";
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
  ArrowLeft,
  ArrowCounterClockwise,
  X,
  CaretRight,
  Trophy,
  Brain,
  Eye,
  HandFist,
  Sparkle,
  Crosshair,
  Check,
  Backpack,
  ArrowSquareOut,
  Coffee,
  Storefront,
  Footprints,
  Crown,
  BookOpen,
  List,
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
  normalizeRun,
  ITEMS,
  GIMMICKS,
  ITEM_CAPACITY,
  GIMMICK_CAPACITY,
  useItem,
  equipGimmick,
  claimLoot,
  getRestChoices,
  canResolveEventChoice,
} from "./game.js";
import { getCardDetail, CARD_RARITY_LABELS } from "./card-library.js";
import { CardGuidePage, CardLibraryPage } from "./KnowledgePages.jsx";
import { Roster } from "./Roster.jsx";
import { createCombatQA } from "./combat-qa.js";
import { createJourneyQA, JOURNEY_QA_PROFILES } from "./journey-qa.js";
import {
  selectFighterState,
  createCardCue,
  createArenaImpact,
  fighterPoseArt,
} from "./presentation.js";
import {
  FighterSprite,
  FighterCondition,
  TechniqueScene,
  ArenaImpact,
  ConditionGuide,
} from "./CombatPresentation.jsx";
import {
  ChampionRoad,
  InventoryTrigger,
  JourneyInventory,
  RewardLoot,
  JourneyLocation,
  RunArrival,
} from "./RunJourney.jsx";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800-italic.css";
import "@fontsource/noto-sans-kr/korean-400.css";
import "@fontsource/noto-sans-kr/korean-700.css";
import "./style.css";
import { Artwork } from "./Artwork.jsx";
import "./arena-layout.css";
import "./roster.css";
import "./typography.css";

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
function eventChoiceUnavailable(state, choice) {
  const effects = choice.effects || {};
  if (effects.damage && state.player.hp <= effects.damage)
    return `체력 부족 · 최소 ${effects.damage + 1} 필요`;
  if (effects.coins < 0 && state.player.coins < -effects.coins)
    return `크레딧 부족 · ${-effects.coins} 필요`;
  if (effects.item && state.inventory.length >= ITEM_CAPACITY)
    return `소모품 가방이 가득 찼습니다 (${ITEM_CAPACITY}/${ITEM_CAPACITY})`;
  if (effects.gimmick && state.gimmicks.length >= GIMMICK_CAPACITY)
    return `기믹 보관함이 가득 찼습니다 (${GIMMICK_CAPACITY}/${GIMMICK_CAPACITY})`;
  return canResolveEventChoice(state, choice.id)
    ? null
    : "지금 선택할 수 없습니다";
}
const navItems = [
  { id: "battle", label: "아레나", icon: Sword },
  { id: "map", label: "챔피언 로드", icon: MapTrifold },
  { id: "deck", label: "내 덱", icon: Stack },
  { id: "roster", label: "선수", icon: UsersThree },
  { id: "cards", label: "카드 도감", icon: BookOpen },
  { id: "inventory", label: "코너 보관함", icon: Backpack },
];
const pageFromHash = () =>
  ({ "#cards": "cards", "#guide": "guide", "#map": "map" })[
    window.location.hash
  ] || "battle";

function loadRun() {
  if (import.meta.env.DEV) {
    const query = new URLSearchParams(window.location.search);
    if (JOURNEY_QA_PROFILES.includes(query.get("qaJourney")))
      return createJourneyQA(query.get("qaJourney"));
    if (["5", "10"].includes(query.get("qaHand")))
      return createCombatQA({
        hand: query.get("qaHand"),
        impact: query.get("qaImpact"),
      });
  }
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
      return normalizeRun(data);
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

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  className = "",
  closeLabel = "닫기",
}) {
  const ref = useRef(null);
  const heading = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""} ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          {subtitle && <span className="eyebrow">{subtitle}</span>}
          <h2 id={titleId} ref={heading} tabIndex={-1}>
            {title}
          </h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={closeLabel}
        >
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
  selected = false,
  unplayable = false,
  fanPosition,
  ref,
}) {
  const present = useIsPresent();
  const card = getCard(instance);
  if (!card) return null;
  const detail = getCardDetail(instance);
  const finisher = card.type === "finisher" || card.artKey === "finisher";
  const nightmare = ["nightmare", "curse"].includes(card.type);
  const Element = onClick ? motion.button : motion.article;
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
      className={`game-card ${finisher ? "finisher" : ""} ${nightmare ? "nightmare" : ""} ${compact ? "compact" : ""} ${unplayable || disabled ? "unplayable" : ""} ${selected ? "is-selected" : ""}`}
      style={
        index != null
          ? { "--fan-position": fanPosition, "--card-index": index }
          : undefined
      }
      onClick={onClick}
      disabled={disabled || !present}
      aria-hidden={!present || undefined}
      aria-pressed={index != null ? selected : undefined}
      tabIndex={!present ? -1 : undefined}
      aria-label={`${card.name}, ${detail.discipline}, 에너지 ${card.cost}, ${card.description}`}
    >
      {index != null && (
        <span className="card-peek" aria-hidden="true">
          <span className="peek-cost">{card.cost}</span>
          <span className="peek-index">{index === 9 ? 0 : index + 1}</span>
          <span className="peek-name">{card.name}</span>
        </span>
      )}
      <div className="card-top">
        <span className="card-cost">{card.cost}</span>
        <span
          className={`card-type technique-label technique-${detail.disciplineSlug}`}
          title={`카드 유형: ${typeNames[card.type]} · 기술 분류: ${detail.discipline}`}
        >
          {detail.discipline}
        </span>
        {finisher ? <Crown size={15} /> : <span className="rarity-dot" />}
      </div>
      <div
        className={`card-art ${card.artKey || card.type} scene-art technique-art`}
      >
        <Artwork
          art={detail.art}
          alt={detail.alt}
          loading={compact ? "lazy" : undefined}
        />
        <span className="card-art-shade" />
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
          {CARD_RARITY_LABELS[card.rarity]} · {typeNames[card.type]}
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

function App() {
  const [state, setState] = useState(loadRun);
  const [modal, setModal] = useState(null);
  const [previewActor, setPreviewActor] = useState(null);
  const [previewFromRoster, setPreviewFromRoster] = useState(false);
  const [nav, setNav] = useState(pageFromHash);
  const [hit, setHit] = useState(null);
  const [cue, setCue] = useState(null);
  const [impactCue, setImpactCue] = useState(null);
  const pendingImpact = useRef(null);
  const [selectedHandId, setSelectedHandId] = useState(null);
  const [dismissedArrivals, setDismissedArrivals] = useState([]);
  const [dismissedFeedback, setDismissedFeedback] = useState(null);
  const wasArrivalVisible = useRef(false);
  const [combatMenuOpen, setCombatMenuOpen] = useState(false);
  const busyRef = useRef(false);
  const cueSequence = useRef(0);
  const arenaRef = useRef(null);
  const [cinematics, setCinematics] = useState(() => {
    try {
      return localStorage.getItem("slay.cinematics") !== "short";
    } catch {
      return true;
    }
  });
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
  const previewWrestler = WRESTLERS[previewActor] || wrestler;
  const toastTimer = useRef(null);
  const hitTimer = useRef(null);
  const playerCondition = selectFighterState(state.player);
  const enemyCondition = selectFighterState(state.enemy, { enemy: true });
  const selectedHand =
    state.hand.find((card) => card.uid === selectedHandId) || state.hand[0];
  const selectedHandIndex = state.hand.findIndex(
    (card) => card.uid === selectedHand?.uid,
  );
  const arrivalKey = state.arrival && `${state.arrival.nodeId}-${state.phase}`;
  const arrivalVisible =
    nav === "battle" &&
    ["rest", "event"].includes(state.phase) &&
    !!arrivalKey &&
    !dismissedArrivals.includes(arrivalKey);
  const feedbackKey =
    state.lastChoice &&
    `${state.route?.currentNodeId}-${state.lastChoice.type}-${state.lastChoice.id}`;
  const feedback = feedbackKey !== dismissedFeedback ? state.lastChoice : null;
  const dismissArrival = () => {
    setDismissedArrivals((current) => [...current, arrivalKey]);
    busyRef.current = false;
  };
  useEffect(() => {
    if (arrivalVisible) busyRef.current = true;
    else if (wasArrivalVisible.current && nav === "battle")
      document
        .querySelector(".journey-location .phase-box h2")
        ?.focus({ preventScroll: true });
    wasArrivalVisible.current = arrivalVisible;
  }, [arrivalVisible]);
  const completeCue = (id) => {
    setCue((current) => (current?.id === id ? null : current));
    if (cueSequence.current !== id) return;
    if (pendingImpact.current?.id === id) {
      setImpactCue(pendingImpact.current);
      pendingImpact.current = null;
    } else busyRef.current = false;
  };
  const completeImpact = (id) => {
    setImpactCue((current) => (current?.id === id ? null : current));
    if (cueSequence.current === id) busyRef.current = false;
  };
  const clearPresentation = () => {
    cueSequence.current++;
    busyRef.current = false;
    setCue(null);
    setImpactCue(null);
    pendingImpact.current = null;
    setHit(null);
    clearTimeout(hitTimer.current);
  };
  useEffect(() => {
    try {
      localStorage.setItem("slay.cinematics", cinematics ? "full" : "short");
    } catch {}
  }, [cinematics]);
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  useEffect(() => {
    if (
      import.meta.env.DEV &&
      (["5", "10"].includes(
        new URLSearchParams(window.location.search).get("qaHand"),
      ) ||
        JOURNEY_QA_PROFILES.includes(
          new URLSearchParams(window.location.search).get("qaJourney"),
        ))
    )
      return;
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
  const act = (fn) => {
    if (busyRef.current) return;
    setState((current) => fn(current));
  };
  const changePage = (id) => {
    clearPresentation();
    setNav(id);
    const hash = id === "battle" ? "" : `#${id}`;
    if (window.location.hash !== hash) {
      window.history.pushState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${hash}`,
      );
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const syncPage = () => {
      clearPresentation();
      setNav(pageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", syncPage);
    window.addEventListener("popstate", syncPage);
    return () => {
      window.removeEventListener("hashchange", syncPage);
      window.removeEventListener("popstate", syncPage);
    };
  }, []);
  useEffect(() => {
    document.title =
      nav === "cards"
        ? "카드 도감 | SLAY"
        : nav === "guide"
          ? "카드 시스템 도움말 | SLAY"
          : "SLAY | Ring of Nightmares";
  }, [nav]);
  const play = (uid) => {
    if (state.phase !== "combat" || busyRef.current) return;
    const instance = state.hand.find((c) => c.uid === uid);
    const card = getCard(instance);
    const next = playCard(state, uid);
    if (next === state) {
      notify(
        card?.type === "finisher"
          ? "피니셔에는 관중 열기 3이 필요합니다."
          : "에너지가 부족하거나 사용할 수 없는 카드입니다.",
      );
      return;
    }
    const actionCue = createCardCue(state, next, instance);
    const id = ++cueSequence.current;
    busyRef.current = true;
    const impact = createArenaImpact(state, next, {
      attacker: "player",
      instance,
    });
    pendingImpact.current = impact ? { ...impact, id } : null;
    setCue({ ...actionCue, id });
    setSelectedHandId(null);
    const arenaBounds = arenaRef.current?.getBoundingClientRect();
    if (
      arenaBounds &&
      (arenaBounds.top < 0 || arenaBounds.bottom > window.innerHeight - 30)
    ) {
      arenaRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
    const damage = actionCue.damage;
    setHit(
      card.effects.damage
        ? { target: "enemy", text: damage ? `-${damage}` : "BLOCK", id }
        : null,
    );
    clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(() => setHit(null), 650);
    sound.play(damage > 0 ? "attack" : "skill");
    setState(next);
  };
  const end = () => {
    if (busyRef.current) return;
    const next = endTurn(state);
    if (next === state) return;
    const damage = state.player.hp - next.player.hp;
    const impact = createArenaImpact(state, next, { attacker: "enemy" });
    if (impact) {
      const id = ++cueSequence.current;
      busyRef.current = true;
      setImpactCue({ ...impact, id });
    }
    if (damage > 0 && !impact) {
      setHit({
        target: "player",
        text: `멘탈 붕괴 −${damage}`,
        id: Date.now(),
      });
      clearTimeout(hitTimer.current);
      hitTimer.current = setTimeout(() => setHit(null), 650);
    } else setHit(null);
    sound.play("attack");
    setState(next);
  };
  const useSupply = (uid) => {
    if (busyRef.current) return;
    const entry = state.inventory.find((item) => item.uid === uid);
    const next = useItem(state, uid);
    if (next === state) return;
    if (nav !== "battle") changePage("battle");
    const impact = createArenaImpact(state, next, {
      attacker: "player",
      label: ITEMS[entry.id].name,
    });
    if (impact) {
      const id = ++cueSequence.current;
      busyRef.current = true;
      setImpactCue({ ...impact, id });
      setModal(null);
    }
    setState(next);
    const changes = [
      ["체력", next.player.hp - state.player.hp],
      ["방어", next.player.block - state.player.block],
      ["에너지", next.energy - state.energy],
      ["열기", next.player.hype - state.player.hype],
      ["압박", next.player.stress - state.player.stress],
      ["상대 약화", (next.enemy?.weak || 0) - (state.enemy?.weak || 0)],
      [
        "상대 취약",
        (next.enemy?.vulnerable || 0) - (state.enemy?.vulnerable || 0),
      ],
      [
        "다음 공격",
        (next.status?.nextAttack || 0) - (state.status?.nextAttack || 0),
      ],
    ]
      .filter(([, value]) => value)
      .map(([name, value]) => `${name} ${value > 0 ? "+" : ""}${value}`);
    const drawn = next.hand.length - state.hand.length;
    if (drawn > 0) changes.push(`드로우 ${drawn}`);
    notify(
      `${ITEMS[entry.id].name} 사용${changes.length ? ` · ${changes.join(" · ")}` : ""}`,
    );
  };
  useEffect(() => {
    const key = (e) => {
      if (
        modal ||
        document.querySelector("dialog[open]") ||
        e.target.closest("input,textarea,select,[contenteditable='true']") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat
      )
        return;
      if (e.key === "Escape") {
        changePage("battle");
        return;
      }
      if (nav !== "battle") return;
      if (/^[0-9]$/.test(e.key)) {
        const c = state.hand[e.key === "0" ? 9 : Number(e.key) - 1];
        if (c) play(c.uid);
      }
      if (e.code === "Space" && state.phase === "combat") {
        if (e.target.closest("button,a,summary,[role='button']")) return;
        e.preventDefault();
        end();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [state, modal, nav, sound.enabled]);
  const startRun = (id) => {
    clearPresentation();
    setState(newRun(id, crypto.getRandomValues(new Uint32Array(1))[0]));
    setModal(null);
    setPreviewFromRoster(false);
    setDismissedArrivals([]);
    setDismissedFeedback(null);
    setSelectedHandId(null);
    changePage("battle");
    notify("새로운 챔피언 로드가 시작됩니다.");
  };
  const navigate = (id) => {
    if (["deck", "roster", "inventory"].includes(id)) setModal(id);
    else changePage(id);
  };
  const openConditionPreview = (id, fromRoster = false) => {
    setPreviewActor(id);
    setPreviewFromRoster(fromRoster);
    setModal("condition");
  };
  const closeModal = () => {
    if (modal === "condition" && previewFromRoster) {
      setPreviewFromRoster(false);
      setModal("roster");
    } else {
      setModal(null);
    }
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
      <div
        className={`app-shell ${nav === "battle" && (activePhase === "combat" || cue || impactCue) ? "combat-view" : ""}`}
      >
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
              onClick={() => changePage("guide")}
              title="카드 시스템 도움말"
              aria-label="카드 시스템 도움말"
              aria-current={nav === "guide" ? "page" : undefined}
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
              <Artwork
                art={fighterPoseArt(state.player.id, playerCondition)}
                alt={wrestler.name}
                condition={playerCondition.id}
                fit="cover"
                portrait
                position={[0.5, 0.2]}
              />
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="wordmark">
              SLAY<span>RING OF NIGHTMARES</span>
            </div>
            <div className="top-breadcrumb">
              {nav === "cards" || nav === "guide"
                ? "카드 연구실"
                : "챔피언 로드"}
              <CaretRight size={12} />
              <strong>
                {nav === "cards"
                  ? "카드 도감"
                  : nav === "guide"
                    ? "카드 시스템"
                    : "언더그라운드"}
              </strong>
            </div>
            <div className="top-actions">
              <details
                className="combat-menu"
                onToggle={(event) =>
                  setCombatMenuOpen(event.currentTarget.open)
                }
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  event.preventDefault();
                  event.stopPropagation();
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary").focus();
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    event.currentTarget.open = false;
                }}
              >
                <summary
                  role="button"
                  aria-label="경기 메뉴"
                  aria-expanded={combatMenuOpen}
                  aria-controls="combat-navigation"
                >
                  <List size={18} />
                  <span>메뉴</span>
                </summary>
                <nav id="combat-navigation" aria-label="경기 메뉴">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={
                        nav === item.id || modal === item.id
                          ? "page"
                          : undefined
                      }
                      onClick={(event) => {
                        const menu = event.currentTarget.closest("details");
                        menu.open = false;
                        menu.querySelector("summary").focus();
                        navigate(item.id);
                      }}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                      <ArrowRight size={13} />
                    </button>
                  ))}
                </nav>
              </details>
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
                aria-label="카드 시스템 도움말"
                onClick={() => changePage("guide")}
              >
                <Question size={17} />
                <span>카드 도움말</span>
              </button>
            </div>
          </header>
          <main>
            {!["cards", "guide", "map"].includes(nav) &&
              activePhase !== "map" && (
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
                  <button
                    className="floor-button"
                    onClick={() => changePage("map")}
                  >
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
              )}
            {nav === "cards" ? (
              <CardLibraryPage
                onOpenGuide={() => changePage("guide")}
                onBack={() => changePage("battle")}
              />
            ) : nav === "guide" ? (
              <CardGuidePage
                onOpenLibrary={() => changePage("cards")}
                onBack={() => changePage("battle")}
              />
            ) : nav === "map" || activePhase === "map" ? (
              <section className="map-panel">
                <button
                  className="text-button back"
                  onClick={() => changePage("battle")}
                >
                  <ArrowRight
                    size={16}
                    style={{ transform: "rotate(180deg)" }}
                  />
                  아레나로 돌아가기
                </button>
                <ChampionRoad
                  state={state}
                  onChoose={(i) => {
                    act((s) => advanceToNode(s, i));
                    changePage("battle");
                  }}
                  preview={state.phase !== "map"}
                  feedback={feedback}
                  onDismissFeedback={() => setDismissedFeedback(feedbackKey)}
                />
              </section>
            ) : ["rest", "event", "shop"].includes(activePhase) ? (
              <JourneyLocation state={state}>
                <PhasePanel
                  state={state}
                  act={act}
                  startRun={startRun}
                  setModal={setModal}
                />
              </JourneyLocation>
            ) : (
              <div className="combat-workspace">
                <section
                  className={`arena ${activePhase === "reward" ? "reward-arena" : ""} ${cue ? "cinematic-active" : ""}`}
                  aria-label="전투 아레나"
                  ref={arenaRef}
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
                      <FighterCondition
                        condition={playerCondition}
                        onClick={() => openConditionPreview(state.player.id)}
                      />
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
                    <div className="enemy-condition-row">
                      <FighterCondition condition={enemyCondition} enemy />
                    </div>
                  </div>
                  <FighterSprite
                    actor={state.player.id}
                    condition={playerCondition}
                    name={wrestler.name}
                    side="player"
                    impact={impactCue}
                    shortened={!cinematics}
                  />
                  {state.enemy && (
                    <FighterSprite
                      actor={state.enemy.artKey || state.enemy.id || "valkyrie"}
                      condition={enemyCondition}
                      name={enemyHUD.name}
                      side="enemy"
                      impact={impactCue}
                      shortened={!cinematics}
                    />
                  )}
                  <span className="vs-mark">VS</span>
                  <AnimatePresence>
                    {hit && !cue && !impactCue && (
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
                  <AnimatePresence>
                    {cue && (
                      <TechniqueScene
                        key={cue.id}
                        cue={cue}
                        onComplete={completeCue}
                        shortened={!cinematics}
                      />
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {impactCue && (
                      <ArenaImpact
                        key={impactCue.id}
                        cue={impactCue}
                        onComplete={completeImpact}
                        shortened={!cinematics}
                      />
                    )}
                  </AnimatePresence>
                  <div className="arena-bottom">
                    <span className="arena-location">
                      {state.activeGimmick ? (
                        <Shield size={15} />
                      ) : (
                        <Crosshair size={15} />
                      )}
                      <span
                        title={
                          state.activeGimmick
                            ? `${GIMMICKS[state.activeGimmick.id]?.description} · ${GIMMICKS[state.activeGimmick.id]?.tradeoff} · 이번 경기 종료 후 만료`
                            : undefined
                        }
                      >
                        {state.activeGimmick
                          ? `${GIMMICKS[state.activeGimmick.id]?.name} · 1경기`
                          : "UNDERGROUND ARENA"}
                      </span>
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
                  {activePhase !== "combat" && !cue && !impactCue && (
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
                <div className="combat-bottom">
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
                      <InventoryTrigger
                        state={state}
                        onClick={() => setModal("inventory")}
                      />
                    </div>
                    <div className="hand-main">
                      <div className="hand-heading">
                        <h2>
                          당신의 패<span>{state.hand.length} CARDS</span>
                        </h2>
                        <button
                          type="button"
                          className="hand-play-button"
                          onClick={() => selectedHand && play(selectedHand.uid)}
                          disabled={
                            !selectedHand ||
                            !!cue ||
                            !!impactCue ||
                            !canPlayCard(state, selectedHand)
                          }
                          aria-label={
                            selectedHand
                              ? `${getCard(selectedHand).name} 사용`
                              : "사용할 카드 없음"
                          }
                        >
                          <span>선택 카드 사용</span>
                          <ArrowRight size={14} />
                        </button>
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
                      <div
                        className="card-hand hand-fan"
                        style={{ "--hand-count": state.hand.length }}
                      >
                        <AnimatePresence mode="popLayout">
                          {state.hand.map((c, i) => (
                            <Card
                              key={c.uid}
                              instance={c}
                              index={i}
                              onClick={() => setSelectedHandId(c.uid)}
                              disabled={!!cue || !!impactCue}
                              unplayable={!canPlayCard(state, c)}
                              selected={selectedHand?.uid === c.uid}
                              fanPosition={
                                i === selectedHandIndex
                                  ? state.hand.length - 1
                                  : i < selectedHandIndex
                                    ? i
                                    : i - 1
                              }
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
                        disabled={
                          !!cue || !!impactCue || activePhase !== "combat"
                        }
                      >
                        <span>
                          {cue || impactCue ? "기술 시전 중" : "턴 종료"}
                        </span>
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
                </div>
              </div>
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
                inventory: "코너 보관함",
                condition: `${previewWrestler.nameKo} 컨디션 및 표정`,
                log: "경기 기록",
                upgrade: "카드 강화",
              }[modal]
            }
            subtitle={
              {
                deck: `${state.deck.length} CARDS IN YOUR DECK`,
                roster: "THE CONTENDERS",
                condition: `${previewWrestler.name} · STATE PREVIEW`,
                upgrade: "TRAINING ROOM",
              }[modal]
            }
            wide={["deck", "draw", "discard", "roster", "upgrade"].includes(
              modal,
            )}
            className={modal === "roster" ? "roster-modal" : ""}
            closeLabel={
              modal === "condition" && previewFromRoster
                ? "선수 선택으로 돌아가기"
                : "닫기"
            }
            onClose={closeModal}
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
              <Roster
                currentId={state.player.id}
                onStart={startRun}
                onPreview={(id) => openConditionPreview(id, true)}
              />
            )}
            {modal === "inventory" && (
              <JourneyInventory
                state={state}
                onUse={useSupply}
                onEquip={(uid) => act((current) => equipGimmick(current, uid))}
                onOpenPile={setModal}
                locked={!!cue || !!impactCue || arrivalVisible}
              />
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
                <div className="setting-row cinematic-setting">
                  <span>기술 연출</span>
                  <button
                    aria-label={`기술 연출: ${cinematics ? "전체" : "간결"}. ${cinematics ? "간결" : "전체"}로 변경`}
                    onClick={() => setCinematics((value) => !value)}
                  >
                    {cinematics ? "전체" : "간결"}
                  </button>
                  <small>
                    전체는 카드 아트를 움직이며 보여줍니다. 간결은 같은 아트와
                    결과를 짧게 표시합니다. 기기의 모션 감소 설정도 반영합니다.
                  </small>
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
            {modal === "condition" && (
              <>
                {previewFromRoster && (
                  <div className="roster-preview-toolbar">
                    <button type="button" onClick={closeModal}>
                      <ArrowLeft size={15} /> 선수 선택으로 돌아가기
                    </button>
                    <span>{previewWrestler.role}</span>
                  </div>
                )}
                <ConditionGuide
                  key={previewWrestler.id}
                  actor={previewWrestler.id}
                  name={previewWrestler.name}
                />
              </>
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
        {arrivalVisible && (
          <RunArrival
            key={arrivalKey}
            state={state}
            onContinue={dismissArrival}
            shortened={!cinematics}
          />
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
        <RewardLoot
          state={state}
          onClaim={(kind, id) => act((current) => claimLoot(current, kind, id))}
        />
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
        <ChampionRoad
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
        <h2 tabIndex={-1}>다시 링에 오르기 전에.</h2>
        <p>한 번의 휴식으로 몸을 회복하거나, 마음과 기술을 다듬으세요.</p>
        <div className="phase-actions">
          {getRestChoices(state).map((choice) => {
            const Icon = { heal: Heart, meditate: Brain, upgrade: Sparkle }[
              choice.id
            ];
            const unavailable =
              choice.id === "upgrade" &&
              !state.deck.some(
                (card) => !card.upgraded && card.id !== "nightmare",
              );
            return (
              <button
                key={choice.id}
                disabled={unavailable}
                onClick={() =>
                  choice.id === "upgrade"
                    ? setModal("upgrade")
                    : act((current) => rest(current, choice.id))
                }
              >
                <Icon size={23} />
                <strong>{choice.label}</strong>
                <span>{choice.description}</span>
              </button>
            );
          })}
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
                  !state.deck.some(
                    (c) => !c.upgraded && c.id !== "nightmare",
                  )) ||
                (item.kind === "item" &&
                  state.inventory.length >= ITEM_CAPACITY) ||
                (item.kind === "gimmick" &&
                  state.gimmicks.length >= GIMMICK_CAPACITY)
              }
            >
              <div>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </div>
              <span>
                {item.kind === "item" &&
                state.inventory.length >= ITEM_CAPACITY &&
                !item.sold ? (
                  "가방 가득 참"
                ) : item.kind === "gimmick" &&
                  state.gimmicks.length >= GIMMICK_CAPACITY &&
                  !item.sold ? (
                  "보관함 가득 참"
                ) : item.sold ? (
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
        <h2 tabIndex={-1}>{state.event?.name || state.event?.title}</h2>
        <p>{state.event?.description}</p>
        <div className="event-choices">
          {state.event?.choices.map((choice) => {
            const unavailable = eventChoiceUnavailable(state, choice);
            return (
              <button
                key={choice.id}
                onClick={() => act((s) => resolveEvent(s, choice.id))}
                disabled={!!unavailable}
              >
                <strong>{choice.label}</strong>
                <span>{choice.description}</span>
                {unavailable && (
                  <small className="journey-choice-unavailable">
                    {unavailable}
                  </small>
                )}
                <ArrowRight size={18} />
              </button>
            );
          })}
        </div>
      </div>
    );
  return (
    <div className="phase-box final small" data-outcome={state.phase}>
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

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
