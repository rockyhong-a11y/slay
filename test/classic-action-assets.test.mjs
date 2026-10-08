import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CARDS, WRESTLERS, newRun, playCard } from "../src/game.js";
import { createCardCue } from "../src/presentation.js";
import {
  CLASSIC_ACTION_ACTORS,
  CLASSIC_ACTION_POSES,
  hasClassicActionArt,
  classicActionGeometry,
  applyClassicActionFrame,
} from "../src/action-motion.js";
import {
  classicBodyRatio,
  classicBodyBounds,
  classicCombatFrame,
  classicSceneProjection,
  classicScreenPoint,
} from "../src/classic-combat.js";

const firstFive = ["raven", "valkyrie", "nova", "viper", "ember"];
const remainingFive = ["atlas", "seraph", "lynx", "onyx", "tempest"];
const assetRoot = new URL("../public/assets/classic-actions/", import.meta.url);
const manifest = () =>
  JSON.parse(readFileSync(new URL("manifest.json", assetRoot), "utf8"));
const alphaEvidence = () =>
  JSON.parse(
    readFileSync(
      new URL("../artifacts/classic-actions/alpha-qa.json", import.meta.url),
      "utf8",
    ),
  );
const close = (a, b, label) =>
  assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} vs ${b}`);
const metadataFor = (entries, actor) =>
  entries[actor] ? { ...entries[actor], id: actor } : null;

function cueFor(id) {
  const before = newRun("raven", 314159);
  before.activeGimmick = null;
  before.hand = [{ id, uid: "action-art-card", upgraded: false }];
  before.draw = [{ id: "guard", uid: "action-art-next", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.energy = 10;
  before.player.hype = 9;
  before.enemy.hp = before.enemy.maxHp = 300;
  before.enemy.block = 0;
  return createCardCue(
    before,
    playCard(before, "action-art-card"),
    before.hand[0],
  );
}

test("only the first five original wrestlers ship distinct twelve-pose action atlases", () => {
  const entries = manifest();
  const measured = alphaEvidence();
  assert.deepEqual(CLASSIC_ACTION_ACTORS, firstFive);
  assert.deepEqual(Object.keys(entries).sort(), [...firstFive].sort());
  assert.deepEqual(Object.keys(measured).sort(), [...firstFive].sort());
  assert.equal(CLASSIC_ACTION_POSES.length, 12);
  const hashes = new Set();
  for (const actor of firstFive) {
    const entry = entries[actor];
    assert.equal(hasClassicActionArt(actor), true, actor);
    assert.deepEqual(
      Object.keys(entry.frames).sort(),
      [...CLASSIC_ACTION_POSES].sort(),
      actor,
    );
    const png = readFileSync(new URL(`${actor}.png`, assetRoot));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", actor);
    assert.equal(png.readUInt32BE(16), entry.width, `${actor}: atlas width`);
    assert.equal(png.readUInt32BE(20), entry.height, `${actor}: atlas height`);
    const hash = createHash("sha256").update(png).digest("hex");
    hashes.add(hash);
    const qa = measured[actor];
    assert.equal(
      qa.sha256,
      hash,
      `${actor}: alpha evidence belongs to the shipped PNG`,
    );
    assert.equal(qa.width, entry.width);
    assert.equal(qa.height, entry.height);
    assert.equal(qa.alphaThreshold, 150);
    for (const pose of CLASSIC_ACTION_POSES) {
      const frame = entry.frames[pose];
      const geometry = classicActionGeometry(entry, pose);
      assert.ok(geometry, `${actor}/${pose}`);
      assert.match(
        geometry.clipPath,
        /^polygon\(/,
        `${actor}/${pose}: isolated silhouette clip`,
      );
      const evidence = qa.frames[pose];
      assert.ok(
        evidence.inkPixels > 0,
        `${actor}/${pose}: nonempty illustration`,
      );
      assert.equal(
        evidence.clipContainsWholePose,
        true,
        `${actor}/${pose}: no clipped strong source ink`,
      );
      assert.equal(
        evidence.neighborInkPixels,
        0,
        `${actor}/${pose}: no adjacent figure bleed`,
      );
      const [left, top, right, bottom] = evidence.inkBounds;
      assert.ok(
        [left, top, right, bottom].every(Number.isFinite) &&
          left >= frame.x &&
          top >= frame.y &&
          right <= frame.x + frame.width &&
          bottom <= frame.y + frame.height,
        `${actor}/${pose}: measured source ink stays inside its crop`,
      );
    }
  }
  assert.equal(hashes.size, 5, "every wrestler has her own action artwork");
  for (const actor of [...remainingFive, "missing"]) {
    assert.equal(hasClassicActionArt(actor), false, actor);
    assert.equal(
      entries[actor],
      undefined,
      `${actor}: outside this action-art release`,
    );
  }
  assert.deepEqual(
    [...firstFive, ...remainingFive].sort(),
    Object.keys(WRESTLERS).sort(),
  );
});

test("all sixty actual action crops preserve source proportions and the same pixel scale through CSS projection", () => {
  const entries = manifest();
  for (const actor of firstFive) {
    const entry = entries[actor];
    let worldPixelScale;
    for (const pose of CLASSIC_ACTION_POSES) {
      const geometry = classicActionGeometry(entry, pose);
      assert.ok(geometry, `${actor}/${pose}: complete metadata`);
      const source = entry.frames[pose];
      const scale = geometry.worldWidth / source.width;
      worldPixelScale ??= scale;
      close(scale, worldPixelScale, `${actor}/${pose}: shared source scale`);
      close(
        geometry.worldHeight / source.height,
        worldPixelScale,
        `${actor}/${pose}: undistorted body`,
      );
      const [sizeX, sizeY] = geometry.backgroundSize.split(" ").map(parseFloat);
      const [positionX, positionY] = geometry.backgroundPosition
        .split(" ")
        .map(parseFloat);
      const width = geometry.worldWidth * 100;
      const height = geometry.worldHeight * 100;
      const drawnWidth = (width * sizeX) / 100;
      const drawnHeight = (height * sizeY) / 100;
      const offsetX = ((width - drawnWidth) * positionX) / 100;
      const offsetY = ((height - drawnHeight) * positionY) / 100;
      const displayedScale = width / source.width;
      close(
        offsetX + source.x * displayedScale,
        0,
        `${actor}/${pose}: crop left`,
      );
      close(
        offsetY + source.y * displayedScale,
        0,
        `${actor}/${pose}: crop top`,
      );
      close(
        offsetX + (source.x + source.width) * displayedScale,
        width,
        `${actor}/${pose}: crop right`,
      );
      close(
        offsetY + (source.y + source.height) * displayedScale,
        height,
        `${actor}/${pose}: crop bottom`,
      );
    }
  }
});

test("every card fits real action-pose bounds with both action and fallback opponents in portrait and landscape", () => {
  const entries = manifest();
  const pairs = firstFive.flatMap((actor, index) => [
    [actor, firstFive[(index + 1) % firstFive.length]],
    [actor, remainingFive[index]],
  ]);
  for (const id of Object.keys(CARDS)) {
    const cue = cueFor(id);
    for (const actors of pairs) {
      const bodyRatios = actors.map(classicBodyRatio);
      const metadata = actors.map((actor) => metadataFor(entries, actor));
      for (const [width, height] of [
        [348, 125],
        [374, 314],
        [533, 232],
        [1266, 412],
      ]) {
        for (let step = 0; step <= 50; step++) {
          const progress = step / 50;
          const options = { width, height, bodyRatios, actors, metadata };
          const base = classicCombatFrame(cue, progress, options);
          const frame = applyClassicActionFrame(base, cue, progress, options);
          for (const cinematic of [false, true]) {
            const projection = classicSceneProjection(
              width,
              height,
              frame,
              bodyRatios,
              cinematic,
            );
            for (const [index, side] of ["player", "enemy"].entries()) {
              const bounds = classicBodyBounds(frame[side], bodyRatios[index]);
              for (const [x, y] of [
                [bounds.left, bounds.top],
                [bounds.right, bounds.bottom],
              ]) {
                const point = classicScreenPoint(x, y, projection);
                assert.ok(
                  point.x >= 0 &&
                    point.x <= width &&
                    point.y >= 0 &&
                    point.y <= height,
                  `${actors.join("/")} ${id}@${progress} ${side} ${width}x${height} cinematic=${cinematic}: ${JSON.stringify(point)}`,
                );
              }
            }
          }
          if (cue.utility)
            assert.equal(
              frame.contact.visible,
              false,
              `${id}: preparation is not a hit`,
            );
          for (const [index, side] of ["player", "enemy"].entries()) {
            if (!hasClassicActionArt(actors[index]) || progress === 1)
              assert.deepEqual(
                frame[side],
                base[side],
                `${actors[index]}: fallback or completed pose unchanged`,
              );
          }
        }
      }
    }
  }
});

test("missing, wrong-actor and partial action metadata preserve the complete original fighters", () => {
  const entries = manifest();
  const actors = ["viper", "nova"];
  const cue = cueFor("powerbomb");
  const options = {
    actors,
    width: 374,
    height: 314,
    bodyRatios: actors.map(classicBodyRatio),
  };
  const base = classicCombatFrame(cue, 0.4, options);
  const partial = metadataFor(entries, "viper");
  partial.frames = { ...partial.frames };
  delete partial.frames.kick;
  for (const metadata of [
    [null, null],
    [metadataFor(entries, "raven"), metadataFor(entries, "ember")],
    [partial, null],
  ]) {
    const result = applyClassicActionFrame(base, cue, 0.4, {
      ...options,
      metadata,
    });
    assert.deepEqual(result, base);
  }
  const readyMetadata = actors.map((actor) => metadataFor(entries, actor));
  for (const still of [true]) {
    const result = applyClassicActionFrame(base, cue, 0.4, {
      ...options,
      metadata: readyMetadata,
      still,
    });
    assert.deepEqual(
      result,
      base,
      "reduced motion keeps the original whole-pose surface",
    );
  }
});
