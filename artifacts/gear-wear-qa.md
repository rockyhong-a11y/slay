# Battle gear wear — 2026-10-07

## Scope and rendering

- Ten actors: Raven, Valkyrie, Nova, Viper, Ember, Atlas, Seraph, Lynx, Onyx, Tempest.
- Cartoon: 60 complete state illustrations, 240 authored equipment patches.
- SD: all 30 complete sprite frames, using each exact manifest crop.
- Level 0 normal/excited; 1 fiery surface wear; 2 frustrated fabric openings; 3 tired wider tears and loose fasteners; 4 groggy broken pads and separated strap fragments.
- Skin openings are confined to knee-pad fabric, outer lower-thigh leggings, or SD wrist wraps. No torso/pelvis openings. Source art remains intact. No limb splitting, regeneration, body-part swapping, Blender or Higgsfield generation in this change.
- SVG tears, frayed edges, material shading, loose straps and small separated fragments use actor palettes and source-alpha masks. They inherit the same sprite fit, crop, mirror and action transforms. No additional perpetual animation loop or new bitmap download.
- `gearWearLevel` stores the peak independently for each fighter. Healing cannot repair clothing mid-match. Next match resets history to its initial condition; save/load preserves peaks. Existing run migration adds only cosmetic fields.
- `ConditionGuide` has a local Cartoon/SD switch. Clicking a condition shows its baseline damage without mutating the match; opening from a match initially shows the retained live level.

## Verification

- `npm test`: **312 passing tests**. Added threshold/peak/reset/save tests, all-pose geometry/registration checks, SD material checks, and actual server rendering for 240 actor/style/condition combinations with two instances to validate unique SVG masks.
- `BASE_PATH=/slay/ npm run build`: passed; `git diff --check`: clean.
- All 60 cartoon source poses and all 30 SD frames inspected. Cartoon patch footprints checked against original alpha. Enlarged primary pad tears for mobile display; Viper groggy and Raven tired patches clear the hands.
- Real Codex in-app browser, isolated DEV combat fixtures: **80 condition previews** (10 actors × 2 styles × 4 damage levels). All expected actor IDs, level labels and overlays present. No overlap between character and copy columns. Raw results: `gear-wear-browser-results.json`.
- Viper SD elbow strike and powerbomb resolve normally. Powerbomb cinematic shows Viper attack frame 1 with level 4 retained; enemy keeps its own level.
- Tempest recovery: medical icepack raises HP 15→33/76, condition groggy→tired while gear remains level 4. Switching from SD to cartoon retains level 4.
- Mobile portrait 390×844: state preview and battle visible. Landscape 844×390: arena bounds (6,38)–(418,384), hand bounds (426,71)–(838,384), document size exactly 844×390. No page overflow.
- Browser console warning/error list empty at final local inspection.
- Screenshots: `gear-wear-sd-preview.jpg`, `gear-wear-landscape.jpg`.

## Limits

Technique cards with their own fixed pair illustration retain their original card artwork. Wear follows the chosen live fighter sprites, including SD character-based cinematics. iOS hardware was not directly connected; mobile dimensions were checked in the in-app browser.
