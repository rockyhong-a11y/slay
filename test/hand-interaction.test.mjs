import test from "node:test";
import assert from "node:assert/strict";
import {
  beginHandGesture,
  cancelHandGesture,
  createHandGesture,
  createHandHitRegions,
  finishHandGesture,
  expireHandTap,
  hitTestHand,
  moveHandGesture,
  unlockHandPlay,
} from "../src/hand-interaction.js";

function tap(state, uid, time, options = {}) {
  const input = { pointerId: 7, uid, x: 20, y: 400, time, ...options };
  return finishHandGesture(beginHandGesture(state, input), {
    ...input,
    time,
  });
}

test("a single tap selects, then the same card within 420ms plays once", () => {
  const first = tap(createHandGesture(), "card-a", 100);
  assert.equal(first.select, "card-a");
  assert.equal(first.play, null);
  const second = tap(first.state, "card-a", 520);
  assert.equal(second.play, "card-a");
  assert.equal(second.state.playLocked, true);
  const duplicate = tap(second.state, "card-a", 525);
  assert.equal(duplicate.play, null);
  assert.equal(duplicate.select, null);
});

test("expired taps and a different card never autoplay", () => {
  const first = tap(createHandGesture(), "card-a", 100);
  assert.equal(tap(first.state, "card-a", 521).play, null);
  const other = tap(first.state, "card-b", 200);
  assert.equal(other.select, "card-b");
  assert.equal(other.play, null);
  assert.equal(tap(other.state, "card-a", 250).play, null);
});

test("negative timestamp deltas cannot make a double tap", () => {
  const first = tap(createHandGesture(), "card-a", 100);
  assert.equal(tap(first.state, "card-a", 90).play, null);
});

test("a long press selects but clears tap history and cannot precede autoplay", () => {
  const first = tap(createHandGesture(), "a", 100);
  const held = beginHandGesture(first.state, {
    pointerId: 1,
    uid: "a",
    x: 10,
    y: 20,
    time: 200,
  });
  const release = finishHandGesture(held, {
    pointerId: 1,
    uid: "a",
    x: 10,
    y: 20,
    time: 651,
  });
  assert.equal(release.select, "a");
  assert.equal(release.play, null);
  assert.equal(release.state.lastTap, null);
  assert.equal(tap(release.state, "a", 700).play, null);
});

test("450ms holds are valid taps, while a negative hold duration is rejected", () => {
  const held = beginHandGesture(createHandGesture(), {
    pointerId: 1,
    uid: "a",
    x: 10,
    y: 20,
    time: 200,
  });
  const release = finishHandGesture(held, {
    pointerId: 1,
    uid: "a",
    x: 10,
    y: 20,
    time: 650,
  });
  assert.deepEqual(release.state.lastTap, {
    uid: "a",
    time: 650,
    x: 10,
    y: 20,
  });
  const invalid = finishHandGesture(held, {
    pointerId: 1,
    uid: "a",
    x: 10,
    y: 20,
    time: 199,
  });
  assert.equal(invalid.play, null);
  assert.equal(invalid.state.lastTap, null);
});

test("small touch jitter stays a tap", () => {
  let first = beginHandGesture(createHandGesture(), {
    pointerId: 1,
    uid: "a",
    x: 10,
    y: 10,
  });
  first = moveHandGesture(first, {
    pointerId: 1,
    uid: "a",
    x: 13,
    y: 14,
  });
  assert.equal(first.pointer.moved, false);
  const result = finishHandGesture(first, {
    pointerId: 1,
    uid: "a",
    x: 13,
    y: 14,
    time: 100,
  });
  assert.deepEqual(result.state.lastTap, { uid: "a", time: 100, x: 13, y: 14 });
});

test("a sweep and a return to the initial card cannot complete a tap pair", () => {
  const first = tap(createHandGesture(), "a", 10);
  let sweep = beginHandGesture(first.state, {
    pointerId: 3,
    uid: "a",
    x: 10,
    y: 20,
  });
  sweep = moveHandGesture(sweep, {
    pointerId: 3,
    uid: "b",
    x: 50,
    y: 20,
  });
  assert.equal(sweep.lastTap, null);
  const release = finishHandGesture(sweep, {
    pointerId: 3,
    uid: "a",
    x: 10,
    y: 20,
    time: 150,
  });
  assert.equal(release.select, "a");
  assert.equal(release.play, null);
  assert.equal(release.state.lastTap, null);
  assert.equal(tap(release.state, "a", 200).play, null);
});

