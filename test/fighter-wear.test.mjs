import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  WEAR_ACTORS,
  WEAR_STATES,
  parseFighterArt,
  fighterWearProfile,
  fighterWearAnchors,
  artworkImageRect,
  projectWearPoint,
  skinMoistureProfile,
  skinMoistureGeometry,
} from "../src/fighter-wear.js";

const portraits = JSON.parse(
  fs.readFileSync(
    new URL("../public/assets/fighters/states/portraits.json", import.meta.url),
    "utf8",
  ),
);
const artPath = (actor, state) => `fighters/states/${actor}-${state}.webp`;
const live = (hp, extra = {}) => ({
  hp,
  maxHp: 100,
  stress: 0,
  hype: 0,
  ...extra,
});

test("all 60 shipped fighter poses have art, face anchors, and supported wear", () => {
  assert.equal(WEAR_ACTORS.length * WEAR_STATES.length, 60);
  for (const actor of WEAR_ACTORS)
    for (const state of WEAR_STATES) {
      const art = artPath(actor, state);
      const key = `${actor}-${state}`;
      assert.ok(
        fs.existsSync(new URL(`../public/assets/${art}`, import.meta.url)),
        key,
      );
      assert.deepEqual(parseFighterArt(art), { actor, condition: state, key });
      const anchors = fighterWearAnchors(art, portraits[key]);
      assert.ok(anchors, key);
      assert.ok(anchors.face[0] > 250 && anchors.face[0] < 700, key);
      assert.ok(anchors.face[1] > 100 && anchors.face[1] < 300, key);
      for (const [x, y] of anchors.shoulders) {
        assert.ok(x > 200 && x < 750 && y > 200 && y < 450, key);
      }
      assert.equal(fighterWearProfile(state).visible, state !== "normal", key);
    }
});

test("healthy normal fighters are pristine; excitement and pressure add sweat without injuries", () => {
  assert.deepEqual(fighterWearProfile("normal", live(100)), {
    condition: "normal",
    ratio: 1,
    sweat: 0,
    abrasion: 0,
    bruise: 0,
    blood: 0,
    visible: false,
  });
  for (const state of ["excited", "fiery", "frustrated"]) {
    const wear = fighterWearProfile(state, live(100));
    assert.ok(wear.sweat > 0);
    assert.equal(wear.abrasion + wear.bruise + wear.blood, 0);
  }
  assert.equal(fighterWearProfile("normal", live(100, { hype: 6 })).sweat, 2);
  assert.equal(
    fighterWearProfile("normal", live(100, { stress: 60 })).sweat,
    2,
  );
});

test("damage tiers cross at 70%, 50%, 25% and 10% without premature blood", () => {
  const profile = (hp) => fighterWearProfile("normal", live(hp));
  assert.equal(profile(71).abrasion, 0);
  assert.equal(profile(70).abrasion, 1);
  assert.equal(profile(51).bruise, 0);
  assert.equal(profile(50).bruise, 1);
  assert.equal(profile(26).blood, 0);
  assert.equal(profile(25).blood, 1);
  assert.equal(profile(25).sweat, 3);
  assert.equal(profile(11).blood, 1);
  assert.equal(profile(10).blood, 2);
  const severity = (value) =>
    value.sweat + value.abrasion + value.bruise + value.blood;
  for (let hp = 100; hp > 0; hp--)
    assert.ok(severity(profile(hp - 1)) >= severity(profile(hp)));
});

test("live HP overrides preview injury defaults and healing removes stale traces", () => {
  assert.equal(fighterWearProfile("groggy").blood, 1);
  assert.equal(fighterWearProfile("tired").bruise, 1);
  assert.equal(fighterWearProfile("groggy", live(100)).blood, 0);
  assert.equal(fighterWearProfile("groggy", live(100)).bruise, 0);
  assert.equal(fighterWearProfile("normal", live(20)).blood, 1);
  assert.equal(fighterWearProfile("normal", live(100)).visible, false);
  assert.equal(fighterWearProfile("normal", live(-10)).ratio, 0);
  assert.equal(fighterWearProfile("normal", live(140)).ratio, 1);
  for (const invalid of [
    { hp: NaN, maxHp: 100 },
    { hp: 10, maxHp: 0 },
    { hp: 10 },
  ]) {
    assert.equal(fighterWearProfile("tired", invalid).ratio, 0.4);
  }
});

