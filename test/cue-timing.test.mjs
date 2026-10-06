import test from "node:test";
import assert from "node:assert/strict";
import {
  cuePlayback,
  cueEventPlan,
  scheduleCueEvents,
} from "../src/cue-timing.js";

function fakeTimers(start) {
  let now = start;
  let nextId = 0;
  const jobs = new Map();
  return {
    now: () => now,
    setTimer(callback, delay) {
      const id = ++nextId;
      jobs.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimer: (id) => jobs.delete(id),
    advance(to) {
      while (true) {
        const pending = [...jobs.entries()]
          .filter(([, job]) => job.at <= to)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!pending) break;
        const [id, job] = pending;
        jobs.delete(id);
        now = job.at;
        job.callback();
      }
      now = to;
    },
  };
}

test("a delayed scene shares the original clock for contacts, crowd, completion and visual seek", () => {
  const cue = { startedAt: 1000 };
  const clock = cuePlayback(cue, 2000, 1250);
  assert.equal(clock.remaining, 1750);
  assert.equal(clock.animationDelay, -0.25);
  assert.equal(clock.cssDelay, "-250ms");
  const plan = cueEventPlan(clock, [
    { key: "contact-0", at: 2000 * 0.3 },
    { key: "crowd", at: 2000 * 0.3 },
    { key: "contact-1", at: 2000 * 0.6 },
  ]);
  assert.deepEqual(plan, [
    { key: "contact-0", delay: 350 },
    { key: "crowd", delay: 350 },
    { key: "contact-1", delay: 950 },
    { key: "complete", delay: 1750 },
  ]);
  for (const { key, delay } of plan) {
    const expected =
      key === "complete" ? 2000 : key === "contact-1" ? 1200 : 600;
    assert.equal(1250 + delay, cue.startedAt + expected);
  }
});

test("arena incoming contact and shortened 650ms summary use the same absolute deadline", () => {
  const cue = { startedAt: 200 };
  assert.deepEqual(
    cueEventPlan(cuePlayback(cue, 1200, 300), [
      { key: "contact", at: 1200 * 0.29 },
    ]),
    [
      { key: "contact", delay: 248 },
      { key: "complete", delay: 1100 },
    ],
  );
  assert.deepEqual(
    cueEventPlan(cuePlayback(cue, 650, 225), [
      { key: "contact", at: 40 },
      { key: "crowd", at: 80 },
    ]),
    [
      { key: "contact", delay: 15 },
      { key: "crowd", delay: 55 },
      { key: "complete", delay: 625 },
    ],
  );
});

test("already elapsed cues complete once without replaying old sound or crowd events", () => {
  const timers = fakeTimers(2000);
  const delivered = new Set();
  const calls = [];
  const clock = cuePlayback({ startedAt: 100 }, 650, timers.now());
  assert.equal(clock.animationDelay, -0.65);
  assert.equal(clock.cssDelay, "-650ms");
  const events = [
    { key: "contact", at: 40 },
    { key: "crowd", at: 80 },
  ];
  const options = { ...timers, delivered };
  const cancel = scheduleCueEvents(
    clock,
    events,
    (key) => calls.push(key),
    options,
  );
  timers.advance(2000);
  cancel();
  scheduleCueEvents(clock, events, (key) => calls.push(key), options);
  timers.advance(4000);
  assert.deepEqual(calls, ["complete"]);
});

test("effect cleanup/re-setup cancels pending work and never repeats delivered contacts", () => {
  const timers = fakeTimers(100);
  const cue = { startedAt: 0 };
  const delivered = new Set();
  const calls = [];
  const events = [
    { key: "contact-0", at: 300 },
    { key: "contact-1", at: 600 },
    { key: "crowd", at: 300 },
  ];
  const run = () =>
    scheduleCueEvents(
      cuePlayback(cue, 1000, timers.now()),
      events,
      (key) => calls.push([key, timers.now()]),
      { ...timers, delivered },
    );
  run()(); // StrictMode's first setup is cleaned up before timers fire.
  const cancel = run();
  timers.advance(400);
  cancel();
  run();
  timers.advance(1200);
  assert.deepEqual(calls, [
    ["contact-0", 300],
    ["crowd", 300],
    ["contact-1", 600],
    ["complete", 1000],
  ]);
});

test("a canceled or replaced cue never delivers contact or completion callbacks", () => {
  const timers = fakeTimers(100);
  const calls = [];
  const cancel = scheduleCueEvents(
    cuePlayback({ startedAt: 0 }, 1000, timers.now()),
    [{ key: "contact", at: 300 }],
    (key) => calls.push(key),
    timers,
  );
  cancel();
  timers.advance(2000);
  assert.deepEqual(calls, []);
});

test("a late contact catches up once and missing or invalid timing remains finite", () => {
  const clock = cuePlayback({ startedAt: 100 }, 1000, 500);
  assert.deepEqual(cueEventPlan(clock, [{ key: "contact", at: 300 }]), [
    { key: "contact", delay: 0 },
    { key: "complete", delay: 600 },
  ]);
  const initial = cuePlayback({}, 650, 200);
  assert.equal(initial.startedAt, 200);
  assert.equal(cuePlayback(initial, 650, 250).remaining, 600);
  for (const [cue, duration, now] of [
    [null, undefined, NaN],
    [{ startedAt: NaN }, -10, 5],
    [{ startedAt: 500 }, 650, 100],
  ]) {
    const result = cuePlayback(cue, duration, now);
    for (const value of [
      result.elapsed,
      result.remaining,
      result.animationDelay,
    ])
      assert.ok(Number.isFinite(value));
    assert.ok(result.remaining >= 0 && result.remaining <= result.duration);
    assert.ok(result.animationDelay <= 0);
  }
});
