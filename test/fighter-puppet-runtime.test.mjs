import test from "node:test";
import assert from "node:assert/strict";
import {
  createFighterController,
  validatePuppet,
} from "../src/fighter-puppet.js";

let fixtureId = 0;

const config = validatePuppet({
  atlas: "fighters/runtime-atlas.webp",
  size: [1000, 1500],
  facing: 1,
  parts: [
    { id: "body", bounds: [0.25, 0.2, 0.5, 0.8], pivot: [0.5, 0.85], z: 10 },
    {
      id: "head",
      bounds: [0.36, 0.05, 0.28, 0.22],
      pivot: [0.5, 0.9],
      parent: "body",
      z: 30,
    },
    {
      id: "backHair",
      bounds: [0.33, 0.02, 0.36, 0.4],
      pivot: [0.5, 0.2],
      parent: "head",
      z: 5,
    },
    {
      id: "frontHair",
      bounds: [0.34, 0.02, 0.34, 0.14],
      pivot: [0.5, 0.3],
      parent: "head",
      z: 35,
    },
    {
      id: "leftArm",
      bounds: [0.12, 0.22, 0.26, 0.4],
      pivot: [0.85, 0.1],
      parent: "body",
      z: 20,
    },
    {
      id: "rightArm",
      bounds: [0.62, 0.22, 0.26, 0.4],
      pivot: [0.15, 0.1],
      parent: "body",
      z: 40,
    },
  ].map((part, index) => ({
    ...part,
    source: [(index % 3) / 3, Math.floor(index / 3) / 2, 1 / 3, 1 / 2],
  })),
  face: {
    eyes: [
      [0.44, 0.135, 0.025, 0.012],
      [0.56, 0.135, 0.025, 0.012],
    ],
    mouth: [0.5, 0.2, 0.08, 0.018],
    skin: "#f4c4ad",
    iris: "#64b8ca",
  },
});

