const TAP_INTERVAL = 350;
const TAP_DISTANCE = 24;
const DRAG_DISTANCE = 10;

function elementFor(target) {
  return target?.nodeType === 3 ? target.parentElement : target;
}

function tapZone(target, root) {
  const element = elementFor(target);
  return (
    element?.closest?.(
      "button, a, input, select, textarea, summary, [role='button'], [data-double-tap]",
    ) || root
  );
}

export function isRepeatTap(previous, current) {
  return !!(
    previous &&
    current.time > previous.time &&
    current.time - previous.time <= TAP_INTERVAL &&
    current.zone === previous.zone &&
    Math.hypot(current.x - previous.x, current.y - previous.y) <= TAP_DISTANCE
  );
}

/** Only actual internal scrolling can consume a one-finger pan. */
export function canScrollInsideApp(target, deltaX, deltaY, root, styleFor) {
  let element = elementFor(target);
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
  const delta = horizontal ? deltaX : deltaY;
  if (!delta) return true;

  while (element && element !== root) {
    const style = styleFor(element);
    const overflow = horizontal ? style.overflowX : style.overflowY;
    if (overflow === "auto" || overflow === "scroll") {
      const extent = horizontal ? element.scrollWidth : element.scrollHeight;
      const visible = horizontal ? element.clientWidth : element.clientHeight;
      const offset = horizontal ? element.scrollLeft : element.scrollTop;
      if (
        extent > visible + 1 &&
        ((delta > 0 && offset > 0) ||
          (delta < 0 && offset + visible < extent - 1))
      )
        return true;
    }
    element = element.parentElement;
  }
  return false;
}

/**
 * CSS handles modern browsers; cancel native defaults for Safari fallbacks.
 * Events still propagate to game pointer handlers, including double taps.
 * https://webkit.org/blog/5610/more-responsive-tapping-on-ios/
 */
export function installMobileInteractionGuard(doc = globalThis.document) {
  const root = doc?.getElementById("root");
  const view = doc?.defaultView;
  if (!root || !view) return () => {};
  const viewportStyle = doc.documentElement.style;
  const previousHeight = viewportStyle.getPropertyValue(
    "--app-viewport-height",
  );

  let gesture = null;
  let lastTap = null;
  const surfaceFor = (target) => {
    const element = elementFor(target);
    if (root.contains(element)) return root;
    // TechniqueScene is a React-owned portal directly beneath body.
    const scene = element?.closest?.(".technique-scene");
    return scene?.parentElement === doc.body ? scene : null;
  };
  const cancelNative = (event) => {
    if (surfaceFor(event.target) && event.cancelable) event.preventDefault();
  };

  const touchStart = (event) => {
    const surface = surfaceFor(event.target);
    if (!surface || event.touches.length !== 1) {
      gesture = null;
      lastTap = null;
      return;
    }
    const touch = event.touches[0];
    gesture = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      previousX: touch.clientX,
      previousY: touch.clientY,
      time: event.timeStamp,
      zone: tapZone(event.target, surface),
      surface,
      dragged: false,
      axis: null,
    };
  };

  const touchMove = (event) => {
    if (!gesture || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (touch.identifier !== gesture.id) return;
    const deltaX = touch.clientX - gesture.previousX;
    const deltaY = touch.clientY - gesture.previousY;
    gesture.previousX = touch.clientX;
    gesture.previousY = touch.clientY;
    const travelledX = touch.clientX - gesture.x;
    const travelledY = touch.clientY - gesture.y;
    if (Math.hypot(travelledX, travelledY) >= DRAG_DISTANCE) {
      gesture.dragged = true;
      lastTap = null;
      gesture.axis ||= Math.abs(travelledX) > Math.abs(travelledY) ? "x" : "y";
    }
    // Safari may keep touchmove cancellable after a pan starts. Lock its axis
    // so a tiny sideways jitter cannot interrupt a valid vertical scroll.
    if (!gesture.axis) return;
    if (
      event.cancelable &&
      !canScrollInsideApp(
        event.target,
        gesture.axis === "x" ? deltaX : 0,
        gesture.axis === "y" ? deltaY : 0,
        gesture.surface,
        (element) => view.getComputedStyle(element),
      )
    )
      event.preventDefault();
  };

  const touchEnd = (event) => {
    const touch = Array.from(event.changedTouches).find(
      (entry) => entry.identifier === gesture?.id,
    );
    if (!gesture || !touch) return;
    const ended = gesture;
    gesture = null;
    if (
      ended.dragged ||
      event.touches.length ||
      event.timeStamp - ended.time > TAP_INTERVAL ||
      Math.hypot(touch.clientX - ended.x, touch.clientY - ended.y) >
        DRAG_DISTANCE
    ) {
      lastTap = null;
      return;
    }
    const current = {
      x: touch.clientX,
      y: touch.clientY,
      time: event.timeStamp,
      zone: ended.zone,
    };
    if (isRepeatTap(lastTap, current)) {
      if (event.cancelable) event.preventDefault();
      lastTap = null;
    } else lastTap = current;
  };

  const touchCancel = () => {
    gesture = null;
    lastTap = null;
  };

  const viewport = view.visualViewport;
  const updateHeight = () => {
    // Pinch zoom remains available; its visual viewport must not resize layout.
    const height =
      viewport && Math.abs(viewport.scale - 1) < 0.01
        ? viewport.height
        : view.innerHeight;
    if (Number.isFinite(height) && height > 0)
      viewportStyle.setProperty("--app-viewport-height", `${height}px`);
  };

  const captured = { capture: true, passive: false };
  const listeners = [
    ["contextmenu", cancelNative],
    ["selectstart", cancelNative],
    ["dragstart", cancelNative],
    ["dblclick", cancelNative],
    ["touchstart", touchStart],
    ["touchmove", touchMove],
    ["touchend", touchEnd],
    ["touchcancel", touchCancel],
  ];
  for (const [name, listener] of listeners)
    doc.addEventListener(name, listener, captured);
  view.addEventListener("resize", updateHeight);
  viewport?.addEventListener("resize", updateHeight);
  updateHeight();

  return () => {
    for (const [name, listener] of listeners)
      doc.removeEventListener(name, listener, captured);
    view.removeEventListener("resize", updateHeight);
    viewport?.removeEventListener("resize", updateHeight);
    if (previousHeight)
      viewportStyle.setProperty("--app-viewport-height", previousHeight);
    else viewportStyle.removeProperty("--app-viewport-height");
  };
}