test("cards, equipment, unknown actors, and missing anchors never acquire fighter overlays", () => {
  for (const art of [
    "cards/strike.webp",
    "equipment/chair.svg",
    "fighters/nova.webp",
    "fighters/states/other-tired.webp",
    "fighters/states/nova-other.webp",
    null,
  ]) {
    assert.equal(parseFighterArt(art), null);
    assert.equal(fighterWearAnchors(art, portraits["nova-tired"]), null);
  }
  assert.equal(fighterWearAnchors(artPath("nova", "tired"), null), null);
  assert.equal(
    fighterWearAnchors(artPath("nova", "tired"), { center: [NaN, 0.1] }),
    null,
  );
});

test("full-body wear follows contain and cover offsets without stretching or double mirroring", () => {
  const contain = artworkImageRect({ width: 300, height: 300 });
  assert.deepEqual(contain, { left: 50, top: 0, width: 200, height: 300 });
  assert.deepEqual(projectWearPoint([500, 750], contain), [150, 150]);
  const point = [650, 300];
  const forward = projectWearPoint(point, contain);
  const mirrored = projectWearPoint(point, contain, {
    mirrored: true,
    containerWidth: 300,
  });
  assert.equal(forward[0] + mirrored[0], 300);
  assert.equal(forward[1], mirrored[1]);
  const cover = artworkImageRect({
    width: 300,
    height: 300,
    fit: "cover",
    position: [0.5, 0.25],
  });
  assert.deepEqual(cover, { left: 0, top: -37.5, width: 300, height: 450 });
  assert.equal(artworkImageRect({ width: 0, height: 300 }), null);
});

test("every portrait crops wear and image with the same projection, including enemy flips", () => {
  for (const crop of Object.values(portraits)) {
    const rect = artworkImageRect({
      width: 76,
      height: 96,
      portrait: true,
      crop,
    });
    const projected = projectWearPoint(
      [crop.center[0] * 1000, crop.center[1] * 1500],
      rect,
    );
    assert.ok(Math.abs(projected[0] - 38) < 1e-10);
    assert.ok(Math.abs(projected[1] - 48) < 1e-10);
    const mirrored = projectWearPoint(
      [crop.center[0] * 1000, crop.center[1] * 1500],
      rect,
      { mirrored: true, containerWidth: 76 },
    );
    assert.ok(Math.abs(mirrored[0] - 38) < 1e-10);
  }
});

test("leaning Atlas and Lynx portraits centre the inspected face without shifting wear", () => {
  const atlas = fighterWearAnchors(
    artPath("atlas", "tired"),
    portraits["atlas-tired"],
  );
  const lynx = fighterWearAnchors(
    artPath("lynx", "groggy"),
    portraits["lynx-groggy"],
  );
  assert.deepEqual(atlas.face, [435, 197.5]);
  assert.deepEqual(lynx.face, [541, 192]);
  assert.notDeepEqual(
    atlas.shoulders,
    fighterWearAnchors(artPath("atlas", "groggy"), portraits["atlas-groggy"])
      .shoulders,
  );
});

