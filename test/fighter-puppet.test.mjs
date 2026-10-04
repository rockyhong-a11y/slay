import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  PUPPET_POSES,
  validatePuppet,
  springStep,
  blendPose,
  puppetFrame,
  actionPose,
  partMatrices,
  transformPoint,
  portraitDestination,
  createFighterController,
} from "../src/fighter-puppet.js";

const layer = (id, index, bounds, parent, z, pivot = [0.5, 0.1]) => ({
  id,
  source: [(index % 3) / 3, Math.floor(index / 3) / 2, 1 / 3, 1 / 2],
  bounds,
  parent,
  z,
  pivot,
});
const fixture = () => ({
  atlas: "fighters/raven-atlas.webp",
  base: "fighters/raven.webp",
  size: [1000, 1500],
  facing: 1,
  parts: [
    layer("body", 0, [0.2, 0.24, 0.6, 0.74], null, 10, [0.5, 1]),
    layer("head", 1, [0.32, 0.02, 0.36, 0.22], "body", 30, [0.5, 0.92]),
    layer("backHair", 2, [0.15, 0.01, 0.7, 0.58], "head", 0, [0.5, 0.12]),
    layer("frontHair", 3, [0.25, 0.005, 0.5, 0.2], "head", 40, [0.5, 0.3]),
    layer("leftArm", 4, [0.12, 0.25, 0.25, 0.35], "body", 20),
    layer("rightArm", 5, [0.63, 0.25, 0.25, 0.35], "body", 21),
  ],
  face: {
    eyes: [
      [0.43, 0.115, 0.027, 0.012],
      [0.57, 0.115, 0.027, 0.012],
    ],
    mouth: [0.5, 0.175, 0.055, 0.015],
    skin: "#f4c4ad",
  },
});

test("completed fighter manifests use six real atlas layers and measured expressive faces", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL(
        "../public/assets/fighters/puppet-manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const id of ["raven", "valkyrie", "nova", "viper", "ember"]) {
    const config = validatePuppet(manifest.fighters[id]);
    assert.ok(
      existsSync(new URL(`../public/assets/${config.atlas}`, import.meta.url)),
      `${id} actual atlas`,
    );
    assert.ok(
      existsSync(new URL(`../public/assets/${config.base}`, import.meta.url)),
      `${id} actual base`,
    );
    assert.equal(new Set(config.parts.map((part) => part.id)).size, 6);
  }
});

test("puppet contracts reject duplicate layers, invalid source clips and parent cycles", () => {
  assert.equal(validatePuppet(fixture()).parts.length, 6);
  const cyclic = fixture();
  cyclic.parts[0].parent = "head";
  assert.throws(() => validatePuppet(cyclic), /hierarchy/);
  const duplicate = fixture();
  duplicate.parts[5].id = "leftArm";
  assert.throws(() => validatePuppet(duplicate), /six distinct/);
  const clipped = fixture();
  clipped.parts[0].sourceClip = [
    [0, 0, 1, 0.98],
    [0.35, 0.98, 0.3, 0.02],
  ];
  assert.equal(validatePuppet(clipped).parts[0].sourceClip.length, 2);
  clipped.parts[0].sourceClip = [[0.5, 0, 0.7, 1]];
  assert.throws(() => validatePuppet(clipped), /source clips/);
});