test("vertical movement of seven pixels cancels tap eligibility", () => {
  const first = tap(createHandGesture(), "a", 10);
  const down = beginHandGesture(first.state, {
    pointerId: 3,
    uid: "a",
    x: 10,
    y: 20,
  });
  const release = finishHandGesture(down, {
    pointerId: 3,
    uid: "a",
    x: 10,
    y: 27,
    time: 150,
  });
  assert.equal(release.play, null);
  assert.equal(release.state.lastTap, null);
});

test("crossing a narrow card rail cancels tap eligibility even below 7px", () => {
  let state = beginHandGesture(createHandGesture(), {
    pointerId: 3,
    uid: "a",
    x: 19,
    y: 20,
  });
  state = moveHandGesture(state, {
    pointerId: 3,
    uid: "b",
    x: 21,
    y: 20,
  });
  assert.equal(state.pointer.moved, true);
});

test("pointer cancellation discards tap history, including a pending first tap", () => {
  const first = tap(createHandGesture(), "a", 10);
  const canceled = cancelHandGesture(first.state);
  assert.equal(canceled.lastTap, null);
  assert.equal(tap(canceled, "a", 100).play, null);
});

test("a second pointer cancels a pending gesture rather than using the card", () => {
  const first = beginHandGesture(createHandGesture(), {
    pointerId: 1,
    uid: "a",
    x: 0,
    y: 0,
  });
  const multiTouch = beginHandGesture(first, {
    pointerId: 2,
    uid: "a",
    x: 0,
    y: 0,
  });
  assert.equal(multiTouch.pointer, null);
  assert.equal(multiTouch.lastTap, null);
});

test("other pointer moves/releases cannot finish an active pointer", () => {
  const state = beginHandGesture(createHandGesture(), {
    pointerId: 1,
    uid: "a",
    x: 0,
    y: 0,
  });
  assert.equal(
    moveHandGesture(state, { pointerId: 2, uid: "b", x: 100, y: 0 }),
    state,
  );
  const otherRelease = finishHandGesture(state, {
    pointerId: 2,
    uid: "a",
    x: 0,
    y: 0,
    time: 50,
  });
  assert.equal(otherRelease.play, null);
  assert.equal(otherRelease.state, state);
});

test("busy cards never select or play; invalid cards remain selectable", () => {
  assert.equal(tap(createHandGesture(), "a", 0, { locked: true }).select, null);
  const first = tap(createHandGesture(), "a", 100, { playable: false });
  const second = tap(first.state, "a", 200, { playable: false });
  assert.equal(second.select, "a");
  assert.equal(second.play, null);
  assert.equal(second.state.playLocked, false);
  assert.equal(second.state.lastTap, null);
});

test("play unlock clears old history so a new card cannot inherit a tap", () => {
  const first = tap(createHandGesture(), "a", 100);
  const played = tap(first.state, "a", 200);
  const unlocked = unlockHandPlay(played.state);
  assert.equal(unlocked.playLocked, false);
  assert.equal(tap(unlocked, "a", 250).play, null);
});

test("overlapped cards own only stable exposed baseline rails", () => {
  const regions = createHandHitRegions(
    [
      { uid: "c", left: 140, width: 120 },
      { uid: "a", left: 100, width: 120 },
      { uid: "b", left: 120, width: 120 },
    ],
    { left: 100, right: 260 },
  );
  assert.deepEqual(regions, [
    { uid: "a", left: 100, right: 120 },
    { uid: "b", left: 120, right: 140 },
    { uid: "c", left: 140, right: 260 },
  ]);
  // "a" can visually cover b/c while raised: neither hitbox changes.
  assert.equal(hitTestHand(regions, 119.9), "a");
  assert.equal(hitTestHand(regions, 120), "b");
  assert.equal(hitTestHand(regions, 140), "c");
  assert.equal(hitTestHand(regions, 260), "c");
});

test("dragging beyond the hand clamps to an end card but hover never does", () => {
  const regions = [
    { uid: "a", left: 100, right: 120 },
    { uid: "b", left: 120, right: 240 },
  ];
  assert.equal(hitTestHand(regions, 90), null);
  assert.equal(hitTestHand(regions, 250), null);
  assert.equal(hitTestHand(regions, 90, { clamp: true }), "a");
  assert.equal(hitTestHand(regions, 250, { clamp: true }), "b");
  assert.equal(hitTestHand([], 10, { clamp: true }), null);
});

