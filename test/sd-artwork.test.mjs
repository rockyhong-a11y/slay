import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CARDS, WRESTLERS, newRun, playCard } from "../src/game.js";
import { createCardCue } from "../src/presentation.js";
import { sdCombatFrame } from "../src/sd-combat.js";
import {
  sdSpriteFrame,
  sdSpriteGeometry,
  sdArtworkRect,
  sdBodyBounds,
  sdSceneProjection,
  sdScreenPoint,
} from "../src/sd-artwork.js";

const root = new URL("../", import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const manifest = json("public/assets/sd2d/manifest.json");
const alphaQA = json("artifacts/sd2d-atlas-qa.json");
const close = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-7,
    `${message}: ${actual} vs ${expected}`,
  );

test("all ten current PNG atlases register thirty complete alpha-measured poses without clipped strong edges", () => {
  assert.deepEqual(Object.keys(manifest).sort(), Object.keys(WRESTLERS).sort());
  assert.equal(alphaQA.actorsMeasured, 10);
  assert.equal(alphaQA.posesMeasured, 30);
  assert.equal(alphaQA.sourcePixelsModified, false);
  assert.deepEqual(alphaQA.errors, []);
  for (const [actor, entry] of Object.entries(manifest)) {
    const png = readFileSync(new URL(`public/assets/sd2d/${actor}.png`, root));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", actor);
    assert.equal(png.readUInt32BE(16), entry.width, actor);
    assert.equal(png.readUInt32BE(20), entry.height, actor);
    assert.equal(png[25], 6, `${actor}: RGBA source`);
    const qa = alphaQA.assets[actor];
    assert.equal(
      createHash("sha256").update(png).digest("hex"),
      qa.sha256,
      `${actor}: stale alpha QA`,
    );
    assert.equal(qa.nonemptyPoseCount, 3, actor);
    assert.equal(qa.majorSilhouetteBands.length, 3, actor);
    assert.ok(qa.transparentFraction > 0.1, actor);
    assert.deepEqual(qa.errors, [], actor);
    assert.equal(entry.frames.length, 3, actor);
    let right = 0;
    entry.frames.forEach((frame, index) => {
      assert.ok(
        frame.x >= right && frame.y >= 0,
        `${actor} frame ${index}: non-overlap`,
      );
      assert.ok(frame.width > 0 && frame.height > 0, actor);
      assert.ok(
        frame.x + frame.width <= entry.width &&
          frame.y + frame.height <= entry.height,
        actor,
      );
      right = frame.x + frame.width;
      const bounds = qa.frames[index].strongBounds;
      assert.ok(bounds.x >= frame.x && bounds.y >= frame.y, actor);
      assert.ok(bounds.x + bounds.width <= right, actor);
      assert.ok(bounds.y + bounds.height <= frame.y + frame.height, actor);
      assert.ok(
        qa.frames[index].outsideCropMaxAlpha <= qa.alphaThreshold,
        actor,
      );
    });
    for (const valley of qa.valleys)
      assert.equal(valley.minimumStrongPixelsPerColumn, 0, actor);
    for (const [side, edge] of Object.entries(qa.edges))
      assert.equal(
        edge.strongPixels,
        0,
        `${actor} ${side}: source silhouette touches canvas edge`,
      );
  }
});

test("CSS background percentages map measured uneven source rectangles exactly to the displayed whole-pose cell", () => {
  for (const [actor, entry] of Object.entries(manifest)) {
    for (const [index, pose] of ["idle", "strike", "hurt"].entries()) {
      const geometry = sdSpriteGeometry(
        entry.width,
        entry.height,
        pose,
        entry.frames,
      );
      assert.equal(geometry.exact, true);
      assert.equal(geometry.frame, index);
      assert.deepEqual(geometry.source, entry.frames[index]);
      const rect = sdArtworkRect(173, 211, geometry.cellRatio, geometry);
      const scale = rect.width / geometry.source.width;
      const [sizeX, sizeY] = geometry.backgroundSize.split(" ").map(parseFloat);
      const [positionX, positionY] = geometry.backgroundPosition
        .split(" ")
        .map(parseFloat);
      const drawnWidth = (rect.width * sizeX) / 100;
      const drawnHeight = (rect.height * sizeY) / 100;
      const offsetX = ((rect.width - drawnWidth) * positionX) / 100;
      const offsetY = ((rect.height - drawnHeight) * positionY) / 100;
      close(drawnWidth, entry.width * scale, actor);
      close(drawnHeight, entry.height * scale, actor);
      close(offsetX + geometry.source.x * scale, 0, `${actor}: crop left`);
      close(offsetY + geometry.source.y * scale, 0, `${actor}: crop top`);
      close(
        offsetX + (geometry.source.x + geometry.source.width) * scale,
        rect.width,
        `${actor}: crop right`,
      );
      close(
        offsetY + (geometry.source.y + geometry.source.height) * scale,
        rect.height,
        `${actor}: crop bottom`,
      );
    }
  }
});