test("hierarchical head and hair follow the torso while body pivot remains planted", () => {
  const config = fixture(),
    bones = {
      body: { angle: 0.1, sy: 0.95 },
      head: { angle: 0 },
      backHair: { angle: 0 },
    };
  const matrices = partMatrices(config.parts, bones, config.size);
  const point = [500, 170];
  assert.deepEqual(
    transformPoint(matrices.get("head"), point),
    transformPoint(matrices.get("body"), point),
  );
  assert.deepEqual(
    transformPoint(matrices.get("backHair"), point),
    transformPoint(matrices.get("head"), point),
  );
  const planted = transformPoint(matrices.get("body"), [500, 1470]);
  assert.ok(
    Math.abs(planted[0] - 500) < 1e-8 && Math.abs(planted[1] - 1470) < 1e-8,
  );
  const headTurn = partMatrices(
    config.parts,
    { ...bones, head: { angle: 0.2 } },
    config.size,
  );
  assert.notDeepEqual(
    transformPoint(headTurn.get("head"), point),
    transformPoint(matrices.get("head"), point),
  );
  assert.deepEqual(
    transformPoint(headTurn.get("backHair"), point),
    transformPoint(headTurn.get("head"), point),
  );
});

test("all six conditions alter independent bones and facial emotion without changing source", () => {
  const signatures = new Set();
  for (const profile of Object.values(PUPPET_POSES)) {
    const frame = puppetFrame(profile, 1.47, 0, [0, 0]);
    assert.ok(
      Object.values(frame.bones).every((bone) =>
        Object.values(bone).every(Number.isFinite),
      ),
    );
    assert.ok(
      Object.values(frame.face)
        .filter((value) => typeof value === "number")
        .every(Number.isFinite),
    );
    signatures.add(
      JSON.stringify([
        frame.bones.body,
        frame.bones.head,
        frame.bones.leftArm,
        frame.face.open,
        frame.face.smile,
        frame.face.brow,
      ]),
    );
  }
  assert.equal(signatures.size, 6);
  assert.ok(PUPPET_POSES.excited.smile > PUPPET_POSES.normal.smile);
  assert.ok(PUPPET_POSES.groggy.eyes < PUPPET_POSES.tired.eyes);
  const one = puppetFrame(PUPPET_POSES.normal, 2, 1, [0, 0], null, 0.1);
  const two = puppetFrame(PUPPET_POSES.normal, 2, 1, [0, 0], null, 0.8);
  assert.notEqual(
    one.bones.head.angle,
    two.bones.head.angle,
    "actors must not share idle phase",
  );
});

test("hair springs lag their target, settle continuously and remain bounded after resume", () => {
  let hair = { value: 0, velocity: 0 };
  hair = springStep(hair, 0.3, 1 / 60);
  assert.ok(
    hair.value > 0 && hair.value < 0.3,
    "hair follows with physical lag",
  );
  for (let frame = 0; frame < 300; frame++)
    hair = springStep(hair, 0.3, 1 / 60);
  assert.ok(Math.abs(hair.value - 0.3) < 0.001);
  const resumed = springStep(hair, -0.3, 30);
  assert.ok(Number.isFinite(resumed.value) && Math.abs(resumed.value) <= 0.48);
  const midway = blendPose(PUPPET_POSES.normal, PUPPET_POSES.groggy, 0.05);
  assert.ok(
    midway.head > PUPPET_POSES.normal.head &&
      midway.head < PUPPET_POSES.groggy.head,
  );
  assert.deepEqual(
    blendPose(PUPPET_POSES.normal, PUPPET_POSES.groggy, 0, true),
    PUPPET_POSES.groggy,
  );
});

test("attack, aerial, grappling and hit motions use distinct articulated reactions", () => {
  const poses = ["strike", "aerial", "grapple", "hit"].map((kind) =>
    actionPose({ kind, time: 0.5, duration: 1 }),
  );
  assert.equal(new Set(poses.map((pose) => JSON.stringify(pose))).size, 4);
  assert.ok(poses[0].rightArm < -0.7 && poses[0].reach > 0.07);
  assert.ok(poses[1].lift < 0);
  assert.ok(poses[2].leftArm < 0 && poses[2].rightArm > 0);
  assert.ok(poses[3].body < 0 && poses[3].head > 0);
  assert.equal(
    actionPose({ kind: "hit", time: 1, duration: 1 }).strength,
    Math.sin(Math.PI) ** 2,
  );
});

