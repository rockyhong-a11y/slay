# Five cartoon fighters — verification

The five supplied references were inspected and used for newly generated cel-shaded full-body art. Each new full-body render then served as the reference for a separately generated six-part transparent animation atlas. Production exports and the measured part hierarchy are in `public/assets/fighters/`.

| Fighter  | Reference identity                                                      | Strategy                                        |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| VIPER    | Blonde twin braids, red beret/guards, emerald bodysuit                  | Weak/vulnerable setup, follow-up damage         |
| EMBER    | Wavy brunette hair, warm complexion, muscular arms, black/red/gold gear | Skill-driven heat, calm and low-health comeback |
| VALKYRIE | Blonde bob, blue eyes, navy gear, white wraps                           | Guard retention and grappling                   |
| NOVA     | Long black hair, dark gear and red/steel guards                         | Zero-cost draw and card cycling                 |
| RAVEN    | Crimson hair, side fringe, black top and navy leggings                  | Opening damage and attack combos                |

Exact prompts and input/output provenance: `cartoon-fighter-prompts.json` and `cartoon-puppet-prompts.json`. Generation used the built-in image_gen tool. Pillow was used only for alpha inspection, geometric measurements, resizing and WebP export. Source pixels were not repainted or background-removed by scripts. Where atlas rectangles overlap, `sourceClip` metadata excludes neighboring pieces at runtime.

## Automated verification

- `npm test`: 82 passed, including public-action eight-floor victories for all five wrestlers.
- Six distinct real atlas pieces per fighter, valid hierarchy, nonempty alpha sources, measured face coordinates and runtime clipping.
- Actual glove direction in all five authored atlases, mirrored enemy direction, repeated hit IDs, shortened casts and cancellation after hidden/offscreen/modal pauses.
- Portrait camera follows transformed heads in all six states, both orientations and mobile/desktop framing.
- One shared RAF for cards and fighters, motion-off/reduced motion, observer disposal, delayed atlas loading and no duplicate full-body ghost behind the layers.

## Browser verification

- All five fighters visibly assemble from six pieces; roster role filters, exact eleven-card decks and preview/back/new-run actions work.
- Full-body and face previews visibly change between normal, excited, fiery, frustrated, tired and groggy states.
- Desktop and 375px arena: HUD, performers and captions occupy separate regions. Card casts visibly show performers beside the card illustration.
- 320px roster and condition preview: no page horizontal overflow; facial portrait and state title stack in the narrow caption column.
- Global illustration motion toggle stops complete composed poses and resumes animation.

The character renderer is a custom hierarchical 2D puppet implementation. It is not a native Live2D Cubism `.moc3` model. The original eighteen photographic character/pose files remain as historical source material and are not the active character art.
