import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, WRESTLERS, newRun, playCard } from "../src/game.js";
import { createCardCue } from "../src/presentation.js";
import { sdActorId, sdCombatFrame } from "../src/sd-combat.js";
import {
  sdBodyBounds,
  sdSceneProjection,
  sdScreenPoint,
} from "../src/sd-artwork.js";

function replay(id, blocked = false) {
  const before = newRun("raven", 98765);
  before.activeGimmick = null;
  before.hand = [{ id, uid: "sd-card", upgraded: false }];
  before.draw = [{ id: "guard", uid: "sd-draw", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.energy = 10;
  before.player.hype = 9;
  before.enemy.hp = before.enemy.maxHp = 300;
  before.enemy.block = blocked ? 100 : 0;
  const after = playCard(before, "sd-card");
  return { before, after, cue: createCardCue(before, after, before.hand[0]) };
}

const poses = new Set([
  "idle",
  "strike",
  "grapple",
  "slam",
  "submission",
  "guard",
  "hurt",
  "victory",
  "groggy",
]);
function valid(frame) {
  for (const side of ["player", "enemy"]) {
    assert.ok(poses.has(frame[side].pose));
    assert.deepEqual(Object.keys(frame[side]).sort(), [
      "depth",
      "pose",
      "rz",
      "scale",
      "x",
      "y",
    ]);
    for (const key of ["x", "y", "rz", "scale", "depth"])
      assert.ok(Number.isFinite(frame[side][key]), `${side}.${key}`);
    assert.ok(frame[side].scale >= 0.95 && frame[side].scale <= 1.03);
    assert.ok([-1, 0, 1].includes(frame[side].depth));
  }
  for (const value of Object.values(frame.camera))
    assert.ok(Number.isFinite(value));
  for (const key of ["x", "y", "strength"])
    assert.ok(Number.isFinite(frame.contact[key]));
  assert.equal(typeof frame.contact.visible, "boolean");
  assert.equal(typeof frame.phase, "string");
}

test("all ten SD actors resolve safely and idle fighters remain separated at their home pivots", () => {
  for (const id of Object.keys(WRESTLERS)) assert.equal(sdActorId(id), id);
  assert.equal(sdActorId("VIPER"), "viper");
  assert.equal(sdActorId({ id: "raven" }), "raven");
  for (const value of [null, undefined, "missing", "__proto__", 0])
    assert.equal(sdActorId(value), "nova");
  for (const progress of [0, 0.5, 1]) {
    const idle = sdCombatFrame(null, progress);
    valid(idle);
    assert.equal(idle.player.x, -1.55);
    assert.equal(idle.enemy.x, 1.55);
    assert.equal(idle.player.y, 1.5);
    assert.equal(idle.enemy.y, 1.5);
    assert.equal(idle.player.scale, 1);
    assert.equal(idle.enemy.scale, 1);
    assert.equal(idle.contact.visible, false);
  }
});

test("every card supplies finite deterministic whole-illustration frames without changing resolved health or cues", () => {
  for (const id of Object.keys(CARDS)) {
    const replayed = replay(id);
    const original = structuredClone(replayed);
    for (let index = 0; index <= 100; index++) {
      const p = index / 100;
      const frame = sdCombatFrame(replayed.cue, p);
      valid(frame);
      assert.deepEqual(frame, sdCombatFrame(replayed.cue, p), id);
    }
    assert.deepEqual(replayed, original, id);
    assert.deepEqual(
      sdCombatFrame(replayed.cue, 1),
      sdCombatFrame(null, 1),
      id,
    );
  }
});

test("strike contacts align exactly with each card camera beat and hold both complete illustrations", () => {
  for (const id of ["strike", "doubletap", "redline", "powerbomb", "suplex"]) {
    const cue = replay(id).cue;
    for (const at of cue.camera.impacts) {
      assert.equal(
        sdCombatFrame(cue, at - 0.0001).contact.visible,
        false,
        `${id} before contact`,
      );
      const contact = sdCombatFrame(cue, at);
      assert.equal(contact.contact.visible, true, id);
      assert.ok(contact.contact.strength > 0, id);
      const insideHold =
        at + Math.min(0.005, cue.camera.hitstop / cue.duration / 2);
      const held = sdCombatFrame(cue, insideHold);
      assert.deepEqual(held.player, contact.player, id);
      assert.deepEqual(held.enemy, contact.enemy, id);
      assert.equal(held.camera.shakeX, 0, id);
    }
  }
});

test("powerbombs and suplexes lift then land horizontally while aerial moves lift the attacker", () => {
  for (const id of ["powerbomb", "suplex", "bodyslam", "championship"]) {
    const cue = replay(id).cue;
    const apex = sdCombatFrame(cue, cue.camera.impacts[0] * 0.76);
    const contact = sdCombatFrame(cue, cue.camera.impacts[0]);
    assert.ok(apex.enemy.y >= 3.1, id);
    assert.equal(contact.enemy.y, 1, id);
    assert.ok(Math.abs(Math.abs(contact.enemy.rz) - Math.PI / 2) < 0.001, id);
    assert.equal(contact.contact.y, 0.3, id);
  }
  const cue = replay("moonsault").cue;
  assert.ok(sdCombatFrame(cue, cue.camera.impacts[0] * 0.76).player.y >= 3.4);
  assert.equal(sdCombatFrame(cue, 1).player.y, 1.5);
});

test("fully guarded attacks brace and never lift or throw the defending wrestler", () => {
  for (const id of [
    "strike",
    "doubletap",
    "powerbomb",
    "suplex",
    "crossface",
  ]) {
    const cue = replay(id, true).cue;
    for (let step = 0; step <= 100; step++) {
      const frame = sdCombatFrame(cue, step / 100);
      assert.equal(frame.enemy.y, 1.5, id);
      assert.ok(Math.abs(frame.enemy.rz) < 0.1, id);
    }
    const contact = sdCombatFrame(cue, cue.camera.impacts[0]);
    assert.equal(contact.enemy.pose, "guard", id);
    assert.equal(contact.contact.family, "guard", id);
  }
});

test("submission remains grounded and sustained while preparation cards do not invent hits", () => {
  for (const id of ["kneebar", "figurefour", "bostoncrab", "crossface"]) {
    const cue = replay(id).cue;
    for (const p of [0.35, 0.55, 0.68]) {
      const frame = sdCombatFrame(cue, p);
      assert.equal(frame.player.pose, "submission", id);
      assert.ok(frame.player.y <= 1.5 && frame.enemy.y <= 1.5, id);
      assert.equal(frame.camera.shakeX, 0, id);
    }
  }
  for (const id of [
    "guard",
    "focus",
    "spotlight",
    "rally",
    "nightmare",
    "armbar",
    "headlock",
    "anklelock",
    "kimura",
  ]) {
    const cue = replay(id).cue;
    for (const p of [0.1, 0.55, 0.8])
      assert.equal(sdCombatFrame(cue, p).contact.visible, false, id);
  }
});

test("incoming impacts mirror attacker and defender and contact at .29", () => {
  const cue = {
    attacker: "enemy",
    target: "player",
    damage: 8,
    blocked: 2,
    effectFamily: "strike",
    duration: 880,
  };
  assert.equal(
    sdCombatFrame(cue, 0.289, { incoming: true }).contact.visible,
    false,
  );
  const frame = sdCombatFrame(cue, 0.29, { incoming: true });
  assert.equal(frame.contact.visible, true);
  assert.equal(frame.enemy.pose, "strike");
  assert.equal(frame.player.pose, "hurt");
  assert.ok(frame.contact.x < 0);
  assert.ok(frame.enemy.x < 1.55 && frame.player.x < 0);
  assert.deepEqual(
    sdCombatFrame(cue, 1, { incoming: true }),
    sdCombatFrame(null, 1),
  );
});

test("reduced motion never moves actors or camera and malformed progress stays finite", () => {
  for (const id of ["strike", "powerbomb", "suplex", "armbar", "focus"]) {
    const cue = replay(id).cue;
    const idle = sdCombatFrame(null, 0, { still: true });
    for (const p of [-3, 0, 0.2, 0.55, 0.8, 1, 4, NaN, Infinity]) {
      const frame = sdCombatFrame(cue, p, { still: true });
      valid(frame);
      assert.deepEqual(frame.player, idle.player, id);
      assert.deepEqual(frame.enemy, idle.enemy, id);
      assert.deepEqual(frame.camera, idle.camera, id);
    }
  }
});

test("arena item cues retain their explicit player attacker and utility items do not invent an opponent hit", () => {
  const itemAttack = {
    attacker: "player",
    target: "enemy",
    effectFamily: "strike",
    damage: 7,
    duration: 880,
  };
  const contact = sdCombatFrame(itemAttack, 0.29, { incoming: true });
  assert.equal(contact.player.pose, "strike");
  assert.equal(contact.enemy.pose, "hurt");
  assert.ok(contact.contact.x > 0);
  assert.equal(contact.contact.visible, true);
  assert.equal(
    sdCombatFrame(itemAttack, 0.289, { incoming: true }).contact.visible,
    false,
  );
  const supply = {
    attacker: "player",
    effectFamily: "tactics",
    damage: 0,
    blocked: 0,
    duration: 880,
  };
  const used = sdCombatFrame(supply, 0.29, { incoming: true });
  assert.equal(used.player.pose, "idle");
  assert.equal(used.enemy.pose, "idle");
  assert.equal(used.contact.visible, false);
});

test("whole-sprite dash, recoil and low holds remain distinct without any body-part transform contract", () => {
  const strike = replay("strike").cue;
  const at = strike.camera.impacts[0];
  const before = sdCombatFrame(strike, at - 0.15);
  const hit = sdCombatFrame(strike, at);
  const after = sdCombatFrame(
    strike,
    at + strike.camera.hitstop / strike.duration + 0.09,
  );
  assert.ok(
    hit.player.x > before.player.x + 0.5,
    "the full attacker illustration dashes into contact",
  );
  assert.ok(
    after.enemy.x > hit.enemy.x + 0.2,
    "the full defender illustration recoils after hitstop",
  );
  assert.equal(hit.player.pose, "strike");
  assert.equal(hit.enemy.pose, "hurt");
  const hold = replay("kneebar").cue;
  const held = sdCombatFrame(hold, hold.camera.impacts[0]);
  assert.equal(held.player.pose, "submission");
  assert.ok(
    held.player.y < 1.45 && held.enemy.y <= 1.01,
    "submission reads as a low, horizontal hold",
  );
  assert.notEqual(hit.enemy.rz, held.enemy.rz);
  for (const sprite of [hit.player, hit.enemy, held.player, held.enemy]) {
    assert.deepEqual(Object.keys(sprite).sort(), [
      "depth",
      "pose",
      "rz",
      "scale",
      "x",
      "y",
    ]);
  }
});

test("the two-strike combination keeps both whole images on continuous paths between contacts", () => {
  const cue = replay("doubletap").cue;
  let previous = sdCombatFrame(cue, 0);
  for (let step = 1; step <= 1000; step++) {
    const next = sdCombatFrame(cue, step / 1000);
    for (const side of ["player", "enemy"]) {
      assert.ok(Math.abs(next[side].x - previous[side].x) < 0.05, side);
      assert.ok(Math.abs(next[side].scale - previous[side].scale) < 0.03, side);
    }
    previous = next;
  }
});

test("all complete sprites stay above the mat for actual wide atlas ratios and mirrored attacks", () => {
  for (const bodyRatios of [
    [0.76, 0.85],
    [0.85, 0.76],
    [0.62, 0.95],
  ]) {
    for (const id of Object.keys(CARDS)) {
      const cue = replay(id).cue;
      for (const attacker of ["player", "enemy"]) {
        const action = { ...cue, attacker };
        for (let step = 0; step <= 100; step++) {
          const frame = sdCombatFrame(action, step / 100, { bodyRatios });
          for (const [index, side] of ["player", "enemy"].entries()) {
            const bounds = sdBodyBounds(frame[side], bodyRatios[index]);
            assert.ok(
              bounds.bottom >= -1e-9,
              `${id} ${attacker} ${side} at ${step}: ${bounds.bottom}`,
            );
          }
        }
      }
    }
  }
});

test("all 50 two-sprite actions fit cinematic and arena projections at phone and landscape sizes", () => {
  const bodyRatios = [0.76, 0.85];
  for (const id of Object.keys(CARDS)) {
    const cue = replay(id).cue;
    for (let step = 0; step <= 50; step++) {
      const frame = sdCombatFrame(cue, step / 50, { bodyRatios });
      for (const cinematic of [false, true]) {
        for (const [width, height] of [
          [320, 160],
          [390, 320],
          [844, 200],
        ]) {
          const projection = sdSceneProjection(
            width,
            height,
            frame,
            bodyRatios,
            cinematic,
          );
          for (const [index, side] of ["player", "enemy"].entries()) {
            const b = sdBodyBounds(frame[side], bodyRatios[index]);
            const topLeft = sdScreenPoint(b.left, b.top, projection);
            const bottomRight = sdScreenPoint(b.right, b.bottom, projection);
            assert.ok(
              topLeft.x >= -0.01 &&
                topLeft.y >= -0.01 &&
                bottomRight.x <= width + 0.01 &&
                bottomRight.y <= height + 0.01,
              `${id} ${side} at ${step / 50}, ${width}x${height}, cinematic=${cinematic}: ${JSON.stringify({ topLeft, bottomRight })}`,
            );
          }
        }
      }
    }
  }
});