test("actual atlas glove centers reach toward the opponent during strikes and finishers", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL(
        "../public/assets/fighters/puppet-manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  // Measured glove centers in the actual 1536 × 1024 six-part source atlases.
  // Testing the hand endpoint catches reversed rotation even when reach is positive.
  const glovePixels = {
    raven: [1353, 949],
    valkyrie: [1410, 934],
    nova: [1235, 961],
    viper: [1340, 960],
    ember: [1392, 963],
  };
  for (const [id, pixel] of Object.entries(glovePixels)) {
    const config = validatePuppet(manifest.fighters[id]);
    assert.equal(config.facing, 1, `${id} native facing`);
    const arm = config.parts.find((part) => part.id === "rightArm");
    const local = [
      (pixel[0] / 1536 - arm.source[0]) / arm.source[2],
      (pixel[1] / 1024 - arm.source[1]) / arm.source[3],
    ];
    assert.ok(
      local.every((value) => value > 0 && value < 1),
      `${id} glove lies inside measured arm`,
    );
    const restPoint = [
      (arm.bounds[0] + arm.bounds[2] * local[0]) * config.size[0],
      (arm.bounds[1] + arm.bounds[3] * local[1]) * config.size[1],
    ];
    const hand = (action) =>
      transformPoint(
        partMatrices(
          config.parts,
          puppetFrame(PUPPET_POSES.normal, 0, 0, [0, 0], action).bones,
          config.size,
        ).get("rightArm"),
        restPoint,
      );
    const idle = hand(null);
    for (const finisher of [false, true]) {
      const attack = hand({ kind: "strike", time: 0.5, duration: 1, finisher });
      const playerReach = attack[0] - idle[0];
      const enemyReach =
        config.size[0] - attack[0] - (config.size[0] - idle[0]);
      assert.ok(
        playerReach > config.size[0] * 0.15,
        `${id} ${finisher ? "finisher" : "strike"} reaches screen-right opponent`,
      );
      assert.ok(
        enemyReach < -config.size[0] * 0.15,
        `${id} mirrored enemy reaches screen-left opponent`,
      );
      assert.ok(
        attack[1] < idle[1],
        `${id} attacking hand rises from its resting position`,
      );
    }
  }
});

test("portrait framing follows actual transformed heads in every condition and facing", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL(
        "../public/assets/fighters/puppet-manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const [id, config] of Object.entries(manifest.fighters)) {
    const head = config.parts.find((part) => part.id === "head").bounds;
    let zoom;
    for (const [condition, profile] of Object.entries(PUPPET_POSES)) {
      const matrices = partMatrices(
        config.parts,
        puppetFrame(profile, 3.2, 1, [0.7, -0.3]).bones,
        config.size,
      );
      const center = transformPoint(matrices.get("head"), [
        (head[0] + head[2] * 0.5) * config.size[0],
        (head[1] + head[3] * 0.5) * config.size[1],
      ]);
      for (const [width, height] of [
        [76, 96],
        [70, 84],
      ]) {
        for (const mirrored of [false, true]) {
          const destination = portraitDestination(
            head,
            matrices.get("head"),
            config.size,
            width,
            height,
            mirrored,
          );
          const x =
            destination.x +
            (destination.width *
              (mirrored ? config.size[0] - center[0] : center[0])) /
              config.size[0];
          const y =
            destination.y + (destination.height * center[1]) / config.size[1];
          assert.ok(
            Math.abs(x - width / 2) < 1e-8,
            `${id} ${condition} head centered horizontally`,
          );
          assert.ok(
            Math.abs(y - height / 2) < 1e-8,
            `${id} ${condition} head centered vertically`,
          );
          if (width === 76) {
            zoom ??= destination.width;
            assert.equal(
              destination.width,
              zoom,
              `${id} condition changes keep a constant zoom`,
            );
          }
        }
      }
    }
  }
});

