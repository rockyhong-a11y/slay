import test from "node:test";
import assert from "node:assert/strict";
import {
  GEAR_WEAR_ACTORS,
  GEAR_WEAR_STATES,
  gearWearProfile,
  gearWearAnchors,
} from "../src/gear-wear.js";

const live = (hp, extra = {}) => ({
  hp,
  maxHp: 100,
  stress: 0,
  hype: 0,
  ...extra,
});

test("all six pose previews progress from intact gear through four wear levels", () => {
  assert.deepEqual(
    GEAR_WEAR_STATES.map((condition) => gearWearProfile(condition).level),
    [0, 0, 1, 2, 3, 4],
  );
  for (const condition of GEAR_WEAR_STATES) {
    const profile = gearWearProfile(condition);
    assert.equal(profile.visible, profile.level > 0);
    assert.ok(profile.split >= 0 && profile.split <= 3);
    assert.ok(profile.loosen >= 0 && profile.loosen <= 3);
  }
});

test("live damage, stress, and hype override healthy previews at exact thresholds", () => {
  assert.equal(gearWearProfile("normal", live(100)).level, 0);
  assert.equal(gearWearProfile("normal", live(50.01)).level, 0);
  assert.equal(gearWearProfile("normal", live(50)).level, 3);
  assert.equal(gearWearProfile("normal", live(25.01)).level, 3);
  assert.equal(gearWearProfile("normal", live(25)).level, 4);
  assert.equal(
    gearWearProfile("normal", live(100, { stress: 59.99 })).level,
    0,
  );
  assert.equal(gearWearProfile("normal", live(100, { stress: 60 })).level, 2);
  assert.equal(gearWearProfile("normal", live(100, { hype: 5.99 })).level, 0);
  assert.equal(gearWearProfile("normal", live(100, { hype: 6 })).level, 1);
  assert.equal(
    gearWearProfile("normal", live(25, { stress: 60, hype: 6 })).level,
    4,
  );
  assert.equal(gearWearProfile("groggy", live(100)).level, 4);
  assert.equal(gearWearProfile("fiery", live(100)).level, 1);
  assert.equal(gearWearProfile("frustrated", live(100)).level, 2);
});

test("a caller-owned peak retains prior wear and can be reset for a new battle", () => {
  assert.equal(
    gearWearProfile("normal", live(100, { gearWearLevel: 4 })).level,
    4,
  );
  assert.equal(
    gearWearProfile("normal", live(100, { gearWearLevel: 0 })).level,
    0,
  );
  assert.equal(
    gearWearProfile("normal", live(100, { gearWearLevel: 2.9 })).level,
    2,
  );
  assert.equal(
    gearWearProfile("normal", live(100, { gearWearLevel: 20 })).level,
    4,
  );
  for (const gearWearLevel of [NaN, Infinity, -5, "4"])
    assert.equal(
      gearWearProfile("normal", live(100, { gearWearLevel })).level,
      0,
    );
});

test("profile handles missing, invalid, and extreme vitals without mutation", () => {
  for (const vitals of [
    undefined,
    {},
    { hp: NaN, maxHp: 100 },
    { hp: 25, maxHp: 0 },
  ])
    assert.equal(gearWearProfile("tired", vitals).level, 3);
  assert.equal(gearWearProfile("invalid").level, 0);
  assert.equal(gearWearProfile("normal", live(-10)).level, 4);
  assert.equal(gearWearProfile("normal", live(500)).level, 0);
  const frozen = Object.freeze(live(40, { stress: 70 }));
  assert.equal(gearWearProfile("normal", frozen).level, 3);
  assert.deepEqual(frozen, live(40, { stress: 70 }));
});

test("damage and activated patch counts only increase across the four wear levels", () => {
  for (let hp = 100; hp > 0; hp--)
    assert.ok(
      gearWearProfile("normal", live(hp - 1)).level >=
        gearWearProfile("normal", live(hp)).level,
    );
  for (const actor of GEAR_WEAR_ACTORS) {
    for (const state of GEAR_WEAR_STATES) {
      const { zones } = gearWearAnchors(actor, state);
      assert.deepEqual(
        zones
          .filter((zone) => zone.kind !== "garment")
          .map((zone) => zone.minLevel),
        [1, 2, 3, 4],
      );
      for (let level = 0; level <= 4; level++)
        assert.equal(
          zones.filter((zone) => zone.minLevel <= level).length,
          [0, 3, 6, 7, 8][level],
        );
    }
  }
});

