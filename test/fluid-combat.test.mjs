import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newRun, playCard } from "../src/game.js";
import { createCardCue } from "../src/presentation.js";
import {
  applyClassicActionFrame,
  CLASSIC_ACTION_ACTORS,
} from "../src/action-motion.js";
import {
  classicBodyBounds,
  classicBodyRatio,
  classicCombatFrame,
  classicSceneProjection,
} from "../src/classic-combat.js";
import {
  createFluidCombatTimeline,
  fluidCombatFrame,
  fluidPoseBlend,
  fluidVisibleBodyBounds,
  sampleFluidTrack,
} from "../src/fluid-combat.js";
import { poseRegistration } from "../src/fluid-artwork.js";

const manifest = JSON.parse(
  readFileSync(
    new URL("../public/assets/classic-actions/manifest.json", import.meta.url),
    "utf8",
  ),
);
const metadata = Object.fromEntries(
  Object.entries(manifest).map(([id, entry]) => [id, { ...entry, id }]),
);
const sides = ["player", "enemy"];
const channels = ["x", "y", "rz", "scale"];
const close = (a, b, epsilon = 1e-7, message = "values differ") =>
  assert.ok(Math.abs(a - b) <= epsilon, `${message}: ${a} versus ${b}`);
const optionsFor = (
  player = "nova",
  enemy = "viper",
  width = 374,
  height = 314,
) => ({
  actors: [player, enemy],
  metadata: [metadata[player], metadata[enemy]],
  bodyRatios: [classicBodyRatio(player), classicBodyRatio(enemy)],
  width,
  height,
});
function cueFor(id) {
  const before = newRun("raven", 314159);
  before.activeGimmick = null;
  before.hand = [{ id, uid: "fluid", upgraded: false }];
  before.draw = [{ id: "guard", uid: "next", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.energy = 10;
  before.player.hype = 9;
  before.enemy.hp = before.enemy.maxHp = 300;
  before.enemy.block = 0;
  return createCardCue(before, playCard(before, "fluid"), before.hand[0]);
}
function weights(blend) {
  const values = {};
  values[blend.from] = (values[blend.from] || 0) + 1 - blend.mix;
  values[blend.to] = (values[blend.to] || 0) + blend.mix;
  return values;
}

test("all ten actors use a stable feet-aligned canvas across every pose and exact ending knot", () => {
  for (const actor of CLASSIC_ACTION_ACTORS) {
    for (const id of [
      "strike",
      "powerbomb",
      "suplex",
      "armbar",
      "anklelock",
      "figurefour",
    ]) {
      const timeline = createFluidCombatTimeline(cueFor(id), optionsFor(actor));
      for (let step = 0; step <= 100; step++) {
        const frame = fluidCombatFrame(timeline, step / 100);
        sides.forEach((side, i) => {
          assert.equal(frame[side].drawWidth, timeline.fixed[i].width);
          assert.equal(frame[side].drawHeight, timeline.fixed[i].height);
          assert.equal(frame[side].fluid.anchor, "feet");
          assert.equal(
            frame[side].fluid.referenceHeight,
            timeline.fixed[i].referenceHeight,
          );
          channels.forEach((key) =>
            assert.ok(
              Number.isFinite(frame[side][key]),
              `${actor} ${id} ${side}.${key}`,
            ),
          );
        });
      }
      const start = fluidCombatFrame(timeline, 0),
        end = fluidCombatFrame(timeline, 1);
      sides.forEach((side) => {
        channels.forEach((key) =>
          close(
            start[side][key],
            end[side][key],
            1e-7,
            `${actor} ${id}: returns to ${key}`,
          ),
        );
        assert.equal(end[side].fluid.to, "ready");
      });
    }
  }
});

test("quintic tracks hit exact authored knots and have continuous position and velocity at their joins", () => {
  for (const id of ["strike", "powerbomb", "suplex", "armbar", "figurefour"]) {
    const timeline = createFluidCombatTimeline(cueFor(id), optionsFor());
    for (const track of timeline.tracks) {
      for (const knot of track) {
        const exact = sampleFluidTrack(track, knot.at);
        channels.forEach((key) =>
          close(
            exact[key],
            knot.channels[key].value,
            1e-8,
            `${id} ${key} knot`,
          ),
        );
        if (knot.at === 0 || knot.at === 1) continue;
        const epsilon = 1e-6;
        const left = sampleFluidTrack(track, knot.at - epsilon);
        const right = sampleFluidTrack(track, knot.at + epsilon);
        channels.forEach((key) => {
          const before = (exact[key] - left[key]) / epsilon;
          const after = (right[key] - exact[key]) / epsilon;
          close(before, after, 0.012, `${id} ${key}: continuous velocity`);
        });
      }
    }
  }
});

test("60 Hz sampling shows no crop-size or pose-threshold teleport in bodies or the responsive camera", () => {
  for (const [width, height] of [
    [374, 314],
    [533, 232],
  ]) {
    for (const id of [
      "strike",
      "dropkick",
      "powerbomb",
      "suplex",
      "armbar",
      "anklelock",
      "figurefour",
      "guard",
    ]) {
      const options = optionsFor("nova", "viper", width, height);
      const timeline = createFluidCombatTimeline(cueFor(id), options);
      const frames = Math.ceil(timeline.duration / (1000 / 60));
      let previous = fluidCombatFrame(timeline, 0);
      for (let frame = 1; frame <= frames; frame++) {
        const current = fluidCombatFrame(timeline, frame / frames);
        for (const side of sides) {
          assert.ok(
            Math.hypot(
              current[side].x - previous[side].x,
              current[side].y - previous[side].y,
            ) < 0.32,
            `${id} ${side}: no single-frame translation jump`,
          );
          assert.ok(
            Math.abs(current[side].rz - previous[side].rz) < 0.22,
            `${id} ${side}: no single-frame turn jump`,
          );
        }
        previous = current;
      }
      for (const windows of timeline.windows)
        for (const window of windows) {
          for (const at of [window.start, window.end]) {
            const before = fluidCombatFrame(timeline, at - 1e-6);
            const after = fluidCombatFrame(timeline, at + 1e-6);
            const p0 = classicSceneProjection(
              width,
              height,
              before,
              options.bodyRatios,
            );
            const p1 = classicSceneProjection(
              width,
              height,
              after,
              options.bodyRatios,
            );
            close(
              p0.unit,
              p1.unit,
              0.02,
              `${id}: camera scale does not jump at pose change`,
            );
            close(
              p0.centerX,
              p1.centerX,
              0.002,
              `${id}: camera center does not jump at pose change`,
            );
          }
        }
    }
  }
});

test("whole-pose blends remain continuous at every boundary and exact contact holds last at most two frames", () => {
  for (const id of [
    "strike",
    "powerbomb",
    "suplex",
    "figurefour",
    "doubletap",
  ]) {
    const cue = cueFor(id);
    const originalHitstop = cue.camera.hitstop;
    const timeline = createFluidCombatTimeline(cue, optionsFor());
    assert.equal(
      cue.camera.hitstop,
      originalHitstop,
      "planning never mutates the authoritative cue",
    );
    assert.ok(timeline.times.hold * timeline.duration <= 1000 / 30 + 1e-8);
    for (const windows of timeline.windows) {
      for (const window of windows) {
        assert.ok(window.end > window.start);
        for (const p of [window.start, window.end]) {
          const left = weights(fluidPoseBlend(windows, p - 1e-6));
          const right = weights(fluidPoseBlend(windows, p + 1e-6));
          for (const pose of new Set([
            ...Object.keys(left),
            ...Object.keys(right),
          ]))
            close(
              left[pose] || 0,
              right[pose] || 0,
              1e-6,
              `${id}: no pose-opacity jump`,
            );
        }
      }
    }
    for (const at of timeline.times.contacts) {
      const first = fluidCombatFrame(timeline, at);
      const during = fluidCombatFrame(timeline, at + timeline.times.hold * 0.5);
      sides.forEach((side) =>
        channels.forEach((key) =>
          close(
            first[side][key],
            during[side][key],
            1e-7,
            `${id}: exact brief hitstop`,
          ),
        ),
      );
    }
  }
});

test("utility holds stay guarded without flashes, while missing atlases, idle and reduced motion stay unchanged", () => {
  const options = optionsFor();
  for (const id of ["armbar", "anklelock", "wristlock"]) {
    const timeline = createFluidCombatTimeline(cueFor(id), options);
    const hold = fluidCombatFrame(timeline, 0.6);
    assert.equal(hold.enemy.actionPose, "guard");
    assert.equal(hold.contact.visible, false);
    assert.equal(hold.contact.strength, 0);
    assert.ok(
      Math.abs(hold.enemy.rz) > 1.4,
      `${id}: guarding partner stays down in the hold`,
    );
  }
  const cue = cueFor("powerbomb");
  for (const actor of ["missing"]) {
    const mixed = optionsFor("nova", actor);
    const timeline = createFluidCombatTimeline(cue, mixed);
    for (const p of [0, 0.2, 0.55, 0.83, 1]) {
      const baseline = applyClassicActionFrame(
        classicCombatFrame(cue, p, mixed),
        cue,
        p,
        mixed,
      );
      assert.deepEqual(
        fluidCombatFrame(timeline, p).enemy,
        baseline.enemy,
        `${actor}: existing behavior retained`,
      );
    }
  }
  for (const action of [cue, null]) {
    const timeline = createFluidCombatTimeline(action, options);
    for (const p of [0, 0.55, 1]) {
      const settings = { ...options, still: true };
      assert.deepEqual(
        fluidCombatFrame(timeline, p, { still: true }),
        applyClassicActionFrame(
          classicCombatFrame(action, p, settings),
          action,
          p,
          settings,
        ),
      );
    }
  }
});

// Independent CPU evaluation of the actual shader at intermediate landmarks,
// rather than interpolation of the endpoint bounds used by the planner.
function shaderPoint(px, py, source, target) {
  const weights = [];
  let sx = 0,
    sy = 0,
    tx = 0,
    ty = 0,
    total = 0;
  for (let i = 0; i < source.length; i += 2) {
    const distance = (px - source[i]) ** 2 + (py - source[i + 1]) ** 2;
    const weight = 1 / Math.max(0.000001, distance ** 2);
    weights.push(weight);
    sx += source[i] * weight;
    sy += source[i + 1] * weight;
    tx += target[i] * weight;
    ty += target[i + 1] * weight;
    total += weight;
  }
  sx /= total;
  sy /= total;
  tx /= total;
  ty /= total;
  let a = 0,
    b = 0,
    spread = 0;
  for (let i = 0; i < source.length; i += 2) {
    const x = source[i] - sx,
      y = source[i + 1] - sy;
    const u = target[i] - tx,
      v = target[i + 1] - ty;
    a += weights[i / 2] * (x * u + y * v);
    b += weights[i / 2] * (x * v - y * u);
    spread += weights[i / 2] * (x * x + y * y);
  }
  a /= Math.max(spread, 0.000001);
  b /= Math.max(spread, 0.000001);
  return [
    tx + a * (px - sx) - b * (py - sy),
    ty + b * (px - sx) + a * (py - sy),
  ];
}

test("visible camera bounds contain each connected GPU surface through wide and grounded pose transitions", () => {
  for (const actor of CLASSIC_ACTION_ACTORS) {
    const timeline = createFluidCombatTimeline(
      cueFor("powerbomb"),
      optionsFor(actor),
    );
    for (const [from, to] of [
      ["ready", "kick"],
      ["lift", "slam"],
      ["suplex", "clinch"],
      ["clinch", "armbar"],
      ["guard", "leglock"],
    ]) {
      const first = poseRegistration(metadata[actor], actor, from);
      const second = poseRegistration(metadata[actor], actor, to);
      for (const mix of [0.2, 0.5, 0.8]) {
        const body = {
          x: 0.3,
          y: 1.8,
          rz: mix * 3 - 1.2,
          scale: 0.94,
          drawWidth: timeline.fixed[0].width,
          drawHeight: timeline.fixed[0].height,
          fluid: { from, to, mix },
        };
        const mirrored = mix !== 0.5;
        const bounds = fluidVisibleBodyBounds(
          body,
          actor,
          metadata[actor],
          mirrored,
        );
        const target = first.points.map(
          (value, i) => value + (second.points[i] - value) * mix,
        );
        for (const source of [first, second]) {
          for (let row = 0; row <= 30; row++) {
            for (let column = 0; column <= 24; column++) {
              const uv = shaderPoint(
                source.offset[0] + (column / 24) * source.size[0],
                source.offset[1] + (row / 30) * source.size[1],
                source.points,
                target,
              );
              // The renderer's fixed canvas clips the connected mesh perimeter.
              const x =
                (Math.max(0, Math.min(1, uv[0])) - 0.5) *
                body.drawWidth *
                body.scale *
                (mirrored ? -1 : 1);
              const y =
                (0.5 - Math.max(0, Math.min(1, uv[1]))) *
                body.drawHeight *
                body.scale;
              const px = body.x + x * Math.cos(body.rz) - y * Math.sin(body.rz);
              const py = body.y + x * Math.sin(body.rz) + y * Math.cos(body.rz);
              assert.ok(
                px >= bounds.left &&
                  px <= bounds.right &&
                  py >= bounds.bottom &&
                  py <= bounds.top,
                `${actor} ${from}→${to} mix ${mix}: whole mesh is in view`,
              );
            }
          }
        }
      }
    }
  }
});

test("locked replay camera removes unrelated transparent padding without changing its envelope during playback", () => {
  for (const card of ["powerbomb", "suplex", "armbar"]) {
    const timeline = createFluidCombatTimeline(
      cueFor(card),
      optionsFor("raven", "nova"),
    );
    const full = {
      left: Infinity,
      right: -Infinity,
      bottom: Infinity,
      top: -Infinity,
    };
    const locked = structuredClone(timeline.bounds);
    for (let step = 0; step <= 120; step++) {
      const frame = fluidCombatFrame(timeline, step / 120);
      for (const side of sides) {
        const bounds = classicBodyBounds(frame[side]);
        full.left = Math.min(full.left, bounds.left);
        full.right = Math.max(full.right, bounds.right);
        full.bottom = Math.min(full.bottom, bounds.bottom);
        full.top = Math.max(full.top, bounds.top);
      }
      assert.deepEqual(
        timeline.bounds,
        locked,
        "projection envelope remains fixed throughout the replay",
      );
    }
    assert.ok(
      timeline.bounds.top - timeline.bounds.bottom <
        (full.top - full.bottom) * 0.95,
      `${card}: visible height restores at least 5% of camera range`,
    );
    assert.ok(
      timeline.bounds.right - timeline.bounds.left <
        (full.right - full.left) * 0.96,
      `${card}: visible width removes at least 4% of transparent padding`,
    );
  }
});
