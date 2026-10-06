# SD 2D replacement — asset and geometry verification, 2026-10-07

This document records the replacement of the experimental Three.js/Blender SD presentation with illustrated SD characters. The asset geometry audit below is followed by the completed integration checks and production build results from the main task.

## Requested rendering contract

- Original mode retains the existing complete 2D character illustrations.
- SD mode uses new cartoon SD illustrations with recognizable hair, costume, skin palette and adult athlete identity. Ten PNG sheets containing three complete poses each are present.
- Animation moves or exchanges complete illustrated sprites. It must not cut and recombine a head, arms or other body parts.
- The 3D renderer is withdrawn from the current source and package dependency list. Previously exported `public/assets/sd/*.glb` models and their rendered WebP thumbnails are historical outputs, not evidence of the new 2D implementation. The final production bundle check is recorded below.
- Changing presentation must preserve the active run, selected wrestler, deck and resolved combat results.

## Confirmed source inventory

All ten original normal images below exist. Each actor also has `excited`, `fiery`, `frustrated`, `tired` and `groggy` images at the same location, for 60 complete state images. Each has a complete-image loading fallback at `public/assets/fighters/{id}.webp`.

| Actor    | Current normal reference                             | Identity to preserve                                                                                                             |
| -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Raven    | `public/assets/fighters/states/raven-normal.webp`    | Long crimson hair, pale skin, sharp gray eyes, black top, navy full-length leggings and crimson-trim boots.                      |
| Valkyrie | `public/assets/fighters/states/valkyrie-normal.webp` | Blonde jaw-length bob, blue eyes, powerful shoulders, navy/white gear, white hand wraps and navy/white boots.                    |
| Nova     | `public/assets/fighters/states/nova-normal.webp`     | Long dark hair and side fringe, brown eyes, current cartoon face, black/teal gear, red/silver protective pads and black boots.   |
| Viper    | `public/assets/fighters/states/viper-normal.webp`    | Long blonde twin braids, blue eyes, emerald high-neck gear, dark knee pads and red boots; no beret or gauntlets.                 |
| Ember    | `public/assets/fighters/states/ember-normal.webp`    | Wavy brunette hair, warm olive skin, strong arms, black/red/gold gear, gold waist accent and black/gold boots.                   |
| Atlas    | `public/assets/fighters/states/atlas-normal.webp`    | Copper pixie hair, amber eyes, tan skin, broad muscular build and orange/charcoal gear.                                          |
| Seraph   | `public/assets/fighters/states/seraph-normal.webp`   | Platinum high ponytail, gray-blue eyes, fair warm skin and ivory/cobalt gear.                                                    |
| Lynx     | `public/assets/fighters/states/lynx-normal.webp`     | Silver asymmetric bob, green eyes, olive skin, plum/charcoal high-neck top and matching gear.                                    |
| Tempest  | `public/assets/fighters/states/tempest-normal.webp`  | Navy high ponytail, brown eyes, warm brown skin and turquoise/charcoal lightning-pattern gear.                                   |
| Onyx     | `public/assets/fighters/states/onyx-normal.webp`     | Thick dark-brown braided high ponytail, violet-gray eyes, deep brown skin, black/violet/silver gear and short fingerless gloves. |

The old `artifacts/cartoon-fighter-prompts.json` predates Viper's beret/gauntlet removal. The currently shipped normal image is the reference of record. Some original generation prompts also differ from the actual final glove designs; preserve the current image rather than reintroducing obsolete prompt details.

Original references were checked against `artifacts/expanded-fighter-state-gallery.jpg`; Nova, Atlas, Tempest and Onyx were additionally opened directly from the current normal WebP files.

## Existing artwork integration points

- `src/presentation.js` — `fighterPoseArt(actor, condition)` selects the complete state image.
- `src/CombatPresentation.jsx` — original-mode `FighterSprite` renders combatants; `ConditionGuide` renders the full figure and a face crop from that same image. Original-mode technique scenes use separate card illustrations via `cue.art`; SD mode renders two complete illustrated sprites.
- `src/Roster.jsx` — original roster portraits use the normal complete image.
- `src/main.jsx` — player HUD portrait and the two arena combatants; modal entry supplies the state-guide character and condition.
- `src/Artwork.jsx` — common loading fallback, whole-image mirroring, original portrait crop and optional wear registration.

