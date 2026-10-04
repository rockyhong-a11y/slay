# Static fighter states — verification

This revision replaces continuous puppet/mesh illustration rendering with 30 complete state illustrations. Five cartoon fighters each have normal, excited, fiery, frustrated, tired and groggy images under `public/assets/fighters/states/`. Card art, gameplay rules, saved runs and finite card-cast cinematics remain.

## Automated coverage

The current regression suite checks:

- Exact 25% and 50% health boundaries for all five fighters; health takes priority over pressure, which takes priority over heat.
- Recovery to the appropriate state after real healing, calming and finisher heat spending, plus the enemy weakness condition.
- Thirty distinct state paths, real WebP headers and unique file content; string and state-object inputs share the same mapping, with safe actor/state fallbacks.
- No canvas drawing or app-owned continuous illustration frame loop in the app's reachable local source graph.
- All 25 card illustration files and their real engine-derived cinematic outcomes, including blocking, overkill, capped healing, passive draws and mental breakdown.
- Five distinct deck strategies, JSON save/load, once-per-turn passives and eight-floor victories for all five fighters on two deterministic seeds.

## Completed verification

- The final `npm test` run passed **45 / 45 tests** with all 30 state files present.
- The final `npm run build` completed successfully in **6.35 seconds**.
- The 30 active state assets are 1000×1500 RGBA WebP with distinct content. Every file's dimensions, alpha mode and SHA-256 match the source recorded in the Blender gallery facts.
- `portraits.json` contains 30 valid face crop entries. Full-body and portrait views resolve the same state illustration; portraits crop that image rather than assembling a separate face.
- All 30 completed illustrations were visually reviewed together in the [Blender gallery render](fighter-state-gallery.jpg).

## Browser verification

At **393×852**, the condition preview was opened for all five fighters and all six state buttons were clicked. The [30-state browser record](fighter-state-browser-checks.json) confirms every selected illustration loaded, the portrait used the same art path, there were zero loading fallbacks and zero canvases, and no recorded text overlap or horizontal page overflow. The loaded images had a natural width of 1000 pixels.

At **320×720**, EMBER's groggy preview was also inspected: the portrait showed the intended face, with zero horizontal overflow, zero text overlap and zero canvases.

At **375×812** and **1280×720**, VIPER's fiery preview was reviewed in mobile and desktop layouts. Both showed a connected face and complete body, with zero overlap, zero horizontal overflow and zero canvases. The Korean state caption wraps within its column. The [current mobile screenshot](slay-state-viper-mobile.jpg) and [desktop screenshot](slay-state-viper-desktop.jpg) record the static-image version; earlier puppet screenshots are historical.

The **1280×720 arena** was also checked: both fighters loaded their exact selected complete state images at a natural width of 1000 pixels, with one image per fighter, zero canvases and zero horizontal overflow.

## Production evidence

The state set was generated through 30 individual built-in image-generation edit calls. Exact input references, prompts and output paths are in [four normal edits](fighter-state-prompts.json), [twenty variants](fighter-state-variant-prompts.json) and [six Viper states](viper-state-prompts.json). Source PNGs are preserved locally in ignored `artifacts/fighter-state-sources/`.

The editable [Blender review scene](fighter-state-gallery.blend), [facts](fighter-state-gallery-facts.json) and [script](../tools/build-state-gallery.py) form a static gallery: 30 single-image planes, four vertices and one face each, full-image UVs, matching packed/source hashes, no armatures or animation. It reviews complete 2D images and is not a character-generation rig.

## Layout and interaction checklist

The [arena checklist](arena-layout-checklist.md) contains a read-only DOM geometry/image probe. It covers HUD, performers, captions, condition previews, roster, card details and finite card-cast transitions at narrow and wide widths. Automated image signatures and source checks establish file and integration contracts, not visual likeness or every possible browser layout.