test("a tap on the visible raised card never selects its covered neighbor rail", () => {
  const rails = [
    { uid: "raised", left: 0, right: 24 },
    { uid: "covered", left: 24, right: 160 },
  ];
  const visibleCards = [
    { uid: "raised", left: 0, right: 120, top: 84, bottom: 260, zIndex: 30 },
    { uid: "covered", left: 24, right: 160, top: 100, bottom: 276, zIndex: 3 },
  ];
  assert.equal(hitTestHand(rails, 90, { y: 95, visibleCards }), "raised");
  assert.equal(hitTestHand(rails, 90, { y: 180, visibleCards }), "raised");
  assert.equal(hitTestHand(rails, 145, { y: 180, visibleCards }), "covered");
  assert.equal(hitTestHand(rails, 90, { y: 280, visibleCards }), null);
});

test("releasing outside the actual card clears the tap instead of inheriting its uid", () => {
  const first = tap(createHandGesture(), "a", 100);
  const down = beginHandGesture(first.state, {
    pointerId: 7,
    uid: "a",
    x: 20,
    y: 400,
    time: 150,
  });
  const release = finishHandGesture(down, {
    pointerId: 7,
    uid: null,
    x: 20,
    y: 400,
    time: 170,
  });
  assert.equal(release.play, null);
  assert.equal(release.state.lastTap, null);
});

test("two distant taps on one large card are separate intentional selections", () => {
  const first = tap(createHandGesture(), "a", 100, { x: 20, y: 400 });
  assert.equal(tap(first.state, "a", 200, { x: 120, y: 400 }).play, null);
});

test("visible 1/2 tap expires without losing an in-progress pointer", () => {
  const first = tap(createHandGesture(), "a", 100);
  const held = beginHandGesture(first.state, {
    pointerId: 7,
    uid: "a",
    x: 20,
    y: 400,
    time: 500,
  });
  const expired = expireHandTap(held, 521);
  assert.equal(expired.lastTap, null);
  assert.equal(expired.pointer.pointerId, 7);
  const released = finishHandGesture(expired, {
    pointerId: 7,
    uid: "a",
    x: 20,
    y: 400,
    time: 540,
  });
  assert.equal(released.play, null);
  assert.equal(released.state.lastTap.uid, "a");
});

test("double tap spatial tolerance accepts ordinary finger jitter but rejects 29px", () => {
  const first = tap(createHandGesture(), "a", 100);
  assert.equal(tap(first.state, "a", 200, { x: 48 }).play, "a");
  assert.equal(tap(first.state, "a", 200, { x: 49 }).play, null);
});

test("beginning a different card clears old arming before React selection effects run", () => {
  const first = tap(createHandGesture(), "a", 100);
  const next = beginHandGesture(first.state, {
    pointerId: 7,
    uid: "b",
    x: 120,
    y: 400,
    time: 200,
  });
  assert.equal(next.lastTap, null);
  assert.equal(next.pointer.uid, "b");
  const release = finishHandGesture(next, {
    pointerId: 7,
    uid: "b",
    x: 120,
    y: 400,
    time: 220,
  });
  assert.equal(release.state.lastTap.uid, "b");
});

test("a stationary bottom-edge press keeps its snapshot target while selection lifts the artwork", () => {
  const pressRect = {
    uid: "b",
    left: 120,
    right: 260,
    top: 100,
    bottom: 308,
    zIndex: 4,
  };
  const point = { x: 130, y: 304 };
  const uid = hitTestHand([], point.x, {
    y: point.y,
    visibleCards: [pressRect],
  });
  const down = beginHandGesture(createHandGesture(), {
    pointerId: 1,
    uid,
    ...point,
    time: 10,
  });
  // The selected image now ends at 292, but the short press owns the captured
  // visible rectangle until release. It must not switch to a card underneath.
  assert.equal(
    hitTestHand([], point.x, {
      y: point.y,
      visibleCards: [{ ...pressRect, top: 84, bottom: 292 }],
    }),
    null,
  );
  const releaseUid = hitTestHand([], point.x, {
    y: point.y,
    visibleCards: [pressRect],
  });
  const result = finishHandGesture(down, {
    pointerId: 1,
    uid: releaseUid,
    ...point,
    time: 30,
  });
  assert.equal(result.select, "b");
  assert.equal(result.state.lastTap.uid, "b");
});
