import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sdGearWearAnchors } from "../src/sd-gear-anchors.js";
import { sdArtworkRect, sdSpriteGeometry } from "../src/sd-artwork.js";

const manifest = JSON.parse(
  readFileSync(
    new URL("../public/assets/sd2d/manifest.json", import.meta.url),
    "utf8",
  ),
);
const kinds = new Set(["fabric", "strap", "pad", "boot", "garment"]);
const close = (a, b, name) => assert.ok(Math.abs(a - b) < 1e-7, name);

test("all thirty SD wear sets use the exact current sprite crop and keep rotated wear inside it", () => {
  assert.equal(Object.keys(manifest).length, 10);
  for (const [actor, entry] of Object.entries(manifest)) {
    entry.frames.forEach((source, frame) => {
      const anchors = sdGearWearAnchors(actor, frame);
      const context = `${actor} frame ${frame}`;
      assert.deepEqual(anchors.source, source, `${context}: stale source crop`);
      assert.deepEqual(anchors.viewBox, [source.width, source.height], context);
      assert.ok(anchors.zones.length >= 6, context);
      for (const key of ["fabric", "accent", "skin", "shadow"])
        assert.match(anchors.palette[key], /^#[\da-f]{6}$/i, context);
      for (const zone of anchors.zones) {
        assert.ok(kinds.has(zone.kind), context);
        for (const key of ["x", "y", "width", "height", "angle", "minLevel"])
          assert.ok(Number.isFinite(zone[key]), `${context}: ${key}`);
        assert.ok(zone.width > 0 && zone.height > 0, context);
        assert.ok(
          Number.isInteger(zone.minLevel) &&
            zone.minLevel >= 1 &&
            zone.minLevel <= 4,
          context,
        );
        const angle = (zone.angle * Math.PI) / 180;
        const dx =
          (Math.abs(Math.cos(angle)) * zone.width +
            Math.abs(Math.sin(angle)) * zone.height) /
          2;
        const dy =
          (Math.abs(Math.sin(angle)) * zone.width +
            Math.abs(Math.cos(angle)) * zone.height) /
          2;
        assert.ok(
          zone.x - dx >= 0 && zone.x + dx <= source.width,
          `${context}: horizontal extent`,
        );
        assert.ok(
          zone.y - dy >= 0 && zone.y + dy <= source.height,
          `${context}: vertical extent`,
        );
      }
    });
  }
});

test("all thirty poses emphasize both upper and lower garments with intact opaque sports lining", () => {
  for (const actor of Object.keys(manifest)) {
    for (let frame = 0; frame < 3; frame++) {
      const anchors = sdGearWearAnchors(actor, frame);
      const context = `${actor} frame ${frame}`;
      const garments = anchors.zones.filter((zone) => zone.kind === "garment");
      assert.equal(
        garments.length,
        4,
        `${context}: four distributed cloth tears`,
      );
      for (const area of ["upper", "lower"]) {
        const patches = garments.filter((zone) => zone.area === area);
        assert.equal(
          patches.length,
          2,
          `${context}: both ${area} cloth panels`,
        );
        assert.deepEqual(
          patches.map((zone) => zone.minLevel).sort(),
          [1, 2],
          `${context}: ${area} starts at fiery and spreads at frustrated`,
        );
      }
      for (const zone of garments) {
        assert.equal(
          zone.skin,
          false,
          `${context}: chest/trunks retain opaque coverage`,
        );
        for (const key of ["fabric", "accent", "lining", "thread"])
          assert.match(
            zone[key],
            /^#[\da-f]{6}$/i,
            `${context}: explicit ${key} material`,
          );
        assert.notEqual(
          zone.lining,
          anchors.palette.skin,
          `${context}: lining is never skin-coloured`,
        );
        assert.notEqual(
          zone.lining,
          zone.fabric,
          `${context}: torn layers are visually distinct`,
        );
        const atlasY = zone.y + anchors.source.y;
        assert.ok(
          atlasY >= 400 && atlasY <= 660,
          `${context}: actual shirt/trunks height`,
        );
      }
      const area = (zones) =>
        zones.reduce((sum, zone) => sum + zone.width * zone.height, 0);
      assert.ok(
        area(garments) >
          area(anchors.zones.filter((zone) => zone.kind === "pad")) * 1.15,
        `${context}: clothing damage dominates pad area`,
      );
    }
  }
});

test("every pose keeps the first pad scuff and introduces a knee tear at frustrated stage", () => {
  for (const actor of Object.keys(manifest)) {
    for (let frame = 0; frame < 3; frame++) {
      const { zones } = sdGearWearAnchors(actor, frame);
      const context = `${actor} frame ${frame}`;
      let previous = 0;
      for (let level = 1; level <= 4; level++) {
        const count = zones.filter((zone) => zone.minLevel <= level).length;
        assert.ok(
          count > previous,
          `${context}: stage ${level} adds gear wear`,
        );
        previous = count;
      }
      assert.equal(
        zones.filter((zone) => zone.kind === "pad").length,
        2,
        context,
      );
      assert.ok(
        zones.some((zone) => zone.kind === "boot"),
        context,
      );
      const openings = zones.filter((zone) => zone.skin);
      assert.ok(openings.length >= 2 && openings.length <= 3, context);
      assert.ok(
        zones.some(
          (zone) => zone.kind === "pad" && zone.minLevel === 1 && !zone.skin,
        ),
        `${context}: fiery knee scuff remains intact`,
      );
      const earlyOpenings = openings.filter((zone) => zone.minLevel === 2);
      assert.equal(
        earlyOpenings.length,
        1,
        `${context}: one persistent knee tear begins at frustrated`,
      );
      assert.equal(earlyOpenings[0].kind, "pad", context);
      for (const zone of openings) {
        assert.ok(zone.minLevel >= 2, context);
        if (zone.kind === "pad") {
          assert.equal(zone.minLevel, 2, context);
          assert.ok(
            zone.width >= 48 &&
              zone.width <= 70 &&
              zone.height >= 38 &&
              zone.height <= 48,
            `${context}: tear fits inspected knee guard`,
          );
          const atlasY = zone.y + manifest[actor].frames[frame].y;
          assert.ok(atlasY >= 630 && atlasY <= 730, `${context}: knee height`);
        } else {
          assert.ok(
            zone.minLevel >= 3,
            `${context}: other small openings appear later`,
          );
          assert.ok(zone.width <= 47 && zone.height <= 34, context);
        }
        if (zone.kind === "fabric") {
          assert.equal(
            actor,
            "raven",
            "only outer leggings have a fabric skin opening",
          );
          const atlasY = zone.y + manifest[actor].frames[frame].y;
          assert.ok(atlasY >= 590 && atlasY <= 640, `${context}: outer thigh`);
        }
      }
    }
  }
});

test("black Viper pads and white Valkyrie wrist wraps keep their own material colours", () => {
  for (let frame = 0; frame < 3; frame++) {
    const viper = sdGearWearAnchors("viper", frame);
    for (const zone of viper.zones.filter((zone) => zone.kind === "pad")) {
      assert.equal(zone.fabric, "#2d2931");
      assert.equal(zone.accent, "#77717f");
      assert.notEqual(zone.fabric, viper.palette.fabric);
    }
    for (const zone of viper.zones.filter((zone) => zone.kind === "boot"))
      assert.equal(
        zone.fabric,
        undefined,
        "red Viper boots use the actor palette",
      );
    const valkyrie = sdGearWearAnchors("valkyrie", frame);
    for (const zone of valkyrie.zones.filter((zone) =>
      ["fabric", "strap"].includes(zone.kind),
    )) {
      assert.equal(zone.fabric, "#ede9e9");
      assert.equal(zone.accent, "#ffffff");
    }
    for (const zone of valkyrie.zones.filter((zone) => zone.kind === "pad"))
      assert.equal(
        zone.fabric,
        undefined,
        "navy Valkyrie pads use the actor palette",
      );
  }
});

test("SD wear source points follow the same fit, portrait and mirror projection as every pose", () => {
  for (const [actor, entry] of Object.entries(manifest)) {
    for (const [frame, pose] of ["idle", "strike", "hurt"].entries()) {
      const anchors = sdGearWearAnchors(actor, frame);
      const geometry = sdSpriteGeometry(
        entry.width,
        entry.height,
        pose,
        entry.frames,
      );
      for (const portrait of [false, true]) {
        for (const [width, height] of [
          [90, 180],
          [300, 130],
          [190, 270],
        ]) {
          const rect = sdArtworkRect(width, height, geometry.cellRatio, {
            ...geometry,
            portrait,
          });
          for (const zone of anchors.zones) {
            const overlayX =
              rect.left + (zone.x * rect.width) / anchors.viewBox[0];
            const overlayY =
              rect.top + (zone.y * rect.height) / anchors.viewBox[1];
            // The mask/background translate the whole atlas by -source.x/y.
            const atlasX = zone.x + anchors.source.x;
            const atlasY = zone.y + anchors.source.y;
            const sourceX =
              rect.left +
              ((atlasX - geometry.source.x) * rect.width) /
                geometry.source.width;
            const sourceY =
              rect.top +
              ((atlasY - geometry.source.y) * rect.height) /
                geometry.source.height;
            close(overlayX, sourceX, `${actor}: horizontal registration`);
            close(overlayY, sourceY, `${actor}: vertical registration`);
            close(
              width - overlayX,
              width - sourceX,
              `${actor}: shared mirroring`,
            );
          }
        }
      }
    }
  }
});

test("pose aliases select existing intact frame anchors and callers cannot mutate the authored data", () => {
  for (const actor of Object.keys(manifest)) {
    for (const pose of ["strike", "slam", "grapple", "submission"])
      assert.deepEqual(
        sdGearWearAnchors(actor, pose),
        sdGearWearAnchors(actor, 1),
      );
    for (const pose of ["hurt", "groggy"])
      assert.deepEqual(
        sdGearWearAnchors(actor, pose),
        sdGearWearAnchors(actor, 2),
      );
    const original = sdGearWearAnchors(actor, 0);
    const changed = sdGearWearAnchors(actor, 0);
    changed.zones[0].x = -1000;
    changed.palette.skin = "#000000";
    assert.deepEqual(sdGearWearAnchors(actor, 0), original);
  }
  assert.equal(sdGearWearAnchors("unknown", 0), null);
  assert.equal(sdGearWearAnchors("nova", -1), null);
  assert.equal(sdGearWearAnchors("nova", 3), null);
});
