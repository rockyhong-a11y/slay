import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { CARDS, WRESTLERS } from "../src/game.js";
import { CARD_DETAILS } from "../src/card-library.js";
import { FIGHTER_STATES, fighterPoseArt } from "../src/presentation.js";
import { LIVE_ART_RIGS } from "../src/live-art-rigs.js";
import {
  CONDITION_MOTION,
  approach,
  artSeed,
  blinkAt,
  motionAt,
  partVector,
  deformPoint,
  fitArt,
} from "../src/motion-config.js";

const closeTo = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-10,
    `${message}: ${actual} vs ${expected}`,
  );

test("rigs cover every real card and every wrestler pose exactly once", () => {
  const cardArt = Object.keys(CARDS).map((id) => CARD_DETAILS[id].art);
  const fighterArt = Object.keys(WRESTLERS).flatMap((id) =>
    Object.keys(FIGHTER_STATES).map((condition) =>
      fighterPoseArt(id, condition),
    ),
  );
  const required = [...cardArt, ...fighterArt];
  assert.equal(required.length, 43);
  assert.equal(new Set(required).size, required.length);
  assert.deepEqual(Object.keys(LIVE_ART_RIGS).sort(), required.sort());
  for (const art of required) {
    assert.ok(
      existsSync(new URL(`../public/assets/${art}`, import.meta.url)),
      art,
    );
    assert.equal(
      LIVE_ART_RIGS[art].kind,
      art.startsWith("cards/") ? "card" : "fighter",
    );
  }
});

test("each rig has finite nonempty local masks within renderer capacity", () => {
  const finitePair = (pair, label, { radius = false } = {}) => {
    assert.equal(pair.length, 2, label);
    for (const value of pair) {
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, label);
      if (radius) assert.ok(value > 0, `${label} cannot collapse its mask`);
    }
  };
  const frame = motionAt(0.7, 0.2);
  for (const [art, rig] of Object.entries(LIVE_ART_RIGS)) {
    assert.ok(rig.parts.length > 0 && rig.parts.length <= 8, art);
    assert.ok(Array.isArray(rig.eyes) && rig.eyes.length <= 4, art);
    for (const part of rig.parts) {
      finitePair(part.center, `${art} part center`);
      finitePair(part.radius, `${art} part radius`, { radius: true });
      assert.ok(part.motion in frame, `${art} must use a real motion signal`);
      assert.equal(part.amount.length, 2, art);
      assert.ok(part.amount.every(Number.isFinite), art);
      assert.ok(Number.isFinite(part.twist || 0), art);
    }
    for (const eye of rig.eyes) {
      finitePair(eye.center, `${art} eye center`);
      finitePair(eye.radius, `${art} eye radius`, { radius: true });
      finitePair(eye.skin, `${art} eyelid skin sample`);
    }
  }
});

test("all 25 card rigs move inside their subjects while pinning background corners", () => {
  for (const id of Object.keys(CARDS)) {
    const art = CARD_DETAILS[id].art;
    const rig = LIVE_ART_RIGS[art];
    let visibleLocalMovement = false;
    for (const time of [0.31, 1.47, 3.9]) {
      const frame = motionAt(
        time,
        artSeed(art),
        CONDITION_MOTION.normal,
        [0.4, -0.2],
      );
      const vectors = rig.parts.map((part) => partVector(part, frame));
      for (const point of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        assert.deepEqual(
          deformPoint(point, rig.parts, vectors),
          point,
          `${id} background corner`,
        );
      }
      for (const part of rig.parts) {
        const moved = deformPoint(part.center, rig.parts, vectors);
        assert.ok(moved.every(Number.isFinite), id);
        if (
          Math.hypot(moved[0] - part.center[0], moved[1] - part.center[1]) >
          1e-7
        )
          visibleLocalMovement = true;
      }
    }
    assert.ok(
      visibleLocalMovement,
      `${id} cannot be a static or whole-image transform`,
    );
  }
});

