import test from "node:test";
import assert from "node:assert/strict";
import {
  canScrollInsideApp,
  installMobileInteractionGuard,
} from "../src/mobile-interactions.js";

function element(parent = null, properties = {}) {
  const result = {
    nodeType: 1,
    parentElement: parent,
    scrollTop: 0,
    scrollLeft: 0,
    scrollHeight: 100,
    scrollWidth: 100,
    clientHeight: 100,
    clientWidth: 100,
    css: { overflowX: "visible", overflowY: "visible" },
    interactive: false,
    contains(target) {
      for (let current = target; current; current = current.parentElement)
        if (current === this) return true;
      return false;
    },
    closest(selector) {
      for (let current = this; current; current = current.parentElement)
        if (
          selector === ".technique-scene"
            ? current.techniqueScene
            : current.interactive
        )
          return current;
      return null;
    },
    ...properties,
  };
  return result;
}

function browser() {
  const body = element();
  const root = element(body);
  const view = new EventTarget();
  view.innerHeight = 720;
  view.getComputedStyle = (node) => node.css;
  view.visualViewport = Object.assign(new EventTarget(), {
    scale: 1,
    height: 720,
  });
  const values = new Map();
  const doc = new EventTarget();
  doc.body = body;
  doc.defaultView = view;
  doc.getElementById = (id) => (id === "root" ? root : null);
  doc.documentElement = {
    style: {
      getPropertyValue: (key) => values.get(key) || "",
      setProperty: (key, value) => values.set(key, value),
      removeProperty: (key) => values.delete(key),
    },
  };
  const emit = (type, target, properties = {}) => {
    const event = new Event(type, { cancelable: true, bubbles: true });
    Object.defineProperties(
      event,
      Object.fromEntries(
        Object.entries({ target, ...properties }).map(([key, value]) => [
          key,
          { value },
        ]),
      ),
    );
    doc.dispatchEvent(event);
    return event;
  };
  const touch = (x, y, identifier = 1) => ({
    clientX: x,
    clientY: y,
    identifier,
  });
  const tap = (target, time, x = 30, y = 40) => {
    const finger = touch(x, y);
    emit("touchstart", target, { touches: [finger], timeStamp: time });
    return emit("touchend", target, {
      touches: [],
      changedTouches: [finger],
      timeStamp: time + 40,
    });
  };
  return { root, view, doc, values, emit, touch, tap };
}

test("native callouts, selection, image dragging and double-click zoom are cancelled only in the game", () => {
  const env = browser();
  const text = element(env.root);
  const outside = element();
  const cleanup = installMobileInteractionGuard(env.doc);
  for (const event of ["contextmenu", "selectstart", "dragstart", "dblclick"]) {
    assert.equal(env.emit(event, text).defaultPrevented, true, event);
    assert.equal(env.emit(event, outside).defaultPrevented, false, event);
  }
  cleanup();
  assert.equal(env.emit("contextmenu", text).defaultPrevented, false);
});

test("a double tap cancels Safari zoom but still reaches game event handlers", () => {
  const env = browser();
  const card = element(env.root, { interactive: true });
  installMobileInteractionGuard(env.doc);
  let received = 0;
  env.doc.addEventListener("touchend", () => received++);
  assert.equal(env.tap(card, 100).defaultPrevented, false);
  assert.equal(env.tap(card, 280).defaultPrevented, true);
  assert.equal(received, 2);
  assert.equal(env.tap(card, 420).defaultPrevented, false);
});

