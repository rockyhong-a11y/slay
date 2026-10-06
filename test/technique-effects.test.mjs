import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CARDS, newRun, playCard } from "../src/game.js";
import { CARD_DETAILS } from "../src/card-library.js";
import {
  createCardCue,
  createArenaImpact,
  fighterImpactFrames,
  techniqueShot,
} from "../src/presentation.js";
import {
  CARD_EFFECT_PROFILES,
  techniqueEffectProfile,
  techniqueEffectLayers,
  artworkProjection,
  projectedArtworkPoint,
} from "../src/technique-effects.js";

function replay(id, block = 0) {
  const before = newRun("raven", 12345);
  before.activeGimmick = null;
  before.hand = [{ id, uid: "replay-technique", upgraded: false }];
  before.draw = [{ id: "guard", uid: "draw-a", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.discard = [];
  before.exhaust = [];
  before.energy = 10;
  before.player.hype = 9;
  before.player.stress = 15;
  before.enemy.hp = before.enemy.maxHp = 200;
  before.enemy.block = block;
  const instance = before.hand[0];
  const after = playCard(before, instance.uid);
  assert.notEqual(after, before, id);
  return {
    before,
    after,
    cue: createCardCue(before, after, instance),
    instance,
  };
}

const kinds = (cue) =>
  techniqueEffectLayers(cue.effect, cue.camera, cue).map((x) => x.kind);

test("all 50 cards have an explicit unique effect profile matching their physical discipline", () => {
  assert.equal(Object.keys(CARDS).length, 50);
  assert.deepEqual(
    Object.keys(CARD_EFFECT_PROFILES).sort(),
    Object.keys(CARDS).sort(),
  );
  const ids = new Set();
  const families = {
    strike: "strike",
    throw: "grapple",
    aerial: "grapple",
    submission: "submission",
    grapple: "grapple",
    defense: "defense",
    tactics: "tactics",
    nightmare: "nightmare",
  };
  for (const id of Object.keys(CARDS)) {
    const effect = techniqueEffectProfile(id, CARD_DETAILS[id].disciplineSlug);
    assert.equal(effect.family, families[CARD_DETAILS[id].disciplineSlug], id);
    assert.ok(effect.label.length > 2, id);
    assert.ok(
      effect.target.every((v) => v > 0 && v < 1),
      id,
    );
    ids.add(effect.id);
  }
  assert.equal(ids.size, 50);
});

test("every card produces finite serializable layers that fade out and preserve the resolved run", () => {
  for (const id of Object.keys(CARDS)) {
    const { before, after, cue } = replay(id);
    const originals = [structuredClone(before), structuredClone(after)];
    const layers = techniqueEffectLayers(cue.effect, cue.camera, cue);
    assert.ok(layers.length >= 1 && layers.length <= 16, id);
    for (const layer of layers) {
      assert.equal(layer.times[0], 0, id);
      assert.equal(layer.times.at(-1), 1, id);
      for (let i = 1; i < layer.times.length; i++)
        assert.ok(layer.times[i] > layer.times[i - 1], `${id} ${layer.kind}`);
      assert.equal(layer.opacity.at(-1), 0, id);
      assert.ok(
        layer.opacity.every((v) => v >= 0 && v <= 1),
        id,
      );
      for (const channel of [
        "opacity",
        "x",
        "y",
        "scale",
        "scaleX",
        "scaleY",
        "rotate",
        "pathLength",
      ]) {
        if (!layer[channel]) continue;
        assert.equal(
          layer[channel].length,
          layer.times.length,
          `${id} ${channel}`,
        );
        assert.ok(layer[channel].every(Number.isFinite), `${id} ${channel}`);
      }
    }
    assert.deepEqual(JSON.parse(JSON.stringify(layers)), layers, id);
    assert.deepEqual(before, originals[0], id);
    assert.deepEqual(after, originals[1], id);
    assert.equal(cue.damage, before.enemy.hp - after.enemy.hp, id);
  }
});

test("strikes use approach streaks and discrete contact bursts, while the one-two has two contacts", () => {
  for (const id of [
    "strike",
    "redline",
    "flashstep",
    "dropkick",
    "finisher",
    "shoulder",
  ]) {
    const cue = replay(id).cue;
    const shapeKinds = kinds(cue);
    assert.ok(
      shapeKinds.includes("streak") && shapeKinds.includes("burst"),
      id,
    );
    assert.ok(
      !shapeKinds.includes("pressure") && !shapeKinds.includes("mat"),
      id,
    );
    const layers = techniqueEffectLayers(cue.effect, cue.camera, cue);
    const streak = layers.find((l) => l.kind === "streak");
    const burst = layers.find((l) => l.kind === "burst");
    assert.ok(streak.times[1] < burst.times[2], id);
  }
  assert.equal(
    kinds(replay("doubletap").cue).filter((k) => k === "burst").length,
    2,
  );
  assert.equal(
    techniqueEffectProfile("flashstep").direction,
    techniqueEffectProfile("redline").direction,
    "both illustrations strike from the left toward the opponent on the right",
  );
});

test("throws show grip before lifting or arcing, then a mat wave instead of a strike burst", () => {
  for (const id of [
    "powerbomb",
    "sitoutpowerbomb",
    "jackknifepowerbomb",
    "popuppowerbomb",
    "gutwrenchpowerbomb",
    "foldingpowerbomb",
    "bodyslam",
    "powerslam",
    "sidewalkslam",
    "spinebuster",
    "bellysuplex",
    "snapsuplex",
    "samoandrop",
    "suplex",
    "armdrag",
    "championship",
    "moonsault",
  ]) {
    const cue = replay(id).cue;
    const layers = techniqueEffectLayers(cue.effect, cue.camera, cue);
    const shapeKinds = layers.map((l) => l.kind);
    assert.equal(shapeKinds.includes("grip"), id !== "moonsault", id);
    assert.ok(shapeKinds.includes("lift") || shapeKinds.includes("arc"), id);
    assert.ok(shapeKinds.includes("mat"), id);
    assert.ok(
      !shapeKinds.includes("burst") && !shapeKinds.includes("pressure"),
      id,
    );
    assert.ok(
      layers.find((l) => l.kind === (id === "moonsault" ? "arc" : "grip"))
        .times[2] < layers.find((l) => l.kind === "mat").times[2],
      id,
    );
  }
  assert.ok(kinds(replay("powerbomb").cue).includes("lift"));
  assert.ok(kinds(replay("suplex").cue).includes("arc"));
});

test("clinch setup cards retain grip and tension without a fall or a damage score", () => {
  for (const id of ["collartie", "waistlock"]) {
    const cue = replay(id).cue;
    assert.equal(cue.attacking, false, id);
    assert.equal(cue.damage, 0, id);
    assert.ok(
      kinds(cue).includes("grip") && kinds(cue).includes("tension"),
      id,
    );
    assert.ok(!kinds(cue).includes("mat") && !kinds(cue).includes("burst"), id);
    assert.ok(!cue.results.some((r) => r.kind === "damage"), id);
  }
});

test("all submission cards clamp a targeted joint with sustained pressure and no explosive burst", () => {
  for (const [id, detail] of Object.entries(CARD_DETAILS)) {
    if (detail.disciplineSlug !== "submission") continue;
    const cue = replay(id).cue;
    const shapeKinds = kinds(cue);
    assert.equal(cue.camera.pressure, true, id);
    assert.equal(cue.camera.hitstop, 0, id);
    assert.ok(
      shapeKinds.includes("clamp") &&
        shapeKinds.includes("target") &&
        shapeKinds.includes("pressure"),
      id,
    );
    assert.ok(
      !shapeKinds.includes("burst") &&
        !shapeKinds.includes("mat") &&
        !shapeKinds.includes("streak"),
      id,
    );
    const pressure = techniqueEffectLayers(cue.effect, cue.camera, cue).find(
      (l) => l.kind === "pressure",
    );
    assert.ok(pressure.times.at(-2) >= 0.9, id);
  }
  assert.ok(
    techniqueEffectProfile("headlock").target[1] <
      techniqueEffectProfile("anklelock").target[1],
  );
  assert.notEqual(
    techniqueEffectProfile("kimura").direction,
    techniqueEffectProfile("americana").direction,
  );
});

test("fully guarded attacks replace explosive damage accents with shields and retain actual zero damage", () => {
  for (const id of ["strike", "doubletap", "powerbomb", "headlock", "armbar"]) {
    const { before, after, cue } = replay(id, 100);
    assert.equal(cue.damage, 0, id);
    assert.equal(before.enemy.hp, after.enemy.hp, id);
    assert.ok(cue.absorbed > 0, id);
    assert.ok(kinds(cue).includes("shield"), id);
    assert.ok(!kinds(cue).includes("burst") && !kinds(cue).includes("mat"), id);
    assert.equal(
      cue.results.find((r) => r.kind === "damage").text,
      "공격 방어됨",
      id,
    );
  }
});

test("defense, tactics and nightmare effects communicate preparation or recovery without inventing hits", () => {
  for (const id of [
    "guard",
    "steelwill",
    "ringcraft",
    "comeback",
    "focus",
    "spotlight",
    "rally",
    "quickdraw",
    "encore",
    "nightmare",
  ]) {
    const cue = replay(id).cue;
    assert.equal(cue.attacking, false, id);
    assert.equal(cue.damage, 0, id);
    const shapeKinds = kinds(cue);
    assert.ok(
      !shapeKinds.includes("burst") &&
        !shapeKinds.includes("mat") &&
        !shapeKinds.includes("pressure"),
      id,
    );
    assert.ok(!cue.results.some((r) => r.kind === "damage"), id);
  }
  assert.ok(kinds(replay("guard").cue).includes("shield"));
  assert.ok(kinds(replay("focus").cue).includes("breath"));
  assert.ok(kinds(replay("quickdraw").cue).includes("card-echo"));
  assert.ok(kinds(replay("spotlight").cue).includes("spotlight"));
  assert.ok(kinds(replay("nightmare").cue).includes("veil"));
});

test("arena follow-through distinguishes clamp pressure from explosive recoil and returns both fighters to rest", () => {
  const strike = replay("strike");
  const lock = replay("armbar");
  const slam = replay("powerbomb");
  const impactFor = (r) =>
    createArenaImpact(r.before, r.after, { instance: r.instance });
  const impactStrike = impactFor(strike);
  const impactLock = impactFor(lock);
  const impactSlam = impactFor(slam);
  assert.equal(impactLock.label, "LOCKED IN");
  assert.equal(impactSlam.label, "MAT IMPACT");
  assert.equal(impactLock.pressure, true);
  assert.equal(impactSlam.throwing, true);
  const recoil = fighterImpactFrames(impactStrike, "enemy");
  const clamped = fighterImpactFrames(impactLock, "enemy");
  assert.ok(Math.max(...clamped.x) < Math.max(...recoil.x));
  for (const impact of [impactStrike, impactLock, impactSlam]) {
    for (const side of ["player", "enemy"]) {
      const frames = fighterImpactFrames(impact, side);
      for (const channel of ["x", "y", "rotate"])
        assert.equal(Math.abs(frames[channel].at(-1)), 0);
      assert.equal(fighterImpactFrames(impact, side, true), null);
    }
  }
});

test("effect profiles cannot leak consumer changes between replays and unknown cards have a safe fallback", () => {
  const effect = techniqueEffectProfile("armbar");
  effect.target[0] = 0;
  effect.family = "strike";
  assert.equal(techniqueEffectProfile("armbar").family, "submission");
  assert.ok(techniqueEffectProfile("armbar").target[0] > 0);
  const fallback = techniqueEffectProfile("future-technique", "throw");
  assert.equal(fallback.family, "grapple");
  assert.ok(
    techniqueEffectLayers(
      fallback,
      techniqueShot("future-technique", "throw"),
      { attacking: true, damage: 3 },
    ).length > 0,
  );
  assert.deepEqual(techniqueEffectLayers(null, null), []);
});

test("reviewed focal points follow the visible contact and joint instead of guessed body-height regions", () => {
  const strike = techniqueEffectProfile("strike");
  const armbar = techniqueEffectProfile("armbar");
  const ankle = techniqueEffectProfile("anklelock");
  const heel = techniqueEffectProfile("heelhook");
  assert.ok(
    strike.target[1] < 0.25,
    "the elbow contacts the opponent's upper shoulder, not the abdomen",
  );
  assert.ok(
    armbar.target[0] > 0.65 && armbar.target[1] > 0.65,
    "the exposed elbow is at the lower right of this complete illustration",
  );
  assert.ok(
    ankle.target[0] < 0.4 && ankle.target[1] < 0.45,
    "the standing holder raises the captured ankle into the upper left",
  );
  assert.ok(
    heel.target[0] > 0.6 && heel.target[1] < 0.45,
    "the captured heel is held near the seated attacker's chest",
  );
  for (const effect of Object.values(CARD_EFFECT_PROFILES)) {
    if (effect.family !== "grapple" || effect.grounded) continue;
    assert.ok(effect.target[1] > 0.8, effect.variant);
    assert.ok(effect.grip[1] < effect.target[1], effect.variant);
  }
  assert.equal(techniqueEffectProfile("armdrag").direction, -1);
  assert.equal(techniqueEffectProfile("flashstep").direction, 1);
  const thrown = techniqueEffectProfile("powerbomb");
  thrown.grip[0] = 0;
  assert.ok(techniqueEffectProfile("powerbomb").grip[0] > 0);
});

test("artwork projection keeps joint overlays aligned through letterboxing and capped portrait crops", () => {
  const desktop = artworkProjection(821, 547, "contain", [0.5, 0.5]);
  const joint = [0.68, 0.71];
  const desktopPoint = projectedArtworkPoint(joint, desktop);
  assert.ok(Math.abs(desktopPoint[0] - 0.68) < 0.001);
  assert.ok(Math.abs(desktopPoint[1] - 0.71) < 0.001);
  const portrait = artworkProjection(365, 300, "cover", [0.6, 0.62]);
  const portraitPoint = projectedArtworkPoint(joint, portrait);
  assert.ok(Math.abs(portraitPoint[0] - 0.6986) < 0.001);
  assert.equal(portraitPoint[1], 0.71);
  const letterboxed = artworkProjection(500, 500, "contain", [0.5, 0.5]);
  assert.ok(
    Math.abs(projectedArtworkPoint(joint, letterboxed)[1] - 0.6401) < 0.001,
    "vertical letterboxing is included rather than placing the effect at 71% of the empty frame",
  );
  assert.deepEqual(projectedArtworkPoint([0.5, 0.5], letterboxed), [0.5, 0.5]);
  assert.deepEqual(artworkProjection(0, 0), {
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  });
});

test("arcade hit accents track the resolved contact clock with at most two localized flashes", () => {
  for (const id of Object.keys(CARDS)) {
    const cue = replay(id).cue;
    const layers = techniqueEffectLayers(cue.effect, cue.camera, cue);
    const flashes = layers.filter((layer) => layer.flashing);
    assert.ok(flashes.length <= 2, id);
    for (const flash of flashes) {
      assert.ok(cue.camera.impacts.includes(flash.contact), id);
      assert.equal(flash.times[2], flash.contact, id);
      assert.ok(flash.width <= 38, `${id}: contact flare must stay local`);
    }
    for (const layer of layers.filter((layer) => layer.contact !== undefined)) {
      assert.ok(
        cue.camera.impacts.includes(layer.contact),
        `${id} ${layer.kind}`,
      );
      assert.equal(layer.times[2], layer.contact, `${id} ${layer.kind}`);
    }
  }
});

test("arcade families distinguish fire, mat debris, localized joint pressure sparks, shields and recovery particles", () => {
  assert.ok(kinds(replay("strike").cue).includes("embers"));
  for (const id of ["powerbomb", "suplex", "moonsault"]) {
    const effects = kinds(replay(id).cue);
    for (const kind of ["mat", "dust", "debris", "mat-crack"])
      assert.ok(effects.includes(kind), `${id} ${kind}`);
    assert.ok(!effects.includes("embers"), id);
  }
  for (const id of ["armbar", "headlock", "anklelock", "kimura", "heelhook"]) {
    const cue = replay(id).cue;
    const effects = techniqueEffectLayers(cue.effect, cue.camera, cue);
    const pressure = effects.filter(
      (layer) => layer.kind === "pressure-sparks",
    );
    assert.equal(pressure.length, 2, id);
    assert.ok(
      pressure.every((layer) => layer.times.at(-2) >= 0.9),
      id,
    );
    assert.ok(!effects.some((layer) => layer.flashing), id);
    assert.ok(
      pressure.every(
        (layer) =>
          layer.center[0] === cue.effect.target[0] &&
          layer.center[1] === cue.effect.target[1],
      ),
      id,
    );
  }
  assert.ok(kinds(replay("guard").cue).includes("brace-streaks"));
  assert.ok(kinds(replay("focus").cue).includes("rising-motes"));
  assert.ok(kinds(replay("nightmare").cue).includes("stress-slash"));
});

test("fully blocked attacks suppress embers, debris and mat cracks as well as damage bursts", () => {
  for (const id of ["strike", "doubletap", "powerbomb", "suplex"]) {
    const cue = replay(id, 100).cue;
    const effects = techniqueEffectLayers(cue.effect, cue.camera, cue);
    assert.ok(
      effects.some((layer) => layer.kind === "shield"),
      id,
    );
    assert.ok(
      !effects.some(
        (layer) =>
          layer.flashing ||
          ["embers", "debris", "mat-crack"].includes(layer.kind),
      ),
      id,
    );
  }
});

test("every card uses physical warm accents without electric arcs, magic rings or floor halos", () => {
  const forbidden = new Set([
    "electric-lock",
    "floor-aura",
    "shield-ripple",
    "fracture",
  ]);
  for (const id of Object.keys(CARDS)) {
    for (const block of [0, 100]) {
      const cue = replay(id, block).cue;
      const layers = techniqueEffectLayers(cue.effect, cue.camera, cue);
      assert.ok(
        !layers.some(
          (layer) =>
            forbidden.has(layer.kind) ||
            /electric|aura|ring|ripple/.test(layer.kind),
        ),
        `${id}: no magical primitives`,
      );
      for (const layer of layers.filter(
        (layer) => layer.kind === "pressure-sparks",
      )) {
        assert.ok(
          layer.width <= 23,
          `${id}: pressure stays localized to the joint`,
        );
      }
    }
  }
  // Both replay and arena overlays must share the requested warm palette.
  // Check actual rendered CSS colors so recoloring one renderer cannot leave
  // cyan/purple VFX behind in the other renderer.
  for (const path of [
    "../src/arcade-technique-fx.css",
    "../src/arcade-arena-impact.css",
  ]) {
    const css = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of css.matchAll(
      /#([a-f\d]{8}|[a-f\d]{6}|[a-f\d]{4}|[a-f\d]{3})\b/gi,
    )) {
      const rgb =
        match[1].length <= 4
          ? match[1]
              .slice(0, 3)
              .split("")
              .map((channel) => channel + channel)
              .join("")
          : match[1].slice(0, 6);
      const [red, green, blue] = rgb
        .match(/../g)
        .map((hex) => parseInt(hex, 16));
      assert.ok(red >= green && red >= blue, `${path}: cold color ${match[0]}`);
    }
  }
});