## Skin and warm-effects verification

Command run during this audit:

```sh
node --test test/fighter-wear.test.mjs test/technique-effects.test.mjs
```

Result: **28 passed, 0 failed**. This covers all 60 original pose anchors, damage thresholds and healing, matching portrait/mirror transforms, skin-local transparent sweat beads and narrow wet streaks, stronger exertion sheen, all 50 card effect profiles, resolved damage/guard behavior, contact timing, and warm effect colors without electric arcs, magic rings or floor halos.

No unfinished source work was found in the current original-character wear or warm-effects implementation during this review. Healthy original characters retain a restrained sheen without sweat or injuries. Original-mode wear is calibrated to the original adult-proportion art, with a whole-image alpha mask.

**SD registration constraint:** `fighter-wear.js` recognizes only `fighters/states/{actor}-{condition}.webp`, and `portraits.json` contains original-proportion face crops. Those coordinates must not be reused on the new SD figures. The SD artwork implementer confirmed that the separate `SDArtwork` component will not call the original wear or crop logic. SD-specific sweat/injury registration has not been verified or implemented as part of this audit.

The earlier `artifacts/condition-arcade-qa.md` describes the initial arcade release, including cyan effects that have since been removed. Its captures and earlier verification counts are historical; they do not document the current warm-effects revision or the new SD 2D art.

## SD alpha inspection and crop manifest

`tools/inspect-sd-atlas.py` opens the ten original `public/assets/sd2d/{actor}.png` files for reading, measures alpha, and writes only JSON. It contains no image-save or pixel-edit step. Every file is 1774 × 887 RGBA. The SHA-256 of each source is checked before/after inspection and recorded in `artifacts/sd2d-atlas-qa.json`.

The separator search examines ±10% of the source width around the one-third and two-thirds positions. It chooses the midpoint of a minimum-occupancy column interval, using alpha > 32 as foreground. Every delivered sheet has two completely foreground-free valleys and three major silhouette bands. Each whole-figure bounding box receives 3 pixels of padding clamped to its own region; no box overlaps its neighbor or escapes the source canvas.

`public/assets/sd2d/manifest.json` contains the exact contract consumed by CSS artwork rendering:

```json
{
  "raven": {
    "width": 1774,
    "height": 887,
    "frames": [
      { "x": 17, "y": 106, "width": 541, "height": 725 },
      { "x": 581, "y": 108, "width": 596, "height": 723 },
      { "x": 1219, "y": 113, "width": 538, "height": 718 }
    ]
  }
}
```

Frame order is idle / attack / hurt. Shared maximum frame width/height establish one pixel scale per actor across all three poses, with a common bottom baseline. CSS draws only the measured complete-pose rectangle; the PNG strip remains intact.

Missing or invalid exact metadata must show the complete original illustration fallback. Source review caught a temporary equal-third fallback that would cut 51 pixels off Valkyrie's attacking pose and include neighboring Ember pixels. `preloadSDArtwork` now rejects inexact metadata and clears the failed request cache instead of displaying that incomplete SD crop.

Measured result: **10 actors, 30 nonempty poses, 0 invalid bounds, 0 strong foreground pixels excluded from crops, 0 strong silhouette pixels touching the source canvas edges.** Fully transparent background occupies 44.3–67.8% of the sheets. Low-alpha edge fringe remains on some source canvases and is explicitly reported rather than mislabeled as a clipped body: Seraph top max alpha 6, Valkyrie top 1/bottom 5, Viper left 9/right 10.

The first Nova sheet had 84 strong-alpha pixels on its right border, including 75 with alpha ≥ 240. Direct inspection confirmed clipped hair on its third pose. The main task regenerated Nova with image generation; the replacement was remeasured and now has zero strong border contacts. No scripted image repair was performed.

Validation commands:

