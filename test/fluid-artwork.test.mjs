import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { actionLandmarks } from "../src/action-landmarks.js";
import { CLASSIC_ACTION_POSES } from "../src/action-motion.js";
import {
  createFluidArtwork,
  fluidInkMix,
  fluidSurface,
  poseRegistration,
} from "../src/fluid-artwork.js";

const manifest = JSON.parse(
  readFileSync(
    new URL("../public/assets/classic-actions/manifest.json", import.meta.url),
    "utf8",
  ),
);
const close = (actual, expected, label) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${label}: ${actual} vs ${expected}`,
  );

test("all sixty complete poses use a stable canvas and preserve the source pixel scale and bottom anchor", () => {
  for (const [actor, metadata] of Object.entries(manifest)) {
    const surface = fluidSurface(metadata);
    for (const pose of CLASSIC_ACTION_POSES) {
      const frame = metadata.frames[pose];
      const registration = poseRegistration(metadata, actor, pose, surface);
      assert.equal(registration.points.length, 36);
      close(
        registration.size[0] * surface.width,
        frame.width,
        `${actor}/${pose} width`,
      );
      close(
        registration.size[1] * surface.height,
        frame.height,
        `${actor}/${pose} height`,
      );
      close(
        registration.offset[1] + registration.size[1],
        1,
        `${actor}/${pose} bottom`,
      );
      const landmarks = actionLandmarks(actor, pose);
      landmarks.forEach(([x, y], index) => {
        close(
          registration.points[index * 2],
          registration.offset[0] + x * registration.size[0],
          `${actor}/${pose} x${index}`,
        );
        close(
          registration.points[index * 2 + 1],
          registration.offset[1] + y * registration.size[1],
          `${actor}/${pose} y${index}`,
        );
      });
      assert.deepEqual(
        [...registration.points.slice(28)],
        [0, 0, 1, 0, 0, 1, 1, 1],
      );
      assert.ok(
        [...registration.points].every(
          (value) => Number.isFinite(value) && value >= 0 && value <= 1,
        ),
      );
    }
  }
});

function drawingHarness() {
  const counts = new Map();
  const count = (name) => counts.set(name, (counts.get(name) || 0) + 1);
  const calls = (name) => counts.get(name) || 0;
  const uniforms = new Map();
  let lost = false;
  let sequence = 0;
  const gl = {
    isContextLost: () => lost,
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    getAttribLocation: () => 0,
    getUniformLocation: (_, name) => {
      count("getUniformLocation");
      return name;
    },
    uniform2fv: (name, values) => {
      count("uniform2fv");
      uniforms.set(name, [...values]);
    },
    getExtension: () => ({
      loseContext() {
        count("loseContext");
        lost = true;
      },
    }),
  };
  for (const name of [
    "VERTEX_SHADER",
    "FRAGMENT_SHADER",
    "COMPILE_STATUS",
    "LINK_STATUS",
    "ARRAY_BUFFER",
    "STATIC_DRAW",
    "FLOAT",
    "UNPACK_PREMULTIPLY_ALPHA_WEBGL",
    "BLEND",
    "ONE",
    "TEXTURE_2D",
    "TEXTURE_MIN_FILTER",
    "TEXTURE_MAG_FILTER",
    "LINEAR",
    "TEXTURE_WRAP_S",
    "TEXTURE_WRAP_T",
    "CLAMP_TO_EDGE",
    "RGBA",
    "UNSIGNED_BYTE",
    "COLOR_BUFFER_BIT",
    "TRIANGLES",
  ])
    gl[name] = name;
  for (const name of [
    "createShader",
    "createProgram",
    "createBuffer",
    "createTexture",
  ])
    gl[name] = () => {
      count(name);
      return { name, id: sequence++ };
    };
  for (const name of [
    "shaderSource",
    "compileShader",
    "deleteShader",
    "attachShader",
    "linkProgram",
    "useProgram",
    "bindBuffer",
    "bufferData",
    "enableVertexAttribArray",
    "vertexAttribPointer",
    "uniform1i",
    "pixelStorei",
    "enable",
    "blendFunc",
    "clearColor",
    "viewport",
    "bindTexture",
    "texParameteri",
    "texImage2D",
    "clear",
    "uniform2f",
    "uniform1f",
    "drawArrays",
    "deleteTexture",
    "deleteBuffer",
    "deleteProgram",
  ])
    gl[name] = () => count(name);
  const context = Object.fromEntries(
    ["beginPath", "moveTo", "lineTo", "closePath", "clip", "drawImage"].map(
      (name) => [name, () => count(name)],
    ),
  );
  const document = {
    createElement(name) {
      assert.equal(name, "canvas");
      count("createCanvas");
      return { width: 0, height: 0, getContext: () => context };
    },
  };
  return {
    calls,
    uniforms,
    document,
    canvas: { width: 0, height: 0, getContext: () => gl },
    lose: () => {
      lost = true;
    },
  };
}

test("preparation uploads each whole pose once, while frame draws allocate no canvases, buffers or textures", () => {
  const harness = drawingHarness();
  const previousDocument = globalThis.document;
  globalThis.document = harness.document;
  let renderer;
  try {
    const metadata = { ...manifest.raven, id: "raven", image: {} };
    renderer = createFluidArtwork(harness.canvas, metadata, "raven");
    assert.equal(harness.calls("createCanvas"), 12);
    assert.equal(
      harness.calls("clip"),
      12,
      "each complete source crop excludes neighboring atlas ink",
    );
    assert.equal(harness.calls("texImage2D"), 12);
    assert.ok(Math.max(harness.canvas.width, harness.canvas.height) <= 768);
    const resources = [
      "createCanvas",
      "createTexture",
      "texImage2D",
      "createBuffer",
      "bufferData",
      "getUniformLocation",
    ];
    const prepared = resources.map(harness.calls);
    for (let frame = 0; frame <= 120; frame++) {
      const mix = frame / 120;
      assert.equal(
        renderer.draw({
          from: "clinch",
          to: "suplex",
          mix,
          sway: 0,
          compress: 0,
        }),
        true,
      );
      const target = harness.uniforms.get("u_target[0]");
      const from = poseRegistration(metadata, "raven", "clinch").points;
      const to = poseRegistration(metadata, "raven", "suplex").points;
      target.forEach((value, index) =>
        close(
          value,
          from[index] + (to[index] - from[index]) * mix,
          `frame ${frame} anchor ${index}`,
        ),
      );
    }
    assert.deepEqual(
      resources.map(harness.calls),
      prepared,
      "60 Hz playback must only update uniforms and draw",
    );
    assert.ok(
      harness.calls("drawArrays") >= 121 && harness.calls("drawArrays") < 160,
      "only the short central ink exchange draws two layers; geometry morphs throughout",
    );
    renderer.dispose();
    const rendered = harness.calls("drawArrays");
    assert.equal(renderer.draw({ from: "ready", to: "ready", mix: 0 }), false);
    assert.equal(harness.calls("drawArrays"), rendered);
    assert.equal(harness.calls("deleteTexture"), 12);
    assert.equal(harness.calls("deleteBuffer"), 1);
    assert.equal(harness.calls("deleteProgram"), 1);
    assert.equal(harness.calls("deleteShader"), 2);
    renderer.dispose();
    assert.equal(harness.calls("loseContext"), 1, "dispose is idempotent");
  } finally {
    renderer?.dispose();
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("ink changes continuously through a short interval while endpoint poses stay opaque", () => {
  assert.equal(fluidInkMix(0.38), 0);
  assert.equal(fluidInkMix(0.62), 1);
  close(fluidInkMix(0.5), 0.5, "central ink");
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const value = fluidInkMix(i / 1000);
    assert.ok(value >= previous && value - previous < 0.008);
    previous = value;
  }
});

test("a lost graphics context stops drawing so the complete-image fallback can take over", () => {
  const harness = drawingHarness();
  const previousDocument = globalThis.document;
  globalThis.document = harness.document;
  let renderer;
  try {
    renderer = createFluidArtwork(
      harness.canvas,
      { ...manifest.viper, id: "viper", image: {} },
      "viper",
    );
    harness.lose();
    assert.equal(renderer.draw({ from: "ready", to: "kick", mix: 0.5 }), false);
    assert.equal(harness.calls("drawArrays"), 0);
  } finally {
    renderer?.dispose();
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
