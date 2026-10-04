# Arena layout and static-art checks

Run these checks from the app's current page after fonts and art have loaded. This checklist does not change the viewport, game state, animation, or DOM. Current browser verification is recorded in [cartoon fighter QA](cartoon-fighter-qa.md).

Use 320 × 740, 375 × 812, 768 × 1024, 1440 × 720, and 1440 × 900. Check the longest opponent name (`SCARLET VIPER`), three-digit guard, each condition, and a finisher with several outcomes. Repeat condition and roster dialogs on the narrowest viewport. Wait for self-hosted Do Hyeon, Teko, Barlow Condensed and Noto Sans KR before measuring.

- Both HUD rectangles end within the reserved HUD band. Fighter rectangles start below that band and end above the footer. Preserve the extra 10–12px for grounding and illustration framing.
- The round label sits in the horizontal gap between HUD columns.
- Each condition badge remains inside its HUD and uses one unbroken line. Guard and heat can wrap as complete items.
- Desktop cinematics have two columns: the two visible performers and action art share the left 60% of the whole lower stage; title and outcomes share a vertically centered stack in the right 40%. The untransformed art frame ends before the caption column.
- Mobile cinematics have three grid rows: art, title, outcomes. Their stage is 300px high. The art row begins below the HUD, ends before the title row and remains large enough to read the full technique; the outcomes row ends inside the arena. In both layouts, the completed image fills only its reserved art frame.
- Use `contain` for full action art and full fighter portraits. A transformed frame rectangle includes empty space around the contained artwork, so an animation's enlarged bounding box alone is not evidence of visible art crossing a caption. Verify the visible action during motion separately.
- In the condition preview and roster, artwork and text occupy different columns or rows. Portraits and buttons remain inside the card, with no negative text margin or `cover` crop.

Static-art behavior checks use 30 completed fighter-state images and 25 dedicated card images.

- Check fighters, avatars, roster, hand/deck/reward, encyclopedia/details and cinematics. Full-body and technique views use `contain`; face portraits intentionally crop the same completed illustration.
- Switch among all six conditions and compare the complete image with its face portrait. Health/pressure/heat priority must select the intended state; recovery must restore the appropriate pose.
- Once a selected state image has loaded, each artwork surface shows one complete illustration. No canvas or independently drawn face/part overlay should remain.
- Verify Full / Concise card-cast timing and operating-system reduced motion. Card and turn controls remain locked only for the current finite cue.
- Wait for state loading before collecting the probe. A temporary image fallback is permitted while the selected state downloads; the active image must eventually be complete with positive natural dimensions.

Read-only geometry probe (returns data and pass/fail flags; no page mutation):

