import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, resolve } from "node:path";

// Follow the app's actual local import graph; archived generation files are irrelevant.
function appSources(entrypoint = "../src/main.jsx") {
  const sources = new Map();
  const visit = (filename) => {
    if (sources.has(filename)) return;
    const code = readFileSync(filename, "utf8");
    sources.set(filename, code);
    for (const match of code.matchAll(
      /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](\.[^"']+)["']/g,
    )) {
      const imported = resolve(dirname(filename), match[1]);
      if ([".js", ".jsx"].includes(extname(imported))) visit(imported);
    }
    for (const match of code.matchAll(/\bimport\s*\(\s*["'](\.[^"']+)["']/g)) {
      const imported = resolve(dirname(filename), match[1]);
      if ([".js", ".jsx"].includes(extname(imported))) visit(imported);
    }
  };
  visit(fileURLToPath(new URL(entrypoint, import.meta.url)));
  return sources;
}

test("all shipped illustration paths remain free of canvas, Three.js and obsolete body-part rigs", () => {
  const sources = appSources();
  assert.ok(
    sources.size > 4,
    "the test must traverse the app rather than only its entrypoint",
  );
  const forbidden = [
    [/<canvas\b/, "canvas element"],
    [/createElement\s*\(\s*["']canvas["']/, "created canvas"],
    [/\bOffscreenCanvas\b/, "offscreen canvas"],
    [
      /getContext\s*\(\s*["'](?:2d|webgl2?)["']/,
      "illustration drawing context",
    ],
    [/(?:\bfrom\s*|\bimport\s*\()\s*["']three(?:\/|["'])/, "Three.js import"],
    [/\b(?:WebGLRenderer|GLTFLoader|AnimationMixer)\b/, "3D renderer"],
    [/\.(?:glb|gltf)["'`]/, "3D model asset"],
    [
      /\b(?:createFighterController|registerLiveArt|LIVE_ART_RIGS)\b/,
      "obsolete rig runtime",
    ],
  ];
  for (const [filename, code] of sources) {
    for (const [pattern, label] of forbidden) {
      assert.doesNotMatch(code, pattern, `${filename}: ${label}`);
    }
  }
  assert.ok([...sources.keys()].some((path) => path.endsWith("/Artwork.jsx")));
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(
    pkg.dependencies.three,
    undefined,
    "the withdrawn 3D engine must not ship",
  );
});

test("the original complete-image and wear graph has no app-owned animation frame loop", () => {
  const sources = appSources("../src/Artwork.jsx");
  assert.ok(
    [...sources.keys()].some((path) => path.endsWith("/FighterWear.jsx")),
  );
  for (const [filename, code] of sources) {
    assert.doesNotMatch(code, /\brequestAnimationFrame\s*\(/, filename);
  }
});

test("only finite whole-illustration combat stages own RAF, with pause, visibility and unmount cleanup", () => {
  const sources = appSources();
  const frameOwners = [...sources].filter(([, code]) =>
    /\brequestAnimationFrame\s*\(/.test(code),
  );
  assert.deepEqual(
    frameOwners.map(([filename]) => filename).sort(),
    ["SDCombatStage.jsx", "ClassicCombatStage.jsx"]
      .map((name) => fileURLToPath(new URL(`../src/${name}`, import.meta.url)))
      .sort(),
  );
  for (const [filename, stage] of frameOwners) {
    assert.match(
      stage,
      /playback\.cue\s*&&\s*progress\s*<\s*1\s*&&\s*!playback\.still/,
      "RAF must stop after the cue and remain idle under reduced motion",
    );
    assert.match(
      stage,
      /!alive\s*\|\|\s*!visible\s*\|\|\s*document\.hidden\s*\|\|\s*latest\.current\.paused/,
    );
    assert.match(stage, /cancelAnimationFrame\s*\(raf\)/);
    assert.match(
      stage,
      /return\s*\(\)\s*=>\s*\{\s*alive\s*=\s*false;\s*cancel\(\)/,
    );
    assert.match(stage, /removeEventListener\("visibilitychange",\s*refresh\)/);
    assert.match(stage, /resize\?\.disconnect\(\)/);
    assert.match(stage, /intersection\?\.disconnect\(\)/);
    assert.match(
      stage,
      filename.endsWith("/SDCombatStage.jsx") ? /<SDArtwork\b/ : /<Artwork\b/,
      "the stage must render whole illustrated poses",
    );
  }
});
