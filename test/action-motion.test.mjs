import test from "node:test";
import assert from "node:assert/strict";
import {
  CLASSIC_ACTION_ACTORS,
  CLASSIC_ACTION_POSES,
  hasClassicActionArt,
  classicActionGeometry,
  classicActionKind,
  classicActionPose,
  applyClassicActionFrame,
  classicActionGrip,
  classicActionJointPoint,
  classicSubmissionTarget,
} from "../src/action-motion.js";
import {
  classicCombatFrame,
  classicBodyBounds,
  classicBodyRatio,
  classicSceneProjection,
  classicScreenPoint,
} from "../src/classic-combat.js";

function atlas(id) {
  const dimensions = {
    kick: [450, 420],
    slam: [440, 235],
    suplex: [470, 245],
    armbar: [440, 220],
    leglock: [460, 225],
  };
  return {
    id,
    width: 1500,
    height: 2000,
    referenceHeight: 480,
    frames: Object.fromEntries(
      CLASSIC_ACTION_POSES.map((pose, index) => {
        const [width, height] = dimensions[pose] || [260, 480];
        return [
          pose,
          {
            x: (index % 3) * 500,
            y: Math.floor(index / 3) * 500,
            width,
            height,
          },
        ];
      }),
    ),
  };
}
function cue(cardId, family = "strike", extra = {}) {
  return {
    id: `test-${cardId}`,
    cardId,
    duration: 2400,
    damage: 12,
    attacking: true,
    effect: { family },
    camera: { impacts: [0.55], hitstop: 80 },
    ...extra,
  };
}
const options = {
  width: 374,
  height: 314,
  actors: ["viper", "nova"],
  bodyRatios: [classicBodyRatio("viper"), classicBodyRatio("nova")],
  metadata: [atlas("viper"), atlas("nova")],
};
const frameAt = (action, progress, overrides = {}) => {
  const settings = { ...options, ...overrides };
  return applyClassicActionFrame(
    classicCombatFrame(action, progress, settings),
    action,
    progress,
    settings,
  );
};

test("all ten actors opt into the action atlas and malformed crops never render", () => {
  assert.deepEqual(CLASSIC_ACTION_ACTORS, [
    "raven",
    "valkyrie",
    "nova",
    "viper",
    "ember",
    "atlas",
    "seraph",
    "lynx",
    "tempest",
    "onyx",
  ]);
  for (const actor of CLASSIC_ACTION_ACTORS)
    assert.equal(hasClassicActionArt(actor), true);
  for (const actor of ["unknown", null]) {
    assert.equal(hasClassicActionArt(actor), false);
    const base = classicCombatFrame(cue("powerbomb", "grapple"), 0.5, options);
    const applied = applyClassicActionFrame(
      base,
      cue("powerbomb", "grapple"),
      0.5,
      {
        ...options,
        actors: [actor, actor],
        metadata: [atlas(actor), atlas(actor)],
      },
    );
    assert.deepEqual(applied, base);
  }
  for (const change of [
    (entry) => {
      delete entry.frames.elbow;
    },
    (entry) => {
      entry.frames.kick.width = 9000;
    },
    (entry) => {
      entry.frames.guard.x = -1;
    },
    (entry) => {
      entry.frames.hurt.height = NaN;
    },
    (entry) => {
      entry.frames.ready.clip = [
        [0, 0],
        [101, 0],
        [50, 100],
      ];
    },
  ]) {
    const metadata = atlas("viper");
    change(metadata);
    assert.equal(classicActionGeometry(metadata, "ready"), null);
  }
});

