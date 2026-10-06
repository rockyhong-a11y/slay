/** All cue timestamps use the same monotonic clock as performance.now(). */
export function cuePlayback(cue, duration, now) {
  const time = Number.isFinite(now) ? now : 0;
  const startedAt = Number.isFinite(cue?.startedAt) ? cue.startedAt : time;
  const length = Number.isFinite(duration) && duration > 0 ? duration : 1000;
  const elapsed = Math.max(0, time - startedAt);
  const offset = Math.min(length, elapsed);
  return {
    startedAt,
    duration: length,
    elapsed,
    remaining: Math.max(0, length - elapsed),
    animationDelay: -offset / 1000,
    cssDelay: `${-offset}ms`,
  };
}

/** A delayed mount catches up to the cue instead of starting another clock. */
export function cueEventPlan(clock, events = []) {
  const complete = { key: "complete", delay: clock.remaining };
  if (clock.remaining === 0) return [complete];
  return [
    ...events.map(({ key, at }) => ({
      key,
      delay: Math.max(0, at - clock.elapsed),
    })),
    complete,
  ];
}

// The delivered set belongs to the cue, not to an effect setup. This makes
// cleanup/re-setup and a changed motion preference safe after a contact fires.
export function scheduleCueEvents(
  clock,
  events,
  onEvent,
  {
    delivered = new Set(),
    setTimer = setTimeout,
    clearTimer = clearTimeout,
  } = {},
) {
  let active = true;
  const timers = cueEventPlan(clock, events)
    .filter(({ key }) => !delivered.has(key))
    .map(({ key, delay }) =>
      setTimer(() => {
        if (!active || delivered.has(key)) return;
        delivered.add(key);
        onEvent(key);
      }, delay),
    );
  return () => {
    active = false;
    timers.forEach(clearTimer);
  };
}