test("the body-mounted technique portal gets callout, double-tap and overscroll protection", () => {
  const env = browser();
  const portal = element(env.doc.body, { techniqueScene: true });
  const caption = element(portal);
  const outside = element(env.doc.body);
  installMobileInteractionGuard(env.doc);
  for (const event of ["contextmenu", "selectstart", "dragstart", "dblclick"]) {
    assert.equal(env.emit(event, caption).defaultPrevented, true, event);
    assert.equal(env.emit(event, outside).defaultPrevented, false, event);
  }
  assert.equal(env.tap(caption, 100).defaultPrevented, false);
  assert.equal(env.tap(caption, 250).defaultPrevented, true);
  env.emit("touchstart", caption, { touches: [env.touch(50, 100)] });
  assert.equal(
    env.emit("touchmove", caption, {
      touches: [env.touch(50, 80)],
    }).defaultPrevented,
    true,
  );
});

test("quick taps on different buttons and search input focus remain native", () => {
  const env = browser();
  const card = element(env.root, { interactive: true });
  const nextCard = element(env.root, { interactive: true });
  const input = element(env.root, { interactive: true });
  installMobileInteractionGuard(env.doc);
  assert.equal(env.tap(card, 100).defaultPrevented, false);
  assert.equal(env.tap(nextCard, 200).defaultPrevented, false);
  assert.equal(env.tap(input, 300).defaultPrevented, false);
  assert.equal(env.emit("keydown", input).defaultPrevented, false);
  assert.equal(env.emit("beforeinput", input).defaultPrevented, false);
});

test("dragging through the hand and long presses are not mistaken for double taps", () => {
  const env = browser();
  const card = element(env.root, { interactive: true });
  installMobileInteractionGuard(env.doc);
  env.tap(card, 100);
  env.emit("touchstart", card, {
    touches: [env.touch(30, 40)],
    timeStamp: 200,
  });
  const move = env.emit("touchmove", card, {
    touches: [env.touch(100, 40)],
    timeStamp: 240,
  });
  assert.equal(move.defaultPrevented, true, "the hand cannot pan the page");
  assert.equal(
    env.emit("touchend", card, {
      touches: [],
      changedTouches: [env.touch(100, 40)],
      timeStamp: 280,
    }).defaultPrevented,
    false,
  );
  assert.equal(env.tap(card, 340).defaultPrevented, false);
  env.emit("touchstart", card, {
    touches: [env.touch(30, 40)],
    timeStamp: 450,
  });
  env.emit("touchend", card, {
    touches: [],
    changedTouches: [env.touch(30, 40)],
    timeStamp: 1100,
  });
  assert.equal(env.tap(card, 1200).defaultPrevented, false);
});

test("internal vertical and horizontal scrolling work while boundary pulls cannot escape", () => {
  const root = element();
  const main = element(root, {
    scrollHeight: 900,
    clientHeight: 300,
    scrollTop: 100,
    css: { overflowX: "hidden", overflowY: "auto" },
  });
  const tile = element(main);
  const styleFor = (node) => node.css;
  assert.equal(canScrollInsideApp(tile, 0, -20, root, styleFor), true);
  assert.equal(canScrollInsideApp(tile, 0, 20, root, styleFor), true);
  main.scrollTop = 0;
  assert.equal(canScrollInsideApp(tile, 0, 20, root, styleFor), false);
  assert.equal(canScrollInsideApp(tile, 0, -20, root, styleFor), true);
  main.scrollTop = 600;
  assert.equal(canScrollInsideApp(tile, 0, -20, root, styleFor), false);
  const rewards = element(main, {
    scrollWidth: 600,
    clientWidth: 200,
    css: { overflowX: "auto", overflowY: "hidden" },
  });
  assert.equal(canScrollInsideApp(rewards, -20, 1, root, styleFor), true);
  assert.equal(canScrollInsideApp(rewards, 20, 1, root, styleFor), false);
});

test("Safari pan fallback preserves a moving internal scroller and cancels its edge overscroll", () => {
  const env = browser();
  const main = element(env.root, {
    scrollHeight: 900,
    clientHeight: 300,
    scrollTop: 100,
    css: { overflowX: "hidden", overflowY: "auto" },
  });
  const content = element(main);
  installMobileInteractionGuard(env.doc);
  env.emit("touchstart", content, { touches: [env.touch(50, 100)] });
  assert.equal(
    env.emit("touchmove", content, {
      touches: [env.touch(50, 80)],
    }).defaultPrevented,
    false,
  );
  main.scrollTop = 600;
  assert.equal(
    env.emit("touchmove", content, {
      touches: [env.touch(50, 60)],
    }).defaultPrevented,
    true,
  );
});