test("idle, attack and hurt use a shared pixel scale and boot baseline without pose-size pumping", () => {
  for (const [actor, entry] of Object.entries(manifest)) {
    for (const [width, height] of [
      [90, 180],
      [300, 130],
      [190, 270],
    ]) {
      let expectedScale;
      for (const pose of ["idle", "strike", "hurt"]) {
        const geometry = sdSpriteGeometry(
          entry.width,
          entry.height,
          pose,
          entry.frames,
        );
        const rect = sdArtworkRect(width, height, geometry.cellRatio, geometry);
        const scale = rect.width / geometry.source.width;
        expectedScale ??= scale;
        close(scale, expectedScale, actor);
        close(rect.height / geometry.source.height, expectedScale, actor);
        close(rect.top + rect.height, height, `${actor}: grounded boots`);
        assert.ok(rect.left >= -1e-8 && rect.top >= -1e-8, actor);
        assert.ok(
          rect.width <= width + 1e-8 && rect.height <= height + 1e-8,
          actor,
        );
      }
    }
  }
});

test("pose selection and invalid metadata have finite complete-cell fallbacks", () => {
  for (const pose of ["strike", "grapple", "slam", "submission"])
    assert.equal(sdSpriteFrame(pose), 1);
  for (const pose of ["hurt", "groggy"]) assert.equal(sdSpriteFrame(pose), 2);
  for (const pose of ["idle", "guard", "victory", null, "missing"])
    assert.equal(sdSpriteFrame(pose), 0);
  for (const frames of [
    undefined,
    [],
    [{ x: -1, y: 0, width: 5, height: 10 }],
    Array(3).fill({ x: 0, y: 0, width: Infinity, height: 1 }),
  ]) {
    const geometry = sdSpriteGeometry(NaN, undefined, "hurt", frames);
    assert.equal(geometry.exact, false);
    assert.ok(Object.values(geometry.source).every(Number.isFinite));
    assert.ok(Number.isFinite(geometry.sharedRatio));
    const rect = sdArtworkRect(0, 0, geometry.cellRatio, geometry);
    assert.ok(Object.values(rect).every(Number.isFinite));
  }
});

function cueFor(id) {
  const before = newRun("raven", 314159);
  before.activeGimmick = null;
  before.hand = [{ id, uid: "sd-projection", upgraded: false }];
  before.draw = [{ id: "guard", uid: "sd-next", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.energy = 10;
  before.player.hype = 9;
  before.enemy.hp = before.enemy.maxHp = 300;
  before.enemy.block = 0;
  return createCardCue(
    before,
    playCard(before, "sd-projection"),
    before.hand[0],
  );
}

test("every card keeps all rotated and elevated whole sprites inside portrait and landscape stages", () => {
  const ratios = Object.values(manifest).map(
    (entry) =>
      sdSpriteGeometry(entry.width, entry.height, "idle", entry.frames)
        .sharedRatio,
  );
  const pairs = ratios.map((ratio, index) => [
    ratio,
    ratios[(index + 1) % ratios.length],
  ]);
  for (const id of Object.keys(CARDS)) {
    const cue = cueFor(id);
    for (let step = 0; step <= 100; step++) {
      for (const ratioPair of pairs) {
        const frame = sdCombatFrame(cue, step / 100, { bodyRatios: ratioPair });
        for (const [width, height] of [
          [320, 160],
          [844, 200],
          [390, 320],
          [1280, 720],
        ]) {
          for (const cinematic of [false, true]) {
            const projection = sdSceneProjection(
              width,
              height,
              frame,
              ratioPair,
              cinematic,
            );
            for (const [index, side] of ["player", "enemy"].entries()) {
              const bounds = sdBodyBounds(frame[side], ratioPair[index]);
              for (const [x, y] of [
                [bounds.left, bounds.top],
                [bounds.right, bounds.bottom],
              ]) {
                const point = sdScreenPoint(x, y, projection);
                assert.ok(
                  point.x >= 0 &&
                    point.x <= width &&
                    point.y >= 0 &&
                    point.y <= height,
                  `${id}@${step / 100} ${side} ${width}x${height} cinematic=${cinematic}: ${JSON.stringify(point)}`,
                );
              }
            }
          }
        }
      }
    }
  }
});