// Exercise the public scheduler with the real six-layer controller. Only the
// browser surfaces and decoded atlas are replaced; animation state is real.
async function runtimeFixture(t, { reduced = false } = {}) {
  const originals = new Map();
  const replace = (name, value) => {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const frames = new Map(),
    handles = [],
    intersections = [],
    resizes = [],
    images = [],
    documentEvents = new Map();
  let now = performance.now() + 100,
    nextFrame = 0,
    dialog = null,
    mutationCallback,
    mediaCallback;
  const atlas = { width: 3000, height: 2000 };
  const readyAsset = { ready: true, config, atlas, size: [1000, 1500] };

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
    },
    { get: (object, key) => object[key] ?? (() => {}) },
  );

  const canvas = () => {
    const renders = [];
    let current;
    const context = new Proxy(
      {
        clearRect() {
          current = { images: [], transforms: [] };
          renders.push(current);
        },
        drawImage(...args) {
          current?.images.push(args);
        },
        transform(...matrix) {
          current?.transforms.push(matrix);
        },
      },
      { get: (object, key) => object[key] ?? (() => {}) },
    );
    return {
      width: 100,
      height: 150,
      dataset: {},
      renders,
      addEventListener() {},
      getContext: (type) => (type === "webgl" ? gl : context),
    };
  };
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
  const media = {
    matches: reduced,
    addEventListener(_, callback) {
      mediaCallback = callback;
    },
  };
  const document = {
    hidden: false,
    body: {},
    createElement: canvas,
    addEventListener(name, callback) {
      documentEvents.set(name, callback);
    },
    querySelector: () => dialog,
  };
  replace("Image", DelayedImage);
  replace("document", document);
  replace("window", {
    devicePixelRatio: 1,
    matchMedia: () => media,
    addEventListener() {},
  });
  replace("navigator", { hardwareConcurrency: 8 });
  replace("requestAnimationFrame", (callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  replace("cancelAnimationFrame", (id) => frames.delete(id));
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
      constructor(callback) {
        this.callback = callback;
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
      constructor(callback) {
        mutationCallback = callback;
      }
      observe() {}
    },
  );
  const renderer = await import(
    `../src/live-art-renderer.js?puppet-runtime=${++fixtureId}`
  );
  const fixture = {
    frames,
    intersections,
    resizes,
    images,
    atlas,
    setMotion: renderer.setLiveArtMotion,
    add(art, overrides = {}, asset = readyAsset) {
      const output = canvas();
      const options = {
        art,
        src: `/assets/${art}`,
        condition: "normal",
        fit: "contain",
        position: [0.5, 1],
        still: false,
        ...overrides,
      };
      const wrapper = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 300,
        }),
      };
      let readyCount = 0,
        assetWake;
      const controller = art.startsWith("fighters/")
        ? createFighterController("/assets/", (_, __, wake) => {
            assetWake = wake;
            return asset;
          })
        : null;
      const handle = renderer.registerLiveArt(
        wrapper,
        output,
        () => options,
        () => readyCount++,
        controller,
      );
      handles.push(handle);
      return {
        output,
        options,
        wrapper,
        handle,
        get readyCount() {
          return readyCount;
        },
        completeAsset() {
          asset.ready = true;
          assetWake?.();
        },
      };
    },
    advance(milliseconds = 50) {
      assert.ok(frames.size <= 1, "all artwork must use one shared RAF");
      now += milliseconds;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
      assert.ok(
        frames.size <= 1,
        "controllers must not create their own RAF loops",
      );
    },
    settle(limit = 160) {
      for (let step = 0; frames.size && step < limit; step++) this.advance();
      assert.equal(
        frames.size,
        0,
        "inactive controllers must finish settling and release the RAF",
      );
    },
    visibility(hidden) {
      document.hidden = hidden;
      documentEvents.get("visibilitychange")?.();
    },
    reduced(value) {
      media.matches = value;
      mediaCallback?.({ matches: value });
    },
    modal(contents = null) {
      const included = new Set(contents);
      dialog = contents
        ? { contains: (wrapper) => included.has(wrapper) }
        : null;
      mutationCallback?.();
    },
    mutate() {
      mutationCallback?.();
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

const frameCount = ({ output }) => Number(output.dataset.frame || 0);
const bodyAngle = ({ output }) => {
  const matrix = output.renders.at(-1).transforms[1];
  return Math.atan2(matrix[1], matrix[0]);
};

test("multiple six-layer puppets and card art share one RAF and render together", async (t) => {
  const fixture = await runtimeFixture(t);
  const puppets = ["raven", "nova", "viper"].map((actor) =>
    fixture.add(`fighters/${actor}.webp`),
  );
  const card = fixture.add("cards/strike.webp");
  assert.equal(fixture.frames.size, 1);
  fixture.advance();
  assert.equal(
    fixture.images.length,
    1,
    "puppets must use the supplied atlas instead of mesh textures",
  );
  fixture.images[0].complete();
  fixture.advance();
  assert.equal(card.output.dataset.renderer, "webgl");
  assert.ok(frameCount(card) > 0);
  for (const puppet of puppets) {
    assert.equal(puppet.output.dataset.renderer, "layered-canvas");
    assert.equal(puppet.output.dataset.parts, "6");
    assert.equal(puppet.output.dataset.liveState, "running");
    assert.equal(puppet.readyCount, 1);
    const rendered = puppet.output.renders.at(-1);
    assert.equal(rendered.images.length, 6);
    assert.ok(rendered.images.every(([image]) => image === fixture.atlas));
    assert.equal(
      new Set(rendered.images.map((args) => args.slice(1, 5).join(","))).size,
      6,
    );
    assert.equal(rendered.transforms.length, 6);
    assert.ok(rendered.transforms.flat().every(Number.isFinite));
  }
  const before = [...puppets, card].map(frameCount);
  const matrices = puppets.map(
    ({ output }) => output.renders.at(-1).transforms,
  );
  fixture.advance();
  [...puppets, card].forEach((surface, index) =>
    assert.equal(frameCount(surface), before[index] + 1),
  );
  puppets.forEach(({ output }, index) => {
    // Sorted layers are back hair, body, left arm, head, front hair, right arm.
    for (const layer of [0, 2, 3, 4, 5]) {
      assert.notDeepEqual(
        output.renders.at(-1).transforms[layer],
        matrices[index][layer],
        "head, both arms, and both hair layers must actually move between scheduled frames",
      );
    }
  });
  assert.equal(fixture.frames.size, 1);
});

test("global motion pause settles puppets, cancels attack motion, and resumes the shared RAF", async (t) => {
  const fixture = await runtimeFixture(t);
  const first = fixture.add("fighters/raven.webp", {
    cast: { id: 1, disciplineSlug: "strike", duration: 1000 },
  });
  const second = fixture.add("fighters/nova.webp", { condition: "excited" });
  fixture.advance();
  assert.equal(first.output.dataset.action, "strike");
  fixture.setMotion(false);
  fixture.advance();
  assert.equal(first.output.dataset.action, "idle");
  fixture.settle();
  const before = [first, second].map(frameCount);
  fixture.advance(5000);
  [first, second].forEach((surface, index) => {
    assert.equal(surface.output.dataset.liveState, "still");
    assert.equal(frameCount(surface), before[index]);
  });
  fixture.setMotion(true);
  assert.equal(fixture.frames.size, 1);
  fixture.advance();
  [first, second].forEach((surface, index) => {
    assert.equal(surface.output.dataset.liveState, "running");
    assert.equal(frameCount(surface), before[index] + 1);
  });
  assert.equal(
    first.output.dataset.action,
    "idle",
    "resuming must not replay an already consumed cast",
  );
});

test("offscreen puppets pause independently and the scheduler stops when all are offscreen", async (t) => {
  const fixture = await runtimeFixture(t);
  const first = fixture.add("fighters/raven.webp");
  const second = fixture.add("fighters/ember.webp");
  fixture.advance();
  const firstBefore = frameCount(first),
    secondBefore = frameCount(second);
  fixture.intersections[0].setVisible(false);
  fixture.advance();
  assert.equal(first.output.dataset.liveState, "paused");
  assert.equal(frameCount(first), firstBefore);
  assert.equal(frameCount(second), secondBefore + 1);
  fixture.intersections[1].setVisible(false);
  fixture.advance();
  assert.equal(fixture.frames.size, 0);
  fixture.intersections[0].setVisible(true);
  fixture.advance();
  assert.equal(first.output.dataset.liveState, "running");
  assert.equal(frameCount(first), firstBefore + 1);
  assert.equal(frameCount(second), secondBefore + 1);
});

test("hidden tabs cancel the shared RAF and resume every visible puppet without catch-up loops", async (t) => {
  const fixture = await runtimeFixture(t);
  const puppets = ["raven", "valkyrie"].map((actor) =>
    fixture.add(`fighters/${actor}.webp`),
  );
  fixture.advance();
  const before = puppets.map(frameCount);
  fixture.visibility(true);
  assert.equal(fixture.frames.size, 0);
  fixture.advance(60_000);
  puppets.forEach((puppet, index) =>
    assert.equal(frameCount(puppet), before[index]),
  );
  fixture.visibility(false);
  assert.equal(fixture.frames.size, 1);
  fixture.advance();
  puppets.forEach((puppet, index) =>
    assert.equal(frameCount(puppet), before[index] + 1),
  );
  assert.equal(fixture.frames.size, 1);
});

const pauseModes = [
  {
    name: "the tab is hidden",
    pause: (fixture) => fixture.visibility(true),
    resume: (fixture) => fixture.visibility(false),
  },
  {
    name: "the puppet is offscreen",
    pause(fixture) {
      fixture.intersections[0].setVisible(false);
      fixture.advance();
    },
    resume: (fixture) => fixture.intersections[0].setVisible(true),
  },
  {
    name: "a modal obscures the puppet",
    pause(fixture) {
      fixture.modal([]);
      fixture.advance();
    },
    resume: (fixture) => fixture.modal(null),
  },
];

for (const mode of pauseModes) {
  test(`an active cast that disappears while ${mode.name} stays idle on resume`, async (t) => {
    const fixture = await runtimeFixture(t);
    const puppet = fixture.add("fighters/raven.webp", {
      cast: { id: 101, disciplineSlug: "strike", duration: 1000 },
    });
    fixture.advance();
    assert.equal(puppet.output.dataset.action, "strike");
    assert.ok(
      bodyAngle(puppet) > 0,
      "the cast must actually move the body before pausing",
    );
    mode.pause(fixture);
    const before = frameCount(puppet);
    puppet.options.cast = null;
    puppet.handle.refresh();
    fixture.advance(5000);
    assert.equal(
      frameCount(puppet),
      before,
      "paused sources must not render the expired action",
    );
    mode.resume(fixture);
    fixture.advance();
    assert.equal(puppet.output.dataset.action, "idle");
    assert.equal(
      bodyAngle(puppet),
      0,
      "resuming must remove the old cast's body rotation",
    );
    fixture.advance();
    assert.equal(
      puppet.output.dataset.action,
      "idle",
      "the expired cast must not replay on a later frame",
    );
  });

  test(`an active hit cleared while ${mode.name} cancels its reaction on resume`, async (t) => {
    const fixture = await runtimeFixture(t);
    const puppet = fixture.add("fighters/raven.webp", {
      hit: true,
      hitId: 101,
    });
    fixture.advance();
    assert.equal(puppet.output.dataset.action, "hit");
    assert.ok(
      bodyAngle(puppet) < 0,
      "the hit must actually recoil the body before pausing",
    );
    mode.pause(fixture);
    const before = frameCount(puppet);
    puppet.options.hit = false;
    puppet.options.hitId = null;
    puppet.handle.refresh();
    fixture.advance(5000);
    assert.equal(frameCount(puppet), before);
    mode.resume(fixture);
    fixture.advance();
    assert.equal(puppet.output.dataset.action, "idle");
    assert.equal(
      bodyAngle(puppet),
      0,
      "resuming must remove the old hit's recoil",
    );
    fixture.advance();
    assert.equal(puppet.output.dataset.action, "idle");
  });
}

test("consecutive hit ids restart the actual recoil while hit remains true", async (t) => {
  const fixture = await runtimeFixture(t);
  const puppet = fixture.add("fighters/raven.webp", { hit: true, hitId: 101 });
  for (let step = 0; step < 6; step++) fixture.advance();
  assert.equal(puppet.output.dataset.action, "hit");
  const firstPeak = Math.abs(bodyAngle(puppet));
  assert.ok(
    firstPeak > 0.15,
    "the first reaction should reach a visible recoil",
  );
  puppet.options.hitId = 102;
  puppet.handle.refresh();
  fixture.advance();
  assert.equal(puppet.options.hit, true);
  assert.equal(puppet.output.dataset.action, "hit");
  assert.ok(
    Math.abs(bodyAngle(puppet)) < firstPeak * 0.3,
    "a new hit id must restart the recoil, rather than continuing the first hit's timeline",
  );
  for (let step = 0; step < 14; step++) fixture.advance();
  assert.equal(puppet.output.dataset.action, "idle");
  assert.equal(bodyAngle(puppet), 0);
  puppet.options.hitId = 103;
  puppet.handle.refresh();
  fixture.advance();
  assert.equal(puppet.options.hit, true);
  assert.equal(
    puppet.output.dataset.action,
    "hit",
    "a new id must also retrigger an expired reaction",
  );
  assert.ok(bodyAngle(puppet) < 0);
});

test("an explicit shortened cast duration ends the attack while its cue remains present", async (t) => {
  const fixture = await runtimeFixture(t);
  const puppet = fixture.add("fighters/raven.webp", {
    cast: { id: 101, disciplineSlug: "strike", duration: 1700 },
    castDuration: 650,
  });
  fixture.advance();
  assert.equal(puppet.output.dataset.action, "strike");
  assert.ok(bodyAngle(puppet) > 0);
  for (let step = 0; step < 13; step++) fixture.advance();
  assert.equal(puppet.options.cast.id, 101);
  assert.equal(puppet.output.dataset.action, "idle");
  assert.equal(
    bodyAngle(puppet),
    0,
    "the puppet must follow the actual presentation duration",
  );
});

test("a modal pauses background puppets while its own puppet continues, then resumes background art", async (t) => {
  const fixture = await runtimeFixture(t);
  const background = fixture.add("fighters/nova.webp");
  const preview = fixture.add("fighters/viper.webp");
  fixture.advance();
  const before = [background, preview].map(frameCount);
  fixture.modal([preview.wrapper]);
  fixture.advance();
  assert.equal(background.output.dataset.liveState, "obscured");
  assert.equal(frameCount(background), before[0]);
  assert.equal(frameCount(preview), before[1] + 1);
  fixture.modal([]);
  fixture.advance();
  assert.equal(
    fixture.frames.size,
    0,
    "a modal with no animated artwork must suspend background work",
  );
  fixture.modal(null);
  fixture.advance();
  assert.equal(background.output.dataset.liveState, "running");
  assert.equal(frameCount(background), before[0] + 1);
  assert.equal(frameCount(preview), before[1] + 2);
});

test("new still and globally disabled puppets render one complete pose without a settling loop", async (t) => {
  const fixture = await runtimeFixture(t);
  const still = fixture.add("fighters/raven.webp", {
    still: true,
    condition: "groggy",
  });
  fixture.advance();
  assert.equal(frameCount(still), 1);
  assert.equal(still.output.dataset.liveState, "still");
  assert.equal(still.output.dataset.expression, "groggy");
  assert.equal(still.output.renders.at(-1).images.length, 6);
  assert.equal(fixture.frames.size, 0);
  still.options.condition = "fiery";
  still.handle.refresh();
  fixture.advance();
  assert.equal(still.output.dataset.expression, "fiery");
  assert.equal(
    fixture.frames.size,
    0,
    "a still expression change should render immediately and stop",
  );
  fixture.setMotion(false);
  const disabled = fixture.add("fighters/ember.webp", { condition: "tired" });
  fixture.advance();
  assert.equal(frameCount(disabled), 1);
  assert.equal(disabled.output.dataset.liveState, "still");
  assert.equal(disabled.output.renders.at(-1).images.length, 6);
  assert.equal(fixture.frames.size, 0);
});

test("reduced motion applies to new puppets and live preference changes stop and restart animation", async (t) => {
  const fixture = await runtimeFixture(t, { reduced: true });
  const puppet = fixture.add("fighters/valkyrie.webp", {
    condition: "tired",
    cast: { id: 1, disciplineSlug: "aerial", duration: 1000 },
    hit: true,
  });
  fixture.advance();
  assert.equal(frameCount(puppet), 1);
  assert.equal(puppet.output.dataset.liveState, "still");
  assert.equal(puppet.output.dataset.action, "idle");
  assert.equal(fixture.frames.size, 0);
  fixture.reduced(false);
  fixture.advance();
  assert.equal(puppet.output.dataset.liveState, "running");
  assert.equal(fixture.frames.size, 1);
  fixture.reduced(true);
  fixture.advance();
  assert.equal(puppet.output.dataset.liveState, "still");
  assert.equal(
    fixture.frames.size,
    0,
    "reduced motion must stop immediately without spring settling",
  );
});

test("disposing the last puppet disconnects observers and a late atlas wake cannot restart work", async (t) => {
  const fixture = await runtimeFixture(t);
  const pending = {
    ready: false,
    config,
    atlas: fixture.atlas,
    size: [1000, 1500],
  };
  const puppet = fixture.add("fighters/raven.webp", {}, pending);
  fixture.advance();
  assert.equal(puppet.output.dataset.liveState, "loading-atlas");
  assert.equal(frameCount(puppet), 0);
  assert.equal(fixture.frames.size, 0);
  puppet.handle.dispose();
  assert.equal(fixture.intersections[0].disconnected, true);
  assert.equal(fixture.resizes[0].disconnected, true);
  puppet.completeAsset();
  fixture.mutate();
  fixture.reduced(true);
  fixture.visibility(false);
  assert.equal(fixture.frames.size, 0);
  fixture.advance();
  assert.equal(frameCount(puppet), 0);
  assert.equal(puppet.readyCount, 0);

  fixture.reduced(false);
  const active = fixture.add("fighters/nova.webp");
  fixture.advance();
  const before = frameCount(active);
  assert.ok(before > 0);
  assert.equal(fixture.frames.size, 1);
  active.handle.dispose();
  assert.equal(
    fixture.frames.size,
    0,
    "disposing the last active puppet must cancel its pending frame",
  );
  assert.equal(fixture.intersections[1].disconnected, true);
  assert.equal(fixture.resizes[1].disconnected, true);
  puppet.completeAsset();
  fixture.advance();
  assert.equal(frameCount(active), before);
  assert.equal(fixture.frames.size, 0);
});
