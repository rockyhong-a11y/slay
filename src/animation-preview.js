import { CARDS, WRESTLERS, newRun, playCard, getCard } from "./game.js";
import { createCardCue } from "./presentation.js";

export function randomPreviewOpponent(actor, random = Math.random) {
  const candidates = Object.keys(WRESTLERS).filter((id) => id !== actor);
  const value = Math.max(0, Math.min(0.999999, Number(random()) || 0));
  return candidates[Math.floor(value * candidates.length)];
}

// A fresh, disposable run resolves printed effects and the selected wrestler's
// real passive. It never receives the live run or reads/writes browser storage.
export function createAnimationPreview(
  actor,
  cardId,
  { random, id = "preview", now = 0 } = {},
) {
  if (!Object.hasOwn(WRESTLERS, actor) || !Object.hasOwn(CARDS, cardId))
    return null;
  const opponent = randomPreviewOpponent(actor, random);
  const before = newRun(actor, 20903);
  const instance = { id: cardId, uid: `${id}-card`, upgraded: false };
  const definition = getCard(instance);
  before.phase = "combat";
  before.hand = [instance];
  before.draw = ["strike", "guard", "focus", "grapple", "strike"].map(
    (id, i) => ({ id, uid: `${instance.uid}-draw-${i}`, upgraded: false }),
  );
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.discard = [];
  before.exhaust = [];
  before.energy = before.maxEnergy = 10;
  before.combo = 2;
  before.player.hp = Math.max(1, before.player.maxHp - 12);
  before.player.hype = Math.max(3, definition.effects.spendHype || 0);
  before.player.stress = 25;
  before.player.block = 0;
  before.enemy.hp = before.enemy.maxHp = 1000;
  before.enemy.block = before.enemy.weak = before.enemy.vulnerable = 0;
  before.enemy.intent = { type: "attack", value: 18 };
  before.activeGimmick = null;
  const after = playCard(before, instance.uid);
  const cue = createCardCue(before, after, instance);
  return cue ? { opponent, cue: { ...cue, id, startedAt: now } } : null;
}
