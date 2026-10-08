import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ACTION_LANDMARK_NAMES,
  actionLandmarks,
} from "../src/action-landmarks.js";
import {
  CLASSIC_ACTION_ACTORS,
  CLASSIC_ACTION_POSES,
} from "../src/action-motion.js";

const manifest = JSON.parse(
  readFileSync(
    new URL("../public/assets/classic-actions/manifest.json", import.meta.url),
    "utf8",
  ),
);

function insidePolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
}

test("all 120 authored poses register fourteen immutable points inside their own complete silhouettes", () => {
  assert.deepEqual(ACTION_LANDMARK_NAMES, [
    "head",
    "neck",
    "shoulderL",
    "shoulderR",
    "elbowL",
    "elbowR",
    "wristL",
    "wristR",
    "hipL",
    "hipR",
    "kneeL",
    "kneeR",
    "ankleL",
    "ankleR",
  ]);
  for (const actor of CLASSIC_ACTION_ACTORS) {
    for (const pose of CLASSIC_ACTION_POSES) {
      const points = actionLandmarks(actor, pose);
      assert.equal(points.length, ACTION_LANDMARK_NAMES.length);
      assert.equal(points, actionLandmarks({ id: actor }, pose));
      assert.ok(Object.isFrozen(points));
      for (const [index, point] of points.entries()) {
        const label = `${actor}/${pose}/${ACTION_LANDMARK_NAMES[index]}`;
        assert.equal(point.length, 2, label);
        assert.ok(Object.isFrozen(point), label);
        assert.ok(
          point.every(
            (value) => Number.isFinite(value) && value >= 0 && value <= 1,
          ),
          label,
        );
        assert.ok(
          insidePolygon(
            point.map((value) => value * 100),
            manifest[actor].frames[pose].clip,
          ),
          `${label}: anchor must belong to this pose, not neighboring atlas ink`,
        );
      }
      assert.equal(
        new Set(points.map((point) => point.join(","))).size,
        14,
        `${actor}/${pose}: distinct constraints`,
      );
    }
  }
});

test("registration preserves actor-specific inverted suplex direction and overhead lift motion", () => {
  for (const actor of CLASSIC_ACTION_ACTORS) {
    const suplex = actionLandmarks(actor, "suplex");
    const headX = suplex[0][0];
    const hipX = (suplex[8][0] + suplex[9][0]) / 2;
    assert.equal(
      headX > hipX,
      ["valkyrie", "ember", "lynx", "onyx"].includes(actor),
      actor,
    );
    const lift = actionLandmarks(actor, "lift");
    assert.ok(
      lift[6][1] < lift[0][1] && lift[7][1] < lift[0][1],
      `${actor}: both hands above the head`,
    );
    const ready = actionLandmarks(actor, "ready");
    assert.ok(
      ready[0][1] < ready[1][1] && ready[1][1] < ready[8][1],
      `${actor}: upright neutral registration`,
    );
  }
  for (const actor of ["missing", null])
    assert.equal(
      actionLandmarks(actor),
      null,
      `${actor}: unknown actors retain the fallback`,
    );
  assert.equal(actionLandmarks("raven", "missing"), null);
});