test("all 60 inspected poses have finite local patches inside the original canvas", () => {
  assert.equal(GEAR_WEAR_ACTORS.length, 10);
  assert.equal(GEAR_WEAR_STATES.length, 6);
  for (const actor of GEAR_WEAR_ACTORS) {
    const signatures = new Set();
    for (const state of GEAR_WEAR_STATES) {
      const anchors = gearWearAnchors(actor, state);
      const key = `${actor}-${state}`;
      assert.deepEqual(anchors.viewBox, [1000, 1500], key);
      assert.equal(anchors.actor, actor, key);
      assert.equal(anchors.condition, state, key);
      for (const color of Object.values(anchors.palette))
        assert.match(color, /^#[0-9a-f]{6}$/i, key);
      for (const zone of anchors.zones) {
        assert.ok(
          ["garment", "fabric", "strap", "pad", "boot"].includes(zone.kind),
          key,
        );
        for (const value of [
          zone.x,
          zone.y,
          zone.width,
          zone.height,
          zone.angle,
        ])
          assert.ok(Number.isFinite(value), key);
        assert.ok(zone.width > 0 && zone.height > 0, key);
        const radius = Math.hypot(zone.width, zone.height) / 2;
        assert.ok(zone.x - radius > 0 && zone.x + radius < 1000, key);
        assert.ok(zone.y - radius > 0 && zone.y + radius < 1500, key);
      }
      signatures.add(JSON.stringify(anchors.zones));
    }
    assert.equal(
      signatures.size,
      6,
      `${actor}: each pose needs its inspected anchors`,
    );
  }
});

test("skin windows remain only on knees and Raven's outer lower thigh", () => {
  for (const actor of GEAR_WEAR_ACTORS)
    for (const state of GEAR_WEAR_STATES)
      for (const zone of gearWearAnchors(actor, state).zones) {
        if (zone.kind === "garment") {
          assert.equal(zone.skin, false);
          assert.equal(zone.surface, "lining");
          continue;
        }
        assert.ok(zone.y - zone.height / 2 > 760, `${actor}-${state}`);
        if (zone.skin) {
          assert.ok(["knee", "outer-thigh"].includes(zone.area));
          assert.ok(["pad", "fabric"].includes(zone.kind));
          assert.ok(zone.minLevel >= 2);
          assert.ok(zone.width <= 90 && zone.height <= 52);
          assert.ok(zone.width >= 70 && zone.height >= 40);
          if (zone.area === "outer-thigh") assert.equal(actor, "raven");
        } else {
          assert.equal(zone.area, "shin");
        }
      }
});

test("unknown assets are rejected and callers cannot mutate the anchor source", () => {
  assert.equal(gearWearAnchors("unknown", "normal"), null);
  assert.equal(gearWearAnchors("raven", "unknown"), null);
  assert.equal(gearWearAnchors(null), null);
  const first = gearWearAnchors("raven", "groggy");
  const original = structuredClone(first);
  first.zones[0].x = -100;
  first.palette.fabric = "#ffffff";
  first.viewBox[0] = 200;
  assert.deepEqual(gearWearAnchors("raven", "groggy"), original);
});

test("enlarged tired and groggy patches clear the inspected resting hands", () => {
  const rotatedTop = (zone) => {
    const radians = (Math.abs(zone.angle) * Math.PI) / 180;
    return (
      zone.y -
      (zone.width * Math.sin(radians) + zone.height * Math.cos(radians)) / 2
    );
  };
  const viper = gearWearAnchors("viper", "groggy").zones.find(
    (zone) => zone.skin && zone.minLevel === 2,
  );
  const raven = gearWearAnchors("raven", "tired").zones.find(
    (zone) => zone.skin && zone.minLevel === 2,
  );
  assert.ok(
    rotatedTop(viper) > 878,
    "Viper's fingers end above the knee patch",
  );
  assert.ok(
    rotatedTop(raven) > 840,
    "Raven's fingers end above the thigh patch",
  );
});

test("every pose emphasizes both garments over secondary equipment damage", () => {
  for (const actor of GEAR_WEAR_ACTORS)
    for (const state of GEAR_WEAR_STATES) {
      const { zones } = gearWearAnchors(actor, state);
      const garments = zones.filter((zone) => zone.kind === "garment");
      assert.equal(garments.length, 4, `${actor}-${state}`);
      for (const area of ["upper", "lower"]) {
        const panels = garments.filter((zone) => zone.area === area);
        assert.equal(panels.length, 2);
        assert.deepEqual(
          panels.map((zone) => zone.minLevel),
          [1, 2],
        );
        assert.ok(
          panels.reduce((sum, zone) => sum + zone.width * zone.height, 0) >
            4000,
        );
        for (const panel of panels) {
          assert.equal(panel.skin, false);
          assert.equal(panel.surface, "lining");
          for (const color of [
            panel.fabric,
            panel.accent,
            panel.lining,
            panel.thread,
          ])
            assert.match(color, /^#[0-9a-f]{6}$/i);
        }
      }
      const garmentArea = garments.reduce(
        (sum, zone) => sum + zone.width * zone.height,
        0,
      );
      const equipmentArea = zones
        .filter((zone) => zone.kind !== "garment")
        .reduce((sum, zone) => sum + zone.width * zone.height, 0);
      assert.ok(
        garmentArea > equipmentArea * 1.8,
        `${actor}-${state}: garments dominate wear`,
      );
    }
});
