import test from "node:test";
import assert from "node:assert/strict";
import { createRouteTapTracker } from "../src/route-gestures.js";

function tap(tracker, time, nodeId = "f2-1", pointerId = 1) {
  tracker.begin({ pointerId, nodeId, x: 50, y: 50, time });
  return tracker.finish({ pointerId, nodeId, x: 50, y: 50, time: time + 20 });
}

test("a stationary second tap on the same route enters once, including native click duplication", () => {
  const tracker = createRouteTapTracker();
  tracker.setContext("map:1:f1-0");
  assert.deepEqual(tap(tracker, 0), { nodeId: "f2-1", double: false });
  assert.deepEqual(tap(tracker, 200), { nodeId: "f2-1", double: true });
  assert.equal(tracker.claimEntry("f2-1", ["f2-0", "f2-1"]), true);
  assert.equal(tracker.claimEntry("f2-1", ["f2-0", "f2-1"]), false);
  assert.equal(tap(tracker, 260), null);
  tracker.setContext("rest:2:f2-1");
  assert.equal(tracker.locked, false);
  assert.equal(tracker.claimEntry("f2-1", []), false);
});

test("different nodes, elapsed windows and long presses never complete a pair", () => {
  const tracker = createRouteTapTracker();
  tap(tracker, 0);
  assert.equal(tap(tracker, 100, "f2-2").double, false);
  assert.equal(tap(tracker, 200).double, false);
  assert.equal(tap(tracker, 521).double, false);
  tracker.begin({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 600 });
  assert.equal(
    tracker.finish({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 1100 }),
    null,
  );
  assert.equal(tap(tracker, 1150).double, false);
});

test("a drag cannot activate a route even if the pointer returns to its start", () => {
  const tracker = createRouteTapTracker();
  tap(tracker, 0);
  tracker.begin({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 100 });
  tracker.move({ pointerId: 1, x: 50, y: 60 });
  assert.equal(
    tracker.finish({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 150 }),
    null,
  );
  assert.equal(tap(tracker, 200).double, false);
  tracker.begin({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 300 });
  assert.equal(
    tracker.finish({ pointerId: 1, nodeId: "f2-1", x: 59, y: 50, time: 320 })
      .double,
    true,
    "nine pixels of finger jitter is still a tap",
  );
});

test("scroll cancellation and a release outside the original node erase tap history", () => {
  const tracker = createRouteTapTracker();
  tap(tracker, 0);
  tracker.begin({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 100 });
  tracker.cancel(1);
  assert.equal(
    tracker.finish({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 120 }),
    null,
  );
  assert.equal(tap(tracker, 200).double, false);
  tracker.begin({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 250 });
  assert.equal(
    tracker.finish({ pointerId: 1, nodeId: null, x: 50, y: 50, time: 270 }),
    null,
  );
  assert.equal(tap(tracker, 300).double, false);
});

test("multitouch invalidates both pointers until all fingers lift", () => {
  const tracker = createRouteTapTracker();
  tap(tracker, 0);
  tracker.begin({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 100 });
  tracker.begin({
    pointerId: 2,
    nodeId: "f2-1",
    x: 50,
    y: 50,
    time: 120,
    primary: false,
  });
  assert.equal(
    tracker.finish({ pointerId: 2, nodeId: "f2-1", x: 50, y: 50, time: 130 }),
    null,
  );
  assert.equal(
    tracker.finish({ pointerId: 1, nodeId: "f2-1", x: 50, y: 50, time: 140 }),
    null,
  );
  assert.equal(tap(tracker, 200).double, false);
  assert.equal(tap(tracker, 300).double, true);
});

test("capture release preserves a real tap but phase changes expire pending taps and locks", () => {
  const tracker = createRouteTapTracker();
  tracker.setContext("map:1:f1-0");
  tap(tracker, 0);
  tracker.cancel(1);
  assert.equal(tap(tracker, 100).double, true);
  tracker.claimEntry("f2-1", ["f2-1"]);
  tracker.setContext("map:1:f1-0");
  assert.equal(tracker.locked, true, "a rerender keeps the in-flight lock");
  tracker.setContext("map:2:f2-1");
  assert.equal(tracker.locked, false);
  assert.equal(tap(tracker, 200, "f3-1").double, false);
  assert.equal(tracker.claimEntry("f3-3", ["f3-1"]), false);
  assert.equal(tracker.claimEntry("f3-1", ["f3-1"]), true);
});
