import test from "node:test";
import assert from "node:assert/strict";
import { dismissNavigationOnBlur } from "../src/navigation.js";

function menuFixture() {
  const item = { id: "roster" };
  const menu = {
    open: true,
    contains: (target) => target === menu || target === item,
  };
  return { menu, item };
}

test("a Safari tap may blur the summary without focusing the submenu; the item remains available for its click", () => {
  const { menu } = menuFixture();
  // Safari's sequence is pointerdown(item), blur(summary, null), pointerup,
  // click(item). Hiding details before pointerup prevents that final click.
  dismissNavigationOnBlur(menu, null);
  assert.equal(menu.open, true, "submenu must survive blur until activation");
});

test("keyboard focus inside the menu keeps it open; focus outside dismisses it", () => {
  const { menu, item } = menuFixture();
  dismissNavigationOnBlur(menu, item);
  assert.equal(menu.open, true);
  dismissNavigationOnBlur(menu, {});
  assert.equal(menu.open, false);
});

test("outside pointer dismissal does not swallow submenu activation or native events", async () => {
  const { installNavigationDismissal } = await import("../src/navigation.js");
  const { menu, item } = menuFixture();
  const doc = new EventTarget();
  const cleanup = installNavigationDismissal(menu, doc);
  const press = (target) => {
    const event = new Event("pointerdown", { cancelable: true });
    Object.defineProperty(event, "target", { value: target });
    doc.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  };
  press(item);
  dismissNavigationOnBlur(menu, null);
  assert.equal(menu.open, true);
  press({});
  assert.equal(menu.open, false);
  cleanup();
  menu.open = true;
  press({});
  assert.equal(menu.open, true, "dismissal listener cleans up on unmount");
});

test("every navigation destination round-trips through hashes and browser history", async () => {
  const { navigationFromHash, navigationHash } =
    await import("../src/navigation.js");
  for (const page of ["battle", "map", "cards", "guide"])
    assert.deepEqual(navigationFromHash(navigationHash(page)), {
      page,
      modal: null,
    });
  for (const modal of ["roster", "deck", "inventory"]) {
    assert.deepEqual(navigationFromHash(navigationHash("map", modal)), {
      page: "battle",
      modal,
    });
    assert.deepEqual(navigationFromHash(navigationHash("map", modal), "map"), {
      page: "map",
      modal,
    });
  }
  assert.deepEqual(navigationFromHash("#missing", "cards"), {
    page: "battle",
    modal: null,
  });
  assert.deepEqual(navigationFromHash("#roster", "invalid"), {
    page: "battle",
    modal: "roster",
  });
  assert.equal(navigationHash("invalid"), "");
});
