import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, WRESTLERS, newRun, playCard } from "../src/game.js";
import { createCardCue } from "../src/presentation.js";
import { sdBodyBounds } from "../src/sd-artwork.js";
import {
  CLASSIC_BODY_CROPS,
  classicArtworkStyle,
  classicBodyRatio,
  classicCombatFrame,
  classicSceneProjection,
  classicScreenPoint,
} from "../src/classic-combat.js";

function cueFor(id) {
  const before = newRun("raven", 314159);
  before.activeGimmick = null;
  before.hand = [{ id, uid: "classic-projection", upgraded: false }];
  before.draw = [{ id: "guard", uid: "classic-next", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.energy = 10;
  before.player.hype = 9;
  before.enemy.hp = before.enemy.maxHp = 300;
  before.enemy.block = 0;
  return createCardCue(
    before,
    playCard(before, "classic-projection"),
    before.hand[0],
  );
}
const close = (a, b, label = "equal") =>
  assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} vs ${b}`);

test("all ten original actors retain complete source proportions and correctly mirrored gutters", () => {
  assert.deepEqual(
    Object.keys(CLASSIC_BODY_CROPS).sort(),
    Object.keys(WRESTLERS).sort(),
  );
  for (const [actor, [x, y, width, height]] of Object.entries(
    CLASSIC_BODY_CROPS,
  )) {
    assert.ok(
      x >= 0 && y >= 0 && x + width <= 1000 && y + height <= 1500,
      actor,
    );
    const ratio = classicBodyRatio(actor);
    assert.ok(ratio > 0.45 && ratio < 0.6, actor);
    for (const mirrored of [false, true]) {
      const style = classicArtworkStyle(actor, mirrored);
      const scaleX = parseFloat(style.width) / 100;
      const scaleY = parseFloat(style.height) / 100;
      close(
        (scaleX * ratio) / scaleY,
        2 / 3,
        `${actor}: undistorted full image`,
      );
      const sourceLeft = mirrored ? 1000 - x - width : x;
      close(
        parseFloat(style.left) + (sourceLeft / width) * 100,
        0,
        `${actor}: silhouette origin`,
      );
      close(
        parseFloat(style.top) + (y / height) * 100,
        0,
        `${actor}: top origin`,
      );
    }
  }
});

test("idle original fighters fill the expanded arena and always return to their responsive homes", () => {
  const bodyRatios = [classicBodyRatio("viper"), classicBodyRatio("nova")];
  for (const [width, height] of [
    [374, 314],
    [348, 125],
    [533, 232],
    [1266, 412],
  ]) {
    const options = { width, height, bodyRatios };
    const idle = classicCombatFrame(null, 0, options);
    const projection = classicSceneProjection(width, height, idle, bodyRatios);
    assert.ok(
      3 * projection.unit >= height * 0.9,
      `${width}×${height}: full-height original bodies`,
    );
    assert.ok(idle.player.x < 0 && idle.enemy.x > 0);
    for (const id of ["strike", "powerbomb", "armbar", "guard"]) {
      assert.deepEqual(
        classicCombatFrame(cueFor(id), 1, options),
        idle,
        `${id}: no ending displacement`,
      );
    }
  }
});

test("every card and original actor pair keep rotated and lifted bodies inside both arena orientations", () => {
  const ratios = Object.keys(WRESTLERS).map(classicBodyRatio);
  for (const id of Object.keys(CARDS)) {
    const cue = cueFor(id);
    for (const [width, height] of [
      [348, 125],
      [374, 314],
      [533, 232],
      [1266, 412],
    ]) {
      for (let step = 0; step <= 50; step++) {
        for (let pair = 0; pair < ratios.length; pair++) {
          const bodyRatios = [ratios[pair], ratios[(pair + 1) % ratios.length]];
          const frame = classicCombatFrame(cue, step / 50, {
            width,
            height,
            bodyRatios,
          });
          for (const cinematic of [false, true]) {
            const projection = classicSceneProjection(
              width,
              height,
              frame,
              bodyRatios,
              cinematic,
            );
            for (const [index, side] of ["player", "enemy"].entries()) {
              const bounds = sdBodyBounds(frame[side], bodyRatios[index]);
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
                  `${id} ${side}@${step / 50} ${width}×${height}: ${JSON.stringify(point)}`,
                );
              }
            }
          }
        }
      }
    }
  }
});

test("original strikes, slams and submissions differ, while utility and reduced motion keep opponents still", () => {
  const options = {
    width: 374,
    height: 314,
    bodyRatios: [classicBodyRatio("viper"), classicBodyRatio("nova")],
  };
  const strike = classicCombatFrame(cueFor("strike"), 0.55, options);
  const slam = classicCombatFrame(cueFor("powerbomb"), 0.42, options);
  const hold = classicCombatFrame(cueFor("figurefour"), 0.55, options);
  assert.equal(strike.player.pose, "strike");
  assert.ok(Math.abs(slam.enemy.rz) > Math.abs(strike.enemy.rz) + 1);
  assert.equal(hold.player.pose, "submission");
  assert.ok(Math.abs(hold.player.rz) > 1);
  const utility = {
    id: "focus",
    attacking: false,
    damage: 0,
    effect: { family: "tactics" },
    camera: { impacts: [] },
  };
  const idle = classicCombatFrame(null, 0, options);
  for (const progress of [0.2, 0.55, 0.8]) {
    const frame = classicCombatFrame(utility, progress, options);
    assert.deepEqual(frame.enemy, idle.enemy);
    assert.equal(frame.contact.visible, false);
    const reduced = classicCombatFrame(cueFor("powerbomb"), progress, {
      ...options,
      still: true,
    });
    assert.deepEqual(reduced.player, idle.player);
    assert.deepEqual(reduced.enemy, idle.enemy);
  }
  const item = {
    id: "item",
    attacker: "player",
    attacking: true,
    damage: 8,
    duration: 900,
  };
  const itemFrame = classicCombatFrame(item, 0.29, {
    ...options,
    incoming: true,
  });
  assert.equal(itemFrame.player.pose, "strike");
  assert.equal(itemFrame.enemy.pose, "hurt");
});