```js
(() => {
  const rect = (element) => {
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
  };
  const inside = (child, parent, tolerance = 1) =>
    child &&
    parent &&
    child.left >= parent.left - tolerance &&
    child.right <= parent.right + tolerance &&
    child.top >= parent.top - tolerance &&
    child.bottom <= parent.bottom + tolerance;
  const separated = (a, b, tolerance = 1) =>
    a &&
    b &&
    (a.right <= b.left + tolerance ||
      b.right <= a.left + tolerance ||
      a.bottom <= b.top + tolerance ||
      b.bottom <= a.top + tolerance);
  const arena = document.querySelector(".arena");
  const arenaRect = rect(arena);
  const css = arena && getComputedStyle(arena);
  const hudBand = css
    ? parseFloat(css.getPropertyValue("--arena-hud-height"))
    : null;
  const footerBand = css
    ? parseFloat(css.getPropertyValue("--arena-footer-height"))
    : null;
  const hudBottom = arenaRect && arenaRect.top + arena.clientTop + hudBand;
  const stageBottom =
    arenaRect && arenaRect.bottom - arena.clientTop - footerBand;
  const huds = [...document.querySelectorAll(".arena > .fighter-hud")].map(
    (element) => {
      const bounds = rect(element);
      return {
        side: element.className,
        bounds,
        withinBand: inside(bounds, arenaRect) && bounds.bottom <= hudBottom + 1,
      };
    },
  );
  const fighters = [...document.querySelectorAll(".arena > .fighter")].map(
    (element) => {
      const bounds = rect(element);
      return {
        side: element.className,
        bounds,
        withinStage:
          bounds.top >= hudBottom && bounds.bottom <= stageBottom + 1,
      };
    },
  );
  const badges = [
    ...document.querySelectorAll(".arena .fighter-condition"),
  ].map((element) => ({
    label: element.textContent.trim(),
    withinHUD: inside(rect(element), rect(element.closest(".fighter-hud"))),
    noWrapping: getComputedStyle(element).whiteSpace === "nowrap",
  }));
  const scene = document.querySelector(".arena .technique-scene-visual");
  const frame = scene?.querySelector(".technique-art-frame");
  const copy = scene?.querySelector(".technique-scene-copy");
  const results = scene?.querySelector(".technique-results");
  const sceneColumns = scene
    ? getComputedStyle(scene).gridTemplateColumns.trim().split(/\s+/).length
    : 0;
  const desktopScene = sceneColumns === 2;
  const cinematic = scene && {
    grid: getComputedStyle(scene).display === "grid",
    columns: sceneColumns,
    artBelowHUD: frame.offsetTop >= hudBand,
    artSeparateFromCopy: desktopScene
      ? frame.offsetLeft + frame.offsetWidth <= copy.offsetLeft + 1
      : frame.offsetTop + frame.offsetHeight <= copy.offsetTop + 1,
    copyBeforeResults:
      copy.offsetTop + copy.offsetHeight <= results.offsetTop + 1,
    resultsWithinArena:
      results.offsetTop + results.offsetHeight <= scene.clientHeight + 1,
    artworkPresent: !!frame.querySelector(":scope > .artwork"),
    captionStackCentered: desktopScene
      ? Math.abs(
          (copy.offsetTop + results.offsetTop + results.offsetHeight) / 2 -
            (hudBand + scene.clientHeight) / 2,
        ) <= 2
      : null,
    containedSource: frame.querySelector("img")?.style.objectFit === "contain",
  };
  const preview = document.querySelector(".condition-preview");
  const previewSafe = preview
    ? separated(
        rect(preview.querySelector(":scope > .fighter")),
        rect(preview.querySelector(":scope > div:last-child")),
      )
    : null;
  const roster = [...document.querySelectorAll(".contender-card")].map(
    (card) => ({
      name: card.querySelector("h3")?.textContent,
      artAndTextSeparated: separated(
        rect(card.querySelector(".contender-stage")),
        rect(card.querySelector(".contender-copy")),
      ),
      buttonInside: inside(rect(card.querySelector("button")), rect(card)),
      artInside: inside(
        rect(card.querySelector(".contender-stage")),
        rect(card),
      ),
    }),
  );
  const artwork = [...document.querySelectorAll(".artwork")].map((element) => {
    const image = [...element.querySelectorAll(":scope > img")].find(
      (candidate) => !candidate.classList.contains("artwork-loading-fallback"),
    );
    return {
      art: element.dataset.art,
      condition: element.dataset.condition,
      complete: !!image?.complete && image.naturalWidth > 0,
      source: image?.currentSrc,
      naturalSize: image ? [image.naturalWidth, image.naturalHeight] : null,
      noCanvas: !element.querySelector("canvas"),
      bounds: rect(element),
    };
  });
  return {
    viewport: { width: innerWidth, height: innerHeight },
    arena: arenaRect,
    hudBand,
    footerBand,
    huds,
    fighters,
    badges,
    cinematic,
    previewSafe,
    roster,
    artwork,
  };
})();
```

The regression suite checks the 30 state-image mappings and files, state priority, recovery after engine actions, unchanged card-cast outcomes and the absence of reachable canvas/rig code. These checks complement image and geometry inspection; they do not establish visual likeness or browser layout. Current execution and browser results are recorded separately in [static fighter QA](cartoon-fighter-qa.md).
