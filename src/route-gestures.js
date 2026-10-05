// A route tap is a short, stationary, single-pointer gesture. Native scrolling,
// long presses and canceled pointers must never become the second entry tap.
export function createRouteTapTracker({
  doubleTapDelay = 320,
  movementTolerance = 9,
  maxTapDuration = 450,
} = {}) {
  const pointers = new Set();
  let active = null;
  let lastTap = null;
  let multiPointer = false;
  let context = null;
  let locked = false;

  const clearTap = () => {
    active = null;
    lastTap = null;
  };
  const reset = () => {
    pointers.clear();
    clearTap();
    multiPointer = false;
    locked = false;
  };

  return {
    setContext(nextContext) {
      if (nextContext !== context) {
        reset();
        context = nextContext;
      }
    },
    reset,
    abort() {
      pointers.clear();
      clearTap();
      multiPointer = false;
    },
    begin({ pointerId, nodeId, x, y, time, primary = true }) {
      if (locked) return;
      pointers.add(pointerId);
      if (pointers.size > 1 || !primary) {
        multiPointer = true;
        clearTap();
        return;
      }
      if (!nodeId) {
        clearTap();
        return;
      }
      if (lastTap?.nodeId !== nodeId) lastTap = null;
      active = { pointerId, nodeId, x, y, time };
    },
    move({ pointerId, x, y }) {
      if (!active || active.pointerId !== pointerId) return;
      if (Math.hypot(x - active.x, y - active.y) > movementTolerance) {
        clearTap();
      }
    },
    finish({ pointerId, nodeId, x, y, time }) {
      this.move({ pointerId, x, y });
      const candidate = active;
      pointers.delete(pointerId);
      if (candidate?.pointerId === pointerId) active = null;
      const blocked = multiPointer;
      if (!pointers.size) multiPointer = false;
      if (
        locked ||
        blocked ||
        !candidate ||
        candidate.pointerId !== pointerId ||
        candidate.nodeId !== nodeId ||
        time < candidate.time ||
        time - candidate.time > maxTapDuration
      ) {
        lastTap = null;
        return null;
      }
      const double =
        lastTap?.nodeId === nodeId &&
        time >= lastTap.time &&
        time - lastTap.time <= doubleTapDelay;
      lastTap = double ? null : { nodeId, time };
      return { nodeId, double };
    },
    cancel(pointerId) {
      // Pointer capture is released after a successful pointerup, too. That
      // release is not a cancellation and must preserve the first valid tap.
      if (!pointers.has(pointerId)) return;
      pointers.delete(pointerId);
      clearTap();
      if (!pointers.size) multiPointer = false;
    },
    claimEntry(nodeId, availableIds) {
      if (locked || !availableIds.includes(nodeId)) return false;
      locked = true;
      clearTap();
      return true;
    },
    get activeNodeId() {
      return active?.nodeId || null;
    },
    get locked() {
      return locked;
    },
  };
}