test("local deformation fades continuously to a pinned mask boundary", () => {
  const part = LIVE_ART_RIGS["cards/strike.webp"].parts[0];
  const vector = partVector(part, motionAt(0.31, artSeed("cards/strike.webp")));
  const boundary = [part.center[0] + part.radius[0], part.center[1]];
  assert.deepEqual(deformPoint(boundary, [part], [vector]), boundary);
  const nearby = [boundary[0] - 1e-6, boundary[1]];
  const moved = deformPoint(nearby, [part], [vector]);
  assert.ok(Math.hypot(moved[0] - nearby[0], moved[1] - nearby[1]) < 1e-8);
});

test("breath, gaze, hair and blinks remain finite and continuous across cycles and conditions", () => {
  let sawOpen = false,
    sawClosed = false,
    sawBreathing = false;
  const epsilon = 1e-4;
  for (const seed of [0, 0.27, 0.91]) {
    for (let time = 0; time < 20; time += 0.01) {
      const blink = blinkAt(time, seed);
      assert.ok(Number.isFinite(blink) && blink >= 0 && blink <= 1);
      assert.ok(Math.abs(blinkAt(time + epsilon, seed) - blink) < 0.002);
      sawOpen ||= blink === 0;
      sawClosed ||= blink > 0.95;
      for (const profile of Object.values(CONDITION_MOTION)) {
        const frame = motionAt(time, seed, profile, [0.3, -0.2]);
        const next = motionAt(time + epsilon, seed, profile, [0.3, -0.2]);
        for (const key of Object.keys(frame)) {
          assert.ok(Number.isFinite(frame[key]), key);
          assert.ok(
            Math.abs(next[key] - frame[key]) < 0.002,
            `${key} must not snap`,
          );
        }
        sawBreathing ||= Math.abs(frame.breath) > 0.5;
      }
    }
  }
  assert.ok(sawOpen && sawClosed && sawBreathing);
});

test("approach follows state changes without overshoot and is independent of frame rate", () => {
  const follow = (fps) => {
    let current = 4;
    for (let frame = 0; frame < fps; frame++) {
      const next = approach(current, -2, 1 / fps);
      assert.ok(
        next >= -2 && next <= current,
        "a condition change must approach its target monotonically",
      );
      current = next;
    }
    return current;
  };
  closeTo(
    follow(30),
    follow(120),
    "same one-second transition at 30fps and 120fps",
  );
  assert.equal(approach(4, -2, 0), 4);
  assert.equal(approach(-2, -2, 1), -2);
  assert.ok(
    approach(4, -2, 60) >= -2,
    "resuming after a long pause cannot overshoot",
  );
});

test("fitArt contains complete cards, covers portraits and respects image anchors without stretching", () => {
  assert.deepEqual(fitArt(200, 300, 400, 200, "contain", [0.5, 1]), {
    x: 0,
    y: 200,
    width: 200,
    height: 100,
  });
  assert.deepEqual(fitArt(200, 300, 400, 200, "cover"), {
    x: -200,
    y: 0,
    width: 600,
    height: 300,
  });
  assert.deepEqual(fitArt(200, 100, 100, 200, "cover", [0.5, 0.2]), {
    x: 0,
    y: -60,
    width: 200,
    height: 400,
  });
  for (const [width, height, sourceWidth, sourceHeight] of [
    [180, 150, 1024, 683],
    [300, 500, 867, 1300],
    [36, 36, 867, 1300],
  ]) {
    for (const fit of ["contain", "cover"]) {
      const rect = fitArt(width, height, sourceWidth, sourceHeight, fit);
      assert.ok(Object.values(rect).every(Number.isFinite));
      closeTo(
        rect.width / rect.height,
        sourceWidth / sourceHeight,
        "source aspect ratio",
      );
      if (fit === "contain") {
        assert.ok(rect.width <= width + 1e-10 && rect.height <= height + 1e-10);
        assert.ok(rect.x >= -1e-10 && rect.y >= -1e-10);
      } else {
        assert.ok(rect.width >= width - 1e-10 && rect.height >= height - 1e-10);
        assert.ok(rect.x <= 1e-10 && rect.y <= 1e-10);
      }
    }
  }
});