```sh
python3 tools/inspect-sd-atlas.py --check
python3 test/test_sd_atlas.py
node --test test/sd-artwork.test.mjs
node --test test/static-art.test.mjs test/sd-artwork.test.mjs test/sd-combat.test.mjs
```

- Read-only manifest recheck: passed for all ten current PNGs.
- Python alpha-buffer tests: **4 passed**. Uneven transparent valleys, complete-frame padding, low-alpha fringe versus actual border contact, empty/opaque sheets, bounds and overlap rejection.
- Node sprite geometry tests: **5 passed**. Actual source hashes/RGBA dimensions and thirty registered frames, exact CSS crop offsets, common pixel scale and boot baseline, finite fallbacks, and all 50 card replays sampled at 101 points with all ten shared-ratio pairings, four viewport sizes and both arena/cinematic framing.
- Combined SD geometry, choreography and architecture checks: **21 passed**. The choreography suite also verifies mat clearance for measured wide sprite ratios and mirrored attacks. The architecture check continues to prohibit canvas/Three.js/GLB/obsolete part rigs across the reachable application graph; original artwork has no RAF loop. Only the finite SD whole-sprite stage is allowed RAF, with cue completion, pause, visibility, reduced-motion and cleanup guards.

## Generation provider limitation

The main task confirmed that Higgsfield `get_preferences`, `models_get` and cost estimation succeeded. Its image-generation request alone was rejected with the exact provider message **"Requires basic plan or higher."** This is a generation-plan restriction, not a failed connection or an assertion that every Higgsfield capability is unavailable. No SD image in this revision is attributed to Higgsfield. Final source/job provenance is maintained by the generating task.

## Completed integration checks

The main task used native Safari Responsive Design Mode at 393 × 852 portrait and 844 × 390 landscape, plus a desktop viewport. This was desktop Safari emulation, not a physical iPhone test. Dev-only QA runs were used, without writing the test run into the production save slot.

- Viewed the generated ten-character sheets and all thirty complete poses. The roster exposes all ten SD identities. In-game visual checks included Raven, Nova and Viper, with Viper's bare head and hands preserved.
- Confirmed the complete arena, both fighters, overlapping hand and turn controls in portrait and landscape. Fixed the short-landscape card-description/footer overlap and the supply/pile label wrapping found during inspection.
- Played elbow strike, headlock, powerbomb and enemy attack in SD. Complete drawings change pose and move through the scene; warm contact feedback, damage and crowd reactions are present. Powerbomb resolved enemy HP 100 → 79 and energy 10 → 8; the next elbow resolved 79 → 73. Enemy attack resolved player HP 72 → 54 and continued to round two.
- Changed original → SD and back during the same battle: HP, hand and energy remained unchanged. Reloaded without the SD-forcing QA parameter and confirmed the saved SD preference. Roster and settings both expose the same toggle.
- Played the in-game concise presentation setting and confirmed input unlocked after completion. Restored full presentation afterward. OS reduced-motion behavior is covered by source/geometry tests; no OS preference was changed.
- All playback now shares `cue.startedAt`. Delayed mount, elapsed contacts, concise mode, event cleanup and exactly-once completion are tested in `test/cue-timing.test.mjs`. No claim of physical-device audio latency measurement is made.

Final commands and evidence:

- `npm test`: **259 passed, 0 failed**, including all existing game/run tests. [Full output](sd-2d-tests.txt).
- `python3 tools/inspect-sd-atlas.py --check`: all ten source files match the committed exact crop manifest and hashes.
- `python3 test/test_sd_atlas.py`: **4 passed**.
- `BASE_PATH=/slay/ npm run build`: success. [Build output](sd-2d-build.txt).
- Production audit: all ten built PNG hashes match the source; no `.glb` output, `WebGLRenderer`, `GLTFLoader`, old `assets/sd/` path or dev-only `qaPlayback`/`qaHand` references in the runtime JavaScript.
- `git diff --check`: passed.

SD animation deliberately uses three complete illustrated poses per character and continuous whole-sprite choreography, not limb rigs or a separately drawn frame for every wrestling technique. The updated original-mode sweat/injury overlay remains calibrated to all sixty original states; SD artwork has painted highlights but does not reuse the original injury coordinates.
