// Taps follow the visible artwork; only an intentional drag uses stable rails.
export const HAND_DOUBLE_TAP_MS = 420;
export const HAND_DRAG_THRESHOLD = 7;
export const HAND_DOUBLE_TAP_DISTANCE = 28;
export const TOUCH_CONFIRM_MS = 180;
export const HAND_MAX_TAP_DURATION_MS = 450;

export function createHandGesture() {
  return { pointer: null, lastTap: null, playLocked: false };
}

export function cancelHandGesture(state, { unlock = false } = {}) {
  return {
    ...state,
    pointer: null,
    lastTap: null,
    playLocked: unlock ? false : state.playLocked,
  };
}

export function beginHandGesture(
  state,
  { pointerId, uid, x, y, time = 0, locked = false },
) {
  if (locked || state.playLocked || state.pointer || !uid) {
    return cancelHandGesture(state);
  }
  return {
    ...state,
    lastTap: state.lastTap?.uid === uid ? state.lastTap : null,
    pointer: {
      pointerId,
      initialUid: uid,
      uid,
      startX: x,
      startY: y,
      startTime: time,
      x,
      y,
      moved: false,
    },
  };
}

export function moveHandGesture(state, { pointerId, uid, x, y }) {
  const pointer = state.pointer;
  if (!pointer || pointer.pointerId !== pointerId) return state;
  const moved =
    pointer.moved ||
    Math.hypot(x - pointer.startX, y - pointer.startY) >= HAND_DRAG_THRESHOLD ||
    (!!uid && uid !== pointer.initialUid);
  return {
    ...state,
    // Once a sweep begins, its release can never complete a prior tap pair.
    lastTap: moved ? null : state.lastTap,
    pointer: { ...pointer, uid: uid || pointer.uid, x, y, moved },
  };
}

export function finishHandGesture(
  state,
  { pointerId, uid, x, y, time, locked = false, playable = true },
) {
  if (!state.pointer || state.pointer.pointerId !== pointerId) {
    return { state, select: null, play: null };
  }
  const updated = moveHandGesture(state, { pointerId, uid, x, y });
  const pointer = updated.pointer;
  const selected = uid;
  const duration = time - pointer.startTime;
  const cleanTap =
    !locked &&
    !updated.playLocked &&
    !!selected &&
    !pointer.moved &&
    duration >= 0 &&
    duration <= HAND_MAX_TAP_DURATION_MS &&
    selected === pointer.initialUid;
  if (!cleanTap) {
    return {
      state: cancelHandGesture(updated),
      select: locked ? null : selected,
      play: null,
    };
  }
  const elapsed = updated.lastTap ? time - updated.lastTap.time : Infinity;
  const doubleTap =
    updated.lastTap?.uid === selected &&
    elapsed >= 0 &&
    elapsed <= HAND_DOUBLE_TAP_MS &&
    Math.hypot(x - updated.lastTap.x, y - updated.lastTap.y) <=
      HAND_DOUBLE_TAP_DISTANCE;
  return {
    state: {
      ...updated,
      pointer: null,
      lastTap: doubleTap ? null : { uid: selected, time, x, y },
      playLocked: doubleTap && playable,
    },
    select: selected,
    play: doubleTap && playable ? selected : null,
    blocked: doubleTap && !playable,
  };
}

export function expireHandTap(state, time = Infinity) {
  return state.lastTap && time - state.lastTap.time > HAND_DOUBLE_TAP_MS
    ? { ...state, lastTap: null }
    : state;
}

export function unlockHandPlay(state) {
  return cancelHandGesture(state, { unlock: true });
}

export function createHandHitRegions(cards, { left, right }) {
  const ordered = cards
    .filter((card) => card.uid && Number.isFinite(card.left))
    .map((card, index) => ({ ...card, index }))
    .sort((a, b) => a.left - b.left || a.index - b.index);
  return ordered
    .map((card, index) => ({
      uid: card.uid,
      left: Math.max(left, card.left),
      right: Math.min(
        right,
        ordered[index + 1]?.left ?? card.left + card.width,
      ),
    }))
    .filter((region) => region.right > region.left);
}

export function hitTestHand(
  regions,
  x,
  { clamp = false, y, visibleCards } = {},
) {
  // Real taps use both coordinates and paint order. The old x-only rails map a
  // lifted card's face to a hidden neighbor, making the wrong card autoplay.
  if (visibleCards) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return (
      [...visibleCards]
        .filter(
          (card) =>
            x >= card.left &&
            x <= card.right &&
            y >= card.top &&
            y <= card.bottom,
        )
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0]?.uid || null
    );
  }
  if (!regions.length || !Number.isFinite(x)) return null;
  const match = regions.find(
    (region, index) =>
      x >= region.left &&
      (x < region.right ||
        (index === regions.length - 1 && x === region.right)),
  );
  if (match) return match.uid;
  if (!clamp) return null;
  return x < regions[0].left ? regions[0].uid : regions[regions.length - 1].uid;
}