function canvasFixture() {
  const calls = [];
  const context = new Proxy(
    {
      drawImage(...args) {
        calls.push(["image", ...args]);
      },
      rect(...args) {
        calls.push(["clip-rect", ...args]);
      },
      clearRect(...args) {
        calls.push(["clear", ...args]);
      },
    },
    { get: (object, key) => object[key] || (() => {}) },
  );
  return {
    canvas: { width: 0, height: 0, dataset: {}, getContext: () => context },
    calls,
  };
}

test("ready puppets draw only separate atlas parts, respect clips and retain motion clock", (t) => {
  const originalWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });
  const config = fixture();
  config.parts[0].sourceClip = [
    [0, 0, 1, 0.98],
    [0.35, 0.98, 0.3, 0.02],
  ];
  const asset = {
    ready: true,
    config,
    atlas: { width: 3000, height: 2000 },
    size: config.size,
  };
  const pending = { ready: false };
  const { canvas, calls } = canvasFixture();
  const options = {
    art: "fighters/raven.webp",
    condition: "normal",
    still: false,
    position: [0.5, 1],
    side: "player",
  };
  let ready = 0;
  const entry = {
    canvas,
    options: () => options,
    bounds: { left: 0, top: 0, width: 320, height: 480 },
    clock: 7,
    activity: 0,
    gaze: [0, 0],
    frames: 0,
    onReady: () => ready++,
  };
  const controller = createFighterController("/assets/", (id) =>
    id === "nova" ? pending : asset,
  );
  const draw = (overrides) =>
    controller.draw(entry, {
      delta: 0.05,
      now: 100,
      animate: true,
      reduced: false,
      pointer: [160, 240],
      wake() {},
      ...overrides,
    });
  draw();
  assert.equal(ready, 1);
  assert.equal(canvas.dataset.parts, "6");
  assert.equal(calls.filter((call) => call[0] === "image").length, 6);
  assert.ok(
    calls
      .filter((call) => call[0] === "image")
      .every((call) => call[1] === asset.atlas),
    "base cannot remain beneath the assembled parts",
  );
  assert.equal(calls.filter((call) => call[0] === "clip-rect").length, 2);
  const clock = entry.clock;
  options.condition = "fiery";
  draw();
  assert.ok(entry.clock > clock, "condition changes preserve a running clock");
  options.cast = { id: "attack-1", disciplineSlug: "strike", duration: 1000 };
  draw();
  assert.equal(canvas.dataset.action, "strike");
  options.hit = true;
  draw();
  assert.equal(canvas.dataset.action, "hit");
  options.art = "fighters/nova.webp";
  draw();
  assert.equal(entry.ready, false);
  assert.equal(canvas.dataset.liveState, "loading-atlas");
  pending.ready = true;
  Object.assign(pending, asset);
  draw();
  assert.equal(ready, 2);
  assert.equal(
    canvas.dataset.action,
    "idle",
    "actor replacement cannot retain another actor's hit",
  );
});

test("new still/reduced puppets render their current condition at rest without a looping RAF", (t) => {
  const originalWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });
  const config = fixture(),
    asset = {
      ready: true,
      config,
      atlas: { width: 3000, height: 2000 },
      size: config.size,
    };
  const { canvas } = canvasFixture(),
    options = { art: "fighters/raven.webp", condition: "groggy", still: true };
  const entry = {
    canvas,
    options: () => options,
    bounds: { left: 0, top: 0, width: 200, height: 300 },
    clock: 7,
    activity: 0,
    gaze: [0, 0],
    frames: 0,
    onReady() {},
  };
  const controller = createFighterController("/assets/", () => asset);
  const result = controller.draw(entry, {
    delta: 0.05,
    now: 100,
    animate: false,
    reduced: true,
    pointer: [100, 150],
    wake() {},
  });
  assert.equal(canvas.dataset.expression, "groggy");
  assert.equal(canvas.dataset.liveState, "still");
  assert.equal(entry.clock, 7);
  assert.equal(result.needsFrame, false);
});