test("healthy skin retains restrained sheen without sweat, then exertion increases wetness", () => {
  const dry = skinMoistureProfile(
    fighterWearProfile("normal", live(100)).sweat,
  );
  assert.ok(dry.filmOpacity > 0 && dry.filmOpacity < 0.2);
  assert.equal(dry.beadCount, 0);
  assert.equal(dry.streakCount, 0);
  const levels = [100, 85, 50, 25].map((hp) =>
    skinMoistureProfile(fighterWearProfile("normal", live(hp)).sweat),
  );
  for (let index = 1; index < levels.length; index++) {
    assert.ok(levels[index].filmOpacity > levels[index - 1].filmOpacity);
    assert.ok(
      levels[index].specularOpacity > levels[index - 1].specularOpacity,
    );
    assert.ok(levels[index].beadCount > levels[index - 1].beadCount);
    assert.ok(levels[index].streakCount >= levels[index - 1].streakCount);
  }
  assert.equal(
    levels[1].streakCount,
    0,
    "light exertion only beads; no painted streams",
  );
  assert.equal(levels[3].streakCount, 2);
  assert.ok(
    levels[3].filmOpacity < 0.5,
    "wetness preserves the underlying skin color",
  );
  for (const extra of [{ hype: 6 }, { stress: 60 }]) {
    const fighter = fighterWearProfile("normal", live(100, extra));
    assert.equal(skinMoistureProfile(fighter.sweat).level, 2);
    assert.equal(fighter.blood + fighter.bruise + fighter.abrasion, 0);
  }
});

test("sweat optical inputs are bounded and invalid surfaces produce no geometry", () => {
  const baseline = skinMoistureProfile(0);
  for (const invalid of [undefined, NaN, Infinity, -8])
    assert.deepEqual(skinMoistureProfile(invalid), baseline);
  assert.deepEqual(skinMoistureProfile(40), skinMoistureProfile(3));
  assert.equal(skinMoistureProfile(2.8).level, 2);
  assert.equal(skinMoistureGeometry("outfit", 3), null);
});

test("microbeads and short wet streaks stay within calibrated face and shoulder patches", () => {
  const bounds = { face: [-52, 52, -66, 38], shoulder: [-34, 34, -32, 92] };
  for (const [surface, [minX, maxX, minY, maxY]] of Object.entries(bounds)) {
    for (let level = 0; level <= 3; level++) {
      const geometry = skinMoistureGeometry(surface, level);
      assert.equal(geometry.beads.length, geometry.beadCount);
      assert.equal(geometry.streaks.length, geometry.streakCount);
      for (const bead of geometry.beads) {
        assert.ok(
          bead.x - 3.3 * bead.size >= minX && bead.x + 3.3 * bead.size <= maxX,
        );
        assert.ok(
          bead.y - 4.4 * bead.size >= minY && bead.y + 4.4 * bead.size <= maxY,
        );
        assert.ok(
          bead.size <= 1,
          "beads remain small rather than cartoon teardrops",
        );
      }
      for (const streak of geometry.streaks) {
        assert.ok(streak.x >= minX && streak.x <= maxX);
        assert.ok(
          streak.x + streak.bend >= minX && streak.x + streak.bend <= maxX,
        );
        assert.ok(streak.y >= minY && streak.y + streak.length + 4 <= maxY);
        assert.ok(streak.width <= 2.3 && streak.length <= 41);
      }
    }
  }
});

test("all 60 pose anchors carry the same local sheen through body and portrait projections", () => {
  for (const actor of WEAR_ACTORS)
    for (const state of WEAR_STATES) {
      const crop = portraits[`${actor}-${state}`];
      const anchors = fighterWearAnchors(artPath(actor, state), crop);
      const geometry = skinMoistureGeometry(
        "shoulder",
        fighterWearProfile(state).sweat,
      );
      const bodyRect = artworkImageRect({ width: 180, height: 240 });
      const portraitRect = artworkImageRect({
        width: 76,
        height: 96,
        portrait: true,
        crop,
      });
      for (const shoulder of anchors.shoulders)
        for (const patch of geometry.sheen) {
          const point = [shoulder[0] + patch.x, shoulder[1] + patch.y];
          assert.ok(
            point[0] > 0 && point[0] < 1000 && point[1] > 0 && point[1] < 1500,
          );
          for (const [rect, width] of [
            [bodyRect, 180],
            [portraitRect, 76],
          ]) {
            const normal = projectWearPoint(point, rect);
            const mirrored = projectWearPoint(point, rect, {
              mirrored: true,
              containerWidth: width,
            });
            assert.ok(Math.abs(normal[0] + mirrored[0] - width) < 1e-9);
            assert.equal(normal[1], mirrored[1]);
          }
        }
    }
});
