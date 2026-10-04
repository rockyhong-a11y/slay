import test from "node:test";
import assert from "node:assert/strict";
import { LIVE_ART_RIGS } from "../src/live-art-rigs.js";

let fixtureId = 0;

// Run the actual renderer's public API with delayed image decoding and a
// controllable browser lifecycle. No private functions or cache internals are
// exposed: assertions concern visible frames, loads, and scheduled work.
async function rendererFixture(t) {
  const originals = new Map();
  const replace = (name, value) => {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const images = [],
    intersections = [],
    resizes = [],
    vectorFrames = [],
    handles = [],
    frames = new Map(),
    documentEvents = new Map();
  let nextFrame = 0,
    now = performance.now() + 100;

  class DelayedImage {
    constructor() {
      this.width = 1024;
      this.height = 683;
      images.push(this);
    }
    set src(value) {
      this.url = value;
    }
    complete() {
      this.onload?.();
    }
  }

  const context = {
    drawImage() {},
    clearRect() {},
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    clip() {},
    transform() {},
    ellipse() {},
    quadraticCurveTo() {},
    stroke() {},
  };
  const gl = new Proxy(
    {
      getShaderParameter: () => true,
      getProgramParameter: () => true,
      createShader: () => ({}),
      createProgram: () => ({}),
      createBuffer: () => ({}),
      createTexture: () => ({}),
      getUniformLocation: (_, name) => name,
      getAttribLocation: () => 0,
      uniform4fv(location, values) {
        if (location === "u_vectors") vectorFrames.push([...values]);
      },
    },
    { get: (object, key) => object[key] || (() => {}) },
  );
  const canvas = () => ({
    width: 100,
    height: 100,
    dataset: {},
    addEventListener() {},
    getContext: (type) => (type === "webgl" ? gl : context),
  });
  const document = {
    hidden: false,
    body: {},
    createElement: canvas,
    addEventListener(name, listener) {
      documentEvents.set(name, listener);
    },
    querySelector: () => null,
  };
  replace("Image", DelayedImage);
  replace("requestAnimationFrame", (callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  replace("cancelAnimationFrame", (id) => frames.delete(id));
  replace("window", {
    devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {},
  });
  replace("navigator", { hardwareConcurrency: 8 });
  replace("document", document);
  replace(
    "IntersectionObserver",
    class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        intersections.push(this);
      }
      observe() {
        this.setVisible(true);
      }
      setVisible(value) {
        this.callback([{ isIntersecting: value }]);
      }
      disconnect() {
        this.disconnected = true;
      }
    },
  );
  replace(
    "ResizeObserver",
    class {
      constructor() {
        this.disconnected = false;
        resizes.push(this);
      }
      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  );
  replace(
    "MutationObserver",
    class {
      observe() {}
    },
  );

  const renderer = await import(
    `../src/live-art-renderer.js?fixture=${++fixtureId}`
  );
  const fixture = {
    images,
    intersections,
    resizes,
    vectorFrames,
    frames,
    setMotion: renderer.setLiveArtMotion,
    add(art, overrides = {}) {
      const output = canvas();
      const options = {
        art,
        src: `/assets/${art}`,
        condition: "normal",
        fit: "contain",
        position: [0.5, 0.5],
        still: false,
        ...overrides,
      };
      const wrapper = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        }),
      };
      const handle = renderer.registerLiveArt(
        wrapper,
        output,
        () => options,
        () => {},
      );
      handles.push(handle);
      return { output, options, handle };
    },
    advance(milliseconds = 100) {
      now += milliseconds;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    },
    visibility(hidden) {
      document.hidden = hidden;
      documentEvents.get("visibilitychange")?.();
    },
  };
  t.after(() => {
    handles.forEach((handle) => handle.dispose());
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return fixture;
}

test("25 visible cards all animate when seven incoming images decode late", async (t) => {
  const fixture = await rendererFixture(t);
  const arts = Object.keys(LIVE_ART_RIGS).filter((art) =>
    art.startsWith("cards/"),
  );
  const cards = arts.map((art) => fixture.add(art));
  fixture.advance();
  assert.equal(fixture.images.length, 25);

  // A viewport showing the whole library may exceed the inactive cache budget.
  // Its newest 18 images arrive first while the oldest seven remain pending.
  fixture.images.slice(7).forEach((image) => image.complete());
  fixture.advance();
  fixture.advance();
  assert.equal(cards.filter(({ output }) => output.dataset.frame).length, 18);

  fixture.images.slice(0, 7).forEach((image) => image.complete());
  fixture.advance();
  fixture.advance();
  assert.equal(
    fixture.images.length,
    25,
    "pending visible sources must not be repeatedly reloaded",
  );
  for (const { output } of cards) {
    assert.ok(
      Number(output.dataset.frame) >= 1,
      "every visible card must produce a frame",
    );
    assert.equal(output.dataset.liveState, "running");
  }
});

test("leaving the viewport pauses work and re-entry resumes the same decoded source", async (t) => {
  const fixture = await rendererFixture(t);
  const { output } = fixture.add("raven.webp");
  fixture.advance();
  fixture.images[0].complete();
  fixture.advance();
  const before = Number(output.dataset.frame);
  assert.ok(before > 0);

  fixture.intersections[0].setVisible(false);
  fixture.advance();
  assert.equal(output.dataset.liveState, "paused");
  assert.equal(Number(output.dataset.frame), before);
  assert.equal(
    fixture.frames.size,
    0,
    "an entirely offscreen scene should stop requesting frames",
  );

  fixture.intersections[0].setVisible(true);
  fixture.advance();
  assert.ok(Number(output.dataset.frame) > before);
  assert.equal(output.dataset.liveState, "running");
  assert.equal(
    fixture.images.length,
    1,
    "viewport re-entry must reuse the decoded image",
  );
});

test("hiding the tab cancels frames and visibility restoration restarts them", async (t) => {
  const fixture = await rendererFixture(t);
  const { output } = fixture.add("nova.webp");
  fixture.advance();
  fixture.images[0].complete();
  fixture.advance();
  const before = Number(output.dataset.frame);
  assert.ok(fixture.frames.size > 0);

  fixture.visibility(true);
  assert.equal(fixture.frames.size, 0);
  fixture.advance(5000);
  assert.equal(Number(output.dataset.frame), before);

  fixture.visibility(false);
  fixture.advance();
  assert.ok(Number(output.dataset.frame) > before);
  assert.equal(fixture.images.length, 1);
});

test("disposing the final surface disconnects observers and late loads cannot restart work", async (t) => {
  const fixture = await rendererFixture(t);
  const { output, handle } = fixture.add("valkyrie.webp");
  fixture.advance();
  assert.equal(fixture.images.length, 1);
  assert.ok(fixture.frames.size > 0);
  handle.dispose();

  assert.equal(fixture.frames.size, 0);
  assert.equal(fixture.intersections[0].disconnected, true);
  assert.equal(fixture.resizes[0].disconnected, true);
  fixture.images[0].complete();
  fixture.advance();
  assert.equal(fixture.frames.size, 0);
  assert.equal(output.dataset.frame, undefined);
});

test("new still surfaces and newly mounted surfaces with motion disabled begin at rest", async (t) => {
  const fixture = await rendererFixture(t);
  const first = fixture.add("raven.webp", { still: true });
  fixture.advance();
  fixture.images[0].complete();
  fixture.advance();
  assert.equal(first.output.dataset.liveState, "still");
  assert.ok(fixture.vectorFrames.length > 0);
  assert.ok(
    fixture.vectorFrames.at(-1).every((value) => value === 0),
    "a still source must not mount with a briefly animated first frame",
  );
  assert.equal(fixture.frames.size, 0);
  first.handle.dispose();

  fixture.setMotion(false);
  const second = fixture.add("nova.webp");
  fixture.advance();
  fixture.images[1].complete();
  fixture.advance();
  assert.equal(second.output.dataset.liveState, "still");
  assert.ok(
    fixture.vectorFrames.at(-1).every((value) => value === 0),
    "the user's motion setting must apply immediately to newly opened art",
  );
  assert.equal(fixture.frames.size, 0);
  second.handle.dispose();

  // A child can register before its parent applies a persisted setting.
  // Turning motion off while the first image is pending must still prevent
  // an animated first frame.
  fixture.setMotion(true);
  const third = fixture.add("valkyrie.webp");
  fixture.advance();
  fixture.setMotion(false);
  fixture.images[2].complete();
  fixture.advance();
  assert.equal(third.output.dataset.liveState, "still");
  assert.ok(
    fixture.vectorFrames.at(-1).every((value) => value === 0),
    "a setting applied before the first image is ready must begin at rest",
  );
  assert.equal(fixture.frames.size, 0);
});