test("Safari keeps an established vertical or horizontal pan through perpendicular jitter", () => {
  const env = browser();
  const main = element(env.root, {
    scrollHeight: 900,
    clientHeight: 300,
    scrollTop: 100,
    css: { overflowX: "hidden", overflowY: "auto" },
  });
  const rail = element(main, {
    scrollWidth: 600,
    clientWidth: 200,
    scrollLeft: 100,
    css: { overflowX: "auto", overflowY: "hidden" },
  });
  installMobileInteractionGuard(env.doc);
  env.emit("touchstart", main, { touches: [env.touch(50, 100)] });
  for (const [x, y] of [
    [50, 80],
    [51, 80],
    [58, 79],
    [58, 70],
  ]) {
    assert.equal(
      env.emit("touchmove", main, {
        touches: [env.touch(x, y)],
      }).defaultPrevented,
      false,
      `vertical pan at ${x}, ${y}`,
    );
  }
  env.emit("touchcancel", main);
  env.emit("touchstart", rail, { touches: [env.touch(100, 50)] });
  for (const [x, y] of [
    [80, 50],
    [80, 51],
    [79, 58],
    [70, 58],
  ]) {
    assert.equal(
      env.emit("touchmove", rail, {
        touches: [env.touch(x, y)],
      }).defaultPrevented,
      false,
      `horizontal pan at ${x}, ${y}`,
    );
  }
});

test("stationary small finger jitter preserves the native first tap", () => {
  const env = browser();
  const input = element(env.root, { interactive: true });
  installMobileInteractionGuard(env.doc);
  env.emit("touchstart", input, {
    touches: [env.touch(50, 100)],
    timeStamp: 100,
  });
  assert.equal(
    env.emit("touchmove", input, {
      touches: [env.touch(53, 101)],
      timeStamp: 115,
    }).defaultPrevented,
    false,
  );
  assert.equal(
    env.emit("touchend", input, {
      touches: [],
      changedTouches: [env.touch(53, 101)],
      timeStamp: 140,
    }).defaultPrevented,
    false,
  );
});

test("multi-touch is preserved and does not turn the next tap into a double tap", () => {
  const env = browser();
  const card = element(env.root, { interactive: true });
  installMobileInteractionGuard(env.doc);
  env.tap(card, 100);
  const fingers = [env.touch(20, 40, 1), env.touch(80, 40, 2)];
  env.emit("touchstart", card, { touches: fingers, timeStamp: 200 });
  assert.equal(
    env.emit("touchmove", card, { touches: fingers }).defaultPrevented,
    false,
  );
  assert.equal(env.tap(card, 300).defaultPrevented, false);
});

test("keyboard viewport height changes resize the shell and all listeners clean up", () => {
  const env = browser();
  const cleanup = installMobileInteractionGuard(env.doc);
  assert.equal(env.values.get("--app-viewport-height"), "720px");
  env.view.visualViewport.height = 410;
  env.view.visualViewport.dispatchEvent(new Event("resize"));
  assert.equal(env.values.get("--app-viewport-height"), "410px");
  env.view.visualViewport.scale = 2;
  env.view.visualViewport.height = 200;
  env.view.visualViewport.dispatchEvent(new Event("resize"));
  assert.equal(env.values.get("--app-viewport-height"), "720px");
  cleanup();
  assert.equal(env.values.has("--app-viewport-height"), false);
  env.view.visualViewport.scale = 1;
  env.view.visualViewport.height = 510;
  env.view.visualViewport.dispatchEvent(new Event("resize"));
  assert.equal(env.values.has("--app-viewport-height"), false);
});
