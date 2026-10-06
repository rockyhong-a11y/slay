# Fighter condition wear — 2026-10-06

The ten wrestlers and their six complete state illustrations now support a runtime cartoon wear layer. This is authored vector presentation code; the source WebP files remain complete, and no face, arm, or body raster is cut apart or recombined.

## Art direction

- Sweat (revised): transparent microbeads with a warm white upper reflection and faint lower refraction edge. No cyan fill, pointed cartoon teardrop, luminous halo, or falling particle. Narrow curved wet streaks appear only under medium/heavy exertion and stop on the cheek or upper arm.
- Skin sheen (revised): neutral/warm translucent film and curved specular highlights on the cheeks and exposed shoulder/upper-arm surfaces. A slight healthy sheen is present even at rest. It strengthens with exertion while retaining the underlying skin color; localized warm reflections preserve the darker skin palettes. Only catchlight intensity varies slowly (6.4 seconds, 94–100% of the selected opacity). Reduced-motion users receive static reflections.
- Abrasions: short asymmetric charcoal-red hatching, a subdued red scuff, and a thin skin-colored edge.
- Bruises: bounded soft mauve patches, with a warmer palette on Onyx and Tempest.
- Blood: a small eyebrow trace below 25% HP, with a second small lip trace at 10% HP or below. No open wounds or gore.

Full HP and normal state are free of sweat beads and injuries, with only a slight skin sheen. Excited / fiery / frustrated states show exertion sweat. Damage adds abrasions at 70%, bruising at 50%, and blood at 25%. Guide previews use representative health values; real match vitals override those injury defaults. Healing clears injury marks and reduces wetness automatically without adding save data.

Moisture levels 0–3 use film opacity 0.14 / 0.23 / 0.34 / 0.44 and specular opacity 0.25 / 0.36 / 0.49 / 0.62. Each local skin surface receives 0 / 2 / 4 / 6 microbeads and 0 / 0 / 1 / 2 short streaks. Facial beads are smaller than shoulder beads. Streak widths stay at or below 2.3 pixels in the 1000 × 1500 source coordinate space; lengths stay at or below 41 pixels. Existing bruises, cuts and blood are painted above the sheen so they remain legible.

## Registration and rendering

All 60 `fighters/states/{actor}-{condition}.webp` files use their `portraits.json` centre. The face skin anchor has a checked per-character/per-pose correction where the portrait framing differs from the nose/cheek plane. Atlas and Lynx's tired/groggy crop centres were corrected during browser review: the old Atlas tired crop cut off half the face, while other leaning crops overemphasized the neck. Their wear offsets were compensated so this framing fix keeps the actual full-body injury coordinates unchanged.

The complete ten-character groggy set, all ten tired heads, and representative active poses were visually inspected from local originals. Bare shoulder points were checked against outfit and hair placement. A mask references the exact complete image alpha, so decorative marks cannot spill outside the original silhouette. The overlay waits for that image and its anchor data before appearing; it never attaches to the loading fallback.

`Artwork` measures its content rectangle and gives the overlay the same contain/cover/portrait transform as the image. Its existing outer horizontal flip mirrors both layers together, once. The image itself and all existing loading / fallback behavior remain intact.

## API

```jsx
<Artwork
  art={fighterPoseArt(actorId, condition)}
  vitals={{ hp, maxHp, stress, hype }}
  portrait={false}
  mirrored={false}
/>
```

`vitals` is optional for state guides; the state in the illustration filename chooses the pose and wear preview. Only known fighter state illustrations receive an overlay. Card art, scenery, equipment and unknown paths are unaffected.

## Verification

`node --test test/fighter-wear.test.mjs`: twelve checks cover all 60 assets/anchors, health thresholds, exertion without damage, healing and invalid inputs, non-fighter exclusion, contain/cover geometry, all portrait crop projections and enemy mirroring, and the inspected leaning-pose corrections. The moisture revision adds checks for monotonic wetness strength, healthy sheen without sweat, bounded invalid inputs, skin-local microbead/streak geometry, and preservation of all 60 projections.

Initial injury-release browser validation used an isolated localhost QA tab at 1280 × 720 without changing the viewport or production progress. All ten groggy condition previews were inspected as complete figures and cropped portraits; Atlas and Lynx tired previews were also checked. Browser warning/error logs were empty. Those initial proof screenshots are `artifacts/fighter-wear-{actor}-desktop.png` for all ten actors. The realistic-moisture revision retains those calibrated anchors and is visually verified by the main task. At normal/full HP the SVG now remains for healthy sheen, while `data-wear-sweat`, abrasion, bruise and blood are all zero.

An additional source-alpha sampling pass checked the face, cheek, sweat, brow and both shoulder anchors across all 60 original WebP files. This caught narrower, three-quarter faces on Onyx and raised-arm shoulder gaps on Viper; their coordinate maps were adjusted before browser review. A standalone SVG inspection sheet was also rendered from the actual React component into `/tmp/slay-wear-proof/wear-review.svg`; it is diagnostic output, not an edited game asset.
