import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, resolve } from "node:path";

// Follow the app's actual local import graph; archived generation files are irrelevant.
function appSources() {
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
  };
  visit(fileURLToPath(new URL("../src/main.jsx", import.meta.url)));
  return sources;
}

test("the shipped illustration path uses complete images without canvas or continuous rig scheduling", () => {
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
    [/\brequestAnimationFrame\s*\(/, "app-owned continuous frame loop"],
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
});