test("a horizontal authored pose retains pixel scale and exact cell boundaries", () => {
  const metadata = atlas("viper");
  metadata.frames.ready.clip = [
    [0, 0],
    [100, 0],
    [95, 100],
    [3, 100],
  ];
  const ready = classicActionGeometry(metadata, "ready");
  assert.equal(ready.clipPath, "polygon(0% 0%, 100% 0%, 95% 100%, 3% 100%)");
  const stringMetadata = structuredClone(metadata);
  stringMetadata.frames.ready.clip = ready.clipPath;
  assert.equal(
    classicActionGeometry(stringMetadata, "ready").clipPath,
    ready.clipPath,
  );
  assert.equal(classicActionGeometry(metadata, "ready"), ready);
  const armbar = classicActionGeometry(metadata, "armbar");
  assert.equal(ready.worldHeight, 3);
  assert.equal(armbar.worldHeight, (3 * 220) / 480);
  assert.equal(armbar.worldWidth, (3 * 440) / 480);
  assert.equal(
    ready.worldHeight / ready.source.height,
    armbar.worldHeight / armbar.source.height,
  );
  for (const pose of CLASSIC_ACTION_POSES) {
    const geometry = classicActionGeometry(metadata, pose);
    const [sx, sy] = geometry.backgroundSize.split(" ").map(parseFloat);
    const [px, py] = geometry.backgroundPosition.split(" ").map(parseFloat);
    const drawnWidth = (geometry.source.width * sx) / 100;
    const drawnHeight = (geometry.source.height * sy) / 100;
    assert.ok(
      Math.abs(
        ((geometry.source.width - drawnWidth) * px) / 100 + geometry.source.x,
      ) < 1e-7,
    );
    assert.ok(
      Math.abs(
        ((geometry.source.height - drawnHeight) * py) / 100 + geometry.source.y,
      ) < 1e-7,
    );
  }
});

test("techniques select distinct whole-body drawings through preparation, contact and recovery", () => {
  const strike = cue("strike");
  assert.deepEqual(
    [0, 0.2, 0.55, 0.79, 1].map((p) => classicActionPose(strike, p)),
    ["ready", "windup", "elbow", "windup", "ready"],
  );
  assert.equal(classicActionPose(cue("dropkick"), 0.55), "kick");
  for (const id of [
    "powerbomb",
    "sitoutpowerbomb",
    "jackknifepowerbomb",
    "popuppowerbomb",
  ]) {
    const action = cue(id, "grapple");
    assert.equal(classicActionKind(action), "powerbomb");
    assert.deepEqual(
      [0.1, 0.3, 0.55].map((p) => classicActionPose(action, p)),
      ["clinch", "lift", "slam"],
    );
  }
  assert.equal(classicActionPose(cue("suplex", "grapple"), 0.3), "suplex");
  assert.equal(classicActionPose(cue("bodyslam", "grapple"), 0.3), "lift");
  assert.equal(
    classicActionPose(cue("figurefour", "submission"), 0.55),
    "leglock",
  );
  assert.equal(
    classicActionPose(cue("crossface", "submission"), 0.55),
    "armbar",
  );
  assert.equal(
    classicActionPose(
      cue("guard", "defense", { attacking: false, damage: 0 }),
      0.55,
    ),
    "guard",
  );
  for (const id of ["powerbomb", "suplex", "figurefour", "crossface"]) {
    const frame = frameAt(cue(id, "grapple"), 0.55);
    assert.equal(
      frame.player.rz,
      0,
      `${id}: authored bent pose must not rotate again`,
    );
  }
});

test("utility joint holds retain their actual technique with no fake damage reaction or contact", () => {
  for (const [id, kind] of [
    ["armbar", "armbar"],
    ["wristlock", "armbar"],
    ["hammerlock", "armbar"],
    ["omoplata", "armbar"],
    ["anklelock", "leglock"],
    ["heelhook", "leglock"],
    ["toehold", "leglock"],
    ["calfslicer", "leglock"],
    ["collartie", "clinch"],
    ["waistlock", "clinch"],
  ]) {
    const action = cue(id, "tactics", {
      attacking: false,
      damage: 0,
      camera: { impacts: [] },
    });
    const frame = frameAt(action, 0.55);
    assert.equal(classicActionKind(action), kind, id);
    assert.equal(frame.player.actionPose, kind, id);
    assert.equal(frame.enemy.actionPose, "guard", id);
    assert.equal(frame.enemy.pose, "guard", id);
    assert.equal(frame.contact.visible, false, id);
    assert.equal(frame.contact.strength, 0, id);
  }
});

