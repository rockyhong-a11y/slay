import test from "node:test";
import assert from "node:assert/strict";
import { newRun, playCard, endTurn } from "../src/game.js";
import {
  createArenaImpact,
  fighterImpactFrames,
  frameTechniqueCamera,
  techniqueShot,
} from "../src/presentation.js";
import {
  CARD_EFFECT_PROFILES,
  techniqueEffectProfile,
} from "../src/technique-effects.js";

function encounter(card = "strike") {
  const state = newRun("raven", 12345);
  state.phase = "combat";
  state.hand = [{ id: card, uid: "impact-card", upgraded: false }];
  state.deck = structuredClone(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.energy = 10;
  state.player.hype = 9;
  state.player.stress = 0;
  state.player.block = 0;
  state.activeGimmick = null;
  state.enemy.hp = state.enemy.maxHp = 100;
  state.enemy.block = 0;
  state.enemy.weak = 0;
  return state;
}

test("arena reactions use real guarded damage and preserve engine snapshots", () => {
  for (const block of [0, 5, 30]) {
    const before = encounter();
    before.enemy.block = block;
    const original = structuredClone(before);
    const after = playCard(before, before.hand[0].uid);
    const impact = createArenaImpact(before, after, {
      instance: before.hand[0],
    });
    assert.equal(impact.target, "enemy");
    assert.equal(impact.damage, before.enemy.hp - after.enemy.hp);
    assert.equal(impact.blocked, before.enemy.block - after.enemy.block);
    assert.equal(impact.label === "GUARD", impact.damage === 0);
    assert.ok(impact.duration > 650 && impact.duration < 1200);
    assert.deepEqual(before, original);
    assert.deepEqual(JSON.parse(JSON.stringify(impact)), impact);
  }
});

test("enemy guard reactions report absorbed hits even when the new turn resets guard", () => {
  for (const [block, weak, expected] of [
    [0, 0, 0],
    [3, 0, 3],
    [20, 0, 8],
    [20, 2, 6],
  ]) {
    const before = encounter();
    before.player.block = block;
    before.enemy.weak = weak;
    before.enemy.intent = { type: "attack", value: 8 };
    const after = endTurn(before);
    const impact = createArenaImpact(before, after, { attacker: "enemy" });
    assert.equal(impact.attacker, "enemy");
    assert.equal(impact.target, "player");
    assert.equal(impact.damage, before.player.hp - after.player.hp);
    assert.equal(impact.blocked, expected);
    assert.equal(impact.label === "GUARD", impact.damage === 0);
  }
});

test("healing, enemy guard and invalid actions do not invent a contact", () => {
  const before = encounter("focus");
  const after = playCard(before, before.hand[0].uid);
  assert.equal(
    createArenaImpact(before, after, { instance: before.hand[0] }),
    null,
  );
  before.enemy.intent = { type: "guard", value: 8 };
  assert.equal(
    createArenaImpact(before, endTurn(before), { attacker: "enemy" }),
    null,
  );
  assert.equal(createArenaImpact(before, before), null);
  assert.equal(createArenaImpact(null, after), null);
});

test("incoming hit score precedes turn healing, while pressure self damage cannot masquerade as a strike", () => {
  const recovering = encounter();
  recovering.player.hp -= 12;
  recovering.activeGimmick = { id: "icecorner", uid: "test-corner", floor: 1 };
  recovering.enemy.intent = { type: "attack", value: 8 };
  const recovered = endTurn(recovering);
  assert.equal(
    recovering.player.hp - recovered.player.hp,
    5,
    "recovery heals three after contact",
  );
  assert.equal(
    createArenaImpact(recovering, recovered, { attacker: "enemy" }).damage,
    8,
  );

  const guarded = encounter();
  guarded.player.block = 20;
  guarded.player.stress = 99;
  guarded.nextNightmareAt = 110;
  guarded.enemy.intent = { type: "attack", value: 8 };
  const broken = endTurn(guarded);
  assert.equal(guarded.player.hp - broken.player.hp, 8);
  const reaction = createArenaImpact(guarded, broken, { attacker: "enemy" });
  assert.equal(reaction.damage, 0);
  assert.equal(reaction.blocked, 8);
  assert.equal(reaction.label, "GUARD");

  const taunted = encounter();
  taunted.player.stress = 99;
  taunted.nextNightmareAt = 110;
  taunted.enemy.intent = { type: "taunt", value: 8 };
  const stressed = endTurn(taunted);
  assert.equal(taunted.player.hp - stressed.player.hp, 8);
  assert.equal(
    createArenaImpact(taunted, stressed, { attacker: "enemy" }),
    null,
  );
});

test("combo and knockout emphasis retain aggregate damage and cap overkill", () => {
  const double = encounter("doubletap");
  const doubleAfter = playCard(double, double.hand[0].uid);
  const combo = createArenaImpact(double, doubleAfter, {
    instance: double.hand[0],
  });
  assert.equal(combo.hits, 2);
  assert.equal(combo.combo, doubleAfter.combo);
  assert.equal(combo.damage, double.enemy.hp - doubleAfter.enemy.hp);
  const before = encounter("finisher");
  before.enemy.hp = 1;
  const after = playCard(before, before.hand[0].uid);
  const impact = createArenaImpact(before, after, { instance: before.hand[0] });
  assert.equal(impact.damage, 1);
  assert.equal(impact.knockout, true);
  assert.equal(impact.finisher, true);
  assert.equal(impact.heavy, true);
  assert.equal(impact.label, "K.O.");
});

test("complete-image hitstop freezes the contact channel then releases into recoil", () => {
  for (const id of ["strike", "doubletap", "powerbomb", "sidewalkslam"]) {
    const camera = techniqueShot(
      id,
      id.includes("slam") || id.includes("bomb") ? "throw" : "strike",
    );
    assert.ok(camera.hitstop >= 80 && camera.hitstop <= 100);
    for (const contact of camera.impacts) {
      const index = camera.times.indexOf(contact);
      assert.ok(index > 0);
      assert.ok(camera.times[index + 1] > contact);
      for (const channel of ["x", "y", "scale", "rotate"])
        assert.equal(camera[channel][index + 1], camera[channel][index]);
      assert.ok(camera.times[index + 2] > camera.times[index + 1]);
    }
  }
  assert.equal(techniqueShot("headlock", "submission").hitstop, 0);
  assert.deepEqual(techniqueShot("focus", "tactics").impacts, []);
});

test("reduced motion disables whole-image movement and flashing for either combatant", () => {
  for (const attacker of ["player", "enemy"]) {
    const impact = {
      attacker,
      target: attacker === "player" ? "enemy" : "player",
      damage: 18,
      heavy: true,
      duration: 1040,
    };
    for (const side of ["player", "enemy"])
      assert.equal(fighterImpactFrames(impact, side, true), null);
  }
  assert.equal(fighterImpactFrames(null, "player"), null);
});

test("arcade throws lift the defender before mat contact while locks stay planted and guards do not launch", () => {
  const impactFor = (id, block = 0) => {
    const before = encounter(id);
    before.enemy.block = block;
    return createArenaImpact(before, playCard(before, before.hand[0].uid), {
      instance: before.hand[0],
    });
  };
  const slam = fighterImpactFrames(impactFor("powerbomb"), "enemy");
  const locked = fighterImpactFrames(impactFor("armbar"), "enemy");
  const blocked = fighterImpactFrames(impactFor("powerbomb", 100), "enemy");
  assert.ok(slam.y[1] < -20 && slam.y[2] > 10, "lift precedes mat contact");
  assert.ok(
    Math.max(...locked.y.map(Math.abs)) <= 2,
    "joint locks remain grounded",
  );
  assert.ok(
    Math.max(...blocked.y.map(Math.abs)) <= 2,
    "fully guarded throws do not launch",
  );
  assert.ok(
    Math.max(...slam.rotate.map(Math.abs)) >
      Math.max(...locked.rotate.map(Math.abs)),
  );
});

test("guard braces gently while damage has heavier recoil, and every finite channel returns to rest", () => {
  const cue = {
    attacker: "player",
    target: "enemy",
    damage: 18,
    heavy: true,
    duration: 1040,
  };
  const hit = fighterImpactFrames(cue, "enemy");
  const guard = fighterImpactFrames({ ...cue, damage: 0 }, "enemy");
  assert.ok(Math.max(...guard.x) < Math.max(...hit.x) / 3);
  assert.ok(Math.max(...guard.rotate) < Math.max(...hit.rotate));
  for (const side of ["player", "enemy"]) {
    const frames = fighterImpactFrames(cue, side);
    for (const channel of ["x", "y", "rotate"]) {
      assert.ok(frames[channel].every(Number.isFinite));
      assert.equal(Math.abs(frames[channel][0]), 0);
      assert.equal(Math.abs(frames[channel].at(-1)), 0);
      assert.equal(frames[channel][2], frames[channel][3]);
    }
    assert.equal(frames.filter[0], "brightness(1)");
    assert.equal(frames.filter.at(-1), "brightness(1)");
    assert.equal(frames.transition.times[0], 0);
    assert.equal(frames.transition.times.at(-1), 1);
  }
});

// Project the card's actual 1024×683 mat point through object-fit, then through
// the rendered CSS transform. This tests visible landing geometry rather than
// merely repeating the camera's clamp implementation.
function matPointOnScreen(camera, effect, viewport, index) {
  const { width, height, fit = "contain", position = [0.5, 0.5] } = viewport;
  const imageScale = (fit === "cover" ? Math.max : Math.min)(
    width / 1024,
    height / 683,
  );
  const imageWidth = 1024 * imageScale;
  const imageHeight = 683 * imageScale;
  const x = effect.target[0] * imageWidth + (width - imageWidth) * position[0];
  const y =
    effect.target[1] * imageHeight + (height - imageHeight) * position[1];
  const origin = camera.origin
    .split(" ")
    .map((value) => parseFloat(value) / 100);
  const dx = x - origin[0] * width;
  const dy = y - origin[1] * height;
  const angle = (camera.rotate[index] * Math.PI) / 180;
  return {
    x:
      origin[0] * width +
      camera.scale[index] * (dx * Math.cos(angle) - dy * Math.sin(angle)) +
      camera.x[index],
    y:
      origin[1] * height +
      camera.scale[index] * (dx * Math.sin(angle) + dy * Math.cos(angle)) +
      camera.y[index],
  };
}

const landingCards = Object.keys(CARD_EFFECT_PROFILES).filter((id) => {
  const effect = techniqueEffectProfile(id);
  return effect.family === "grapple" && !effect.grounded;
});

function replayWindows(camera) {
  return [
    { name: "desktop", width: 720, height: 480, fit: "contain" },
    {
      name: "393px portrait",
      width: 365,
      height: Math.min(852 * 0.52, 365 / (1.5 * camera.portrait.field)),
      fit: "cover",
      position: camera.portrait.center,
    },
    {
      name: "320px portrait",
      width: 292,
      height: Math.min(568 * 0.52, 292 / (1.5 * camera.portrait.field)),
      fit: "cover",
      position: camera.portrait.center,
    },
    { name: "667px landscape", width: 360, height: 240, fit: "contain" },
    { name: "844px landscape", width: 427.5, height: 285, fit: "contain" },
  ];
}

test("responsive slam framing keeps actual mat contact visible on desktop and both phone orientations", () => {
  assert.ok(
    landingCards.length >= 15,
    "exercise every authored throw, slam and aerial landing",
  );
  let correctedLandings = 0;
  for (const id of landingCards) {
    const camera = techniqueShot(id, "throw");
    const effect = techniqueEffectProfile(id);
    for (const viewport of replayWindows(camera)) {
      const framed = frameTechniqueCamera(camera, effect, viewport);
      for (let index = 0; index < camera.times.length; index++) {
        if (camera.times[index] < camera.impacts[0]) continue;
        const point = matPointOnScreen(framed, effect, viewport, index);
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(
          point.y >= 0 && point.y <= viewport.height * 0.87 + 1e-8,
          `${id} in ${viewport.name} keeps the landing above the lower score margin at ${camera.times[index]}`,
        );
        assert.ok(
          point.x >= 0 && point.x <= viewport.width,
          `${id} in ${viewport.name} keeps the landing inside the horizontal crop`,
        );
        if (framed.y[index] < camera.y[index]) correctedLandings++;
        if (index + 1 < camera.times.length) {
          // Rotation and scale interpolate together, so extrema need not land
          // exactly on a keyframe. The small score margin absorbs that motion.
          for (let step = 1; step < 10; step++) {
            const fraction = step / 10;
            const interpolated = { ...framed };
            for (const channel of ["x", "y", "scale", "rotate"])
              interpolated[channel] = [
                framed[channel][index] * (1 - fraction) +
                  framed[channel][index + 1] * fraction,
              ];
            const between = matPointOnScreen(interpolated, effect, viewport, 0);
            assert.ok(
              between.x >= 0 &&
                between.x <= viewport.width &&
                between.y >= 0 &&
                between.y <= viewport.height,
              `${id} in ${viewport.name} remains visible between recoil frames`,
            );
          }
        }
      }
    }
  }
  assert.ok(
    correctedLandings > 0,
    "fixtures include contacts that would otherwise fall below the frame",
  );
});

test("responsive framing preserves lift anticipation, contact hold and the complete replay clock", () => {
  for (const id of landingCards) {
    const camera = techniqueShot(id, "throw");
    const effect = techniqueEffectProfile(id);
    for (const viewport of replayWindows(camera)) {
      const framed = frameTechniqueCamera(camera, effect, viewport);
      assert.deepEqual(framed.times, camera.times);
      assert.deepEqual(framed.impacts, camera.impacts);
      assert.equal(framed.duration, camera.duration);
      assert.equal(framed.hitstop, camera.hitstop);
      for (let index = 0; index < camera.times.length; index++)
        if (camera.times[index] < camera.impacts[0])
          assert.equal(
            framed.y[index],
            camera.y[index],
            `${id} retains its pre-contact lift`,
          );
      for (const contact of camera.impacts) {
        const index = framed.times.indexOf(contact);
        assert.ok(index >= 0 && framed.times[index + 1] > contact);
        for (const channel of ["x", "y", "scale", "rotate"])
          assert.equal(
            framed[channel][index],
            framed[channel][index + 1],
            `${id} holds ${channel} still at contact`,
          );
      }
    }
  }
});

test("responsive camera output is finite and serializable without mutating authored shots or inputs", () => {
  for (const id of landingCards) {
    const camera = techniqueShot(id, "throw");
    const effect = techniqueEffectProfile(id);
    const original = structuredClone({ camera, effect });
    for (const viewport of replayWindows(camera)) {
      const beforeViewport = structuredClone(viewport);
      const framed = frameTechniqueCamera(camera, effect, viewport);
      assert.deepEqual(JSON.parse(JSON.stringify(framed)), framed);
      for (const channel of ["x", "y", "scale", "rotate"])
        assert.ok(framed[channel].every(Number.isFinite), `${id} ${channel}`);
      assert.deepEqual(
        { camera, effect },
        original,
        `${id} leaves the source cue reusable`,
      );
      assert.deepEqual(viewport, beforeViewport);
    }
  }
});

test("submission and standing grips retain their authored camera; unmeasured views defer reframing", () => {
  for (const id of [
    "headlock",
    "armbar",
    "kimura",
    "anklelock",
    "grapple",
    "waistlock",
    "strike",
    "focus",
  ]) {
    const effect = techniqueEffectProfile(id);
    const camera = techniqueShot(
      id,
      effect.family === "submission" ? "submission" : "grapple",
    );
    for (const viewport of replayWindows(camera))
      assert.equal(frameTechniqueCamera(camera, effect, viewport), camera, id);
  }
  const camera = techniqueShot("powerbomb", "throw");
  const effect = techniqueEffectProfile("powerbomb");
  for (const viewport of [
    undefined,
    null,
    { width: 0, height: 240 },
    { width: 360, height: 0 },
  ])
    assert.equal(frameTechniqueCamera(camera, effect, viewport), camera);
});
