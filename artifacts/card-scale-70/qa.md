# Compact combat cards / larger arena

Combat card width and height are 70% of the previous dimensions. Deck and
encyclopedia cards keep their existing size. The selected card's complete
effect appears above the hand; cost, art, and technique name stay on the card.

## Measured browser layout

| Viewport | Card before → after | Arena before → after |
| --- | --- | --- |
| 390 × 844 | 140 × 208 → 98 × 145.6 | 374 × 417 → 374 × 471.6 |
| 360 × 640 | 130 × 194 → 91 × 135.8 | 348 × 229 → 348 × 279.4 |
| 844 × 390 | 132 × 193 → 92.4 × 135.1 | 412 × 346 → 532.8 × 346 |
| 1366 × 900 | 148 × 218 → 103.6 × 152.6 | 1266 × 503 → 1266 × 568.4 |

Measurements waited for the application's viewport-height variable to match
each test size. Detailed DOM bounds are in `layout-metrics.json`.

## Validation

- Full automated suite: 316 tests passed; production build passed.
- 390 × 844: double-tapping Elbow Strike displayed confirmation, consumed one
  action point, dealt exactly 6 damage, and removed exactly one hand card.
- 667 × 375: dragging across a ten-card hand selected the last card and updated
  the full effect text. Turn, supply, deck and discard controls fit on screen.
- 568 × 320: ten-card SD utility hand with Calf Slicer selected; full three-line
  effect text, raised card and bottom controls were visible without overlap.
- A temporary DEV fixture also exercised the longest upgraded card copy,
  Pop-up Powerbomb / Catch and Brace, at 568 × 320. The fan now fits the space
  remaining below the full description and keeps a 6px gap above controls;
  card height can shrink slightly further on these exceptionally short screens.
  The temporary fixture was removed after verification.
- Original and SD fighters visually checked in the enlarged arena. SD geometry
  tests cover whole rotated/elevated sprites for every card and pose; replay
  framing is unchanged.
- Browser console: no warnings or errors during local verification.

Screenshots: `portrait.jpg`, `landscape.jpg`, `landscape-sd.jpg`.