test("utility arm and ankle holds lower a guarding partner into the authored grip and release smoothly", () => {
  for (const [id, kind] of [
    ["armbar", "armbar"],
    ["anklelock", "leglock"],
  ]) {
    const action = cue(id, "tactics", {
      attacking: false,
      damage: 0,
      camera: { impacts: [] },
    });
    const standing = frameAt(action, 0.12);
    const hold = frameAt(action, 0.55);
    const grip = classicActionJointPoint(
      hold.player,
      classicActionGrip("viper", kind),
    );
    const joint = classicActionJointPoint(
      hold.enemy,
      classicSubmissionTarget(kind, true),
      true,
    );
    assert.equal(hold.enemy.actionPose, "guard");
    assert.equal(hold.enemy.pose, "guard");
    assert.equal(hold.contact.visible, false);
    assert.ok(
      Math.abs(hold.enemy.rz) > 1.5,
      `${kind}: defender is lying across the mat`,
    );
    assert.ok(
      hold.enemy.y < standing.enemy.y - 0.25,
      `${kind}: defender lowers beside the seated attacker`,
    );
    assert.ok(
      Math.hypot(grip.x - joint.x, grip.y - joint.y) < 0.09,
      `${kind}: grip meets its actual joint target`,
    );
    assert.ok(
      classicBodyBounds(hold.enemy).bottom >= 0,
      `${kind}: body stays above mat`,
    );
    assert.equal(Math.sign(hold.enemy.rz), kind === "armbar" ? 1 : -1);
    let previous = frameAt(action, 0.2).enemy;
    for (let step = 201; step <= 900; step++) {
      const next = frameAt(action, step / 1000).enemy;
      assert.ok(
        Math.hypot(next.x - previous.x, next.y - previous.y) < 0.04,
        `${kind}: no jump at seated-pose switch`,
      );
      assert.ok(
        Math.abs(next.rz - previous.rz) < 0.04,
        `${kind}: continuous lowering angle`,
      );
      previous = next;
    }
    assert.ok(
      Math.abs(frameAt(action, 0.9).enemy.rz) < 0.05,
      `${kind}: returns upright`,
    );
  }
});

test("incoming items honor their attacking side and reduced or unavailable atlases keep the original illustration", () => {
  const action = cue("strike", "strike", { attacker: "player" });
  const frame = frameAt(action, 0.29, { incoming: true });
  assert.equal(frame.player.actionPose, "elbow");
  assert.equal(frame.enemy.actionPose, "hurt");
  for (const settings of [{ still: true }, { metadata: [null, null] }]) {
    const merged = { ...options, ...settings };
    const base = classicCombatFrame(action, 0.55, merged);
    assert.deepEqual(applyClassicActionFrame(base, action, 0.55, merged), base);
  }
  assert.equal(frameAt(action, 1).player.actionPose, undefined);
});

test("wide authored poses and airborne hurt drawings remain fully inside portrait and landscape projections", () => {
  for (const [width, height] of [
    [348, 125],
    [374, 314],
    [533, 232],
    [1266, 412],
  ]) {
    for (const id of [
      "strike",
      "dropkick",
      "powerbomb",
      "suplex",
      "bodyslam",
      "figurefour",
      "crossface",
    ]) {
      for (let step = 0; step <= 100; step++) {
        const frame = frameAt(cue(id, "grapple"), step / 100, {
          width,
          height,
        });
        const projection = classicSceneProjection(
          width,
          height,
          frame,
          options.bodyRatios,
        );
        for (const [index, side] of ["player", "enemy"].entries()) {
          const bounds = classicBodyBounds(
            frame[side],
            options.bodyRatios[index],
          );
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
              `${id} ${side} ${step} ${width}×${height}`,
            );
          }
        }
      }
    }
  }
});
