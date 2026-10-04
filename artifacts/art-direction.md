# SLAY art direction and provenance

The visual world is an original adult female professional wrestling league: a dark underground arena, crimson ring ropes, practical athletic costumes, strong silhouettes, and warm red / cool blue rim light. User-supplied references informed build, hairstyle, costume palette, and illustration mood. Original reference files are not distributed.

## Arena

Created procedurally in Blender 5.2.2 and rendered with Cycles. The editable scene is `artifacts/arena.blend`; `tools/render-arena.py` rebuilds it. The browser uses `public/assets/arena.webp`.

## Original wrestlers

Built with the imagegen image-generation tool. All characters are adults, all images use genuine RGBA transparency, and browser assets are optimized WebP at a maximum height of 1300 pixels.

- **RAVEN, 28:** Long crimson hair, powerful muscular build, black/crimson athletic wrestling top and shorts, knee pads, tall boots, raised fists; full body, three-quarter stance facing right.
- **VALKYRIE, 31:** Blonde bob, powerful grappler build, navy/cobalt and white wrestling gear, white wrist tape, knee pads and tall boots; full body, stance facing left.
- **NOVA, 26:** Long black hair, agile athletic build, black and teal professional wrestling gear, raised defensive stance; full body, stance facing left.

Shared generation direction: premium semi-realistic 2.5D character illustration, precise anatomy, fully clothed practical wrestling costume, warm red rim / cool front lighting, full head-to-boots framing, isolated transparent background, no scenery, text, logos, watermark, or existing franchise identity.

## Fighter conditions and pose provenance

Each wrestler has six presentation states: **normal, excited, fiery, frustrated, tired and groggy**. Normal reuses the original character asset. The other five states per wrestler add **15 independent transparent pose WebP assets**, each 867×1300 RGBA at quality 88, under `public/assets/poses/{wrestler}-{state}.webp`.

Built-in imagegen edits used each existing character as the identity reference. Face, hairstyle, body proportions, palette and painted style remain consistent. RAVEN's tired/groggy recovery cuts add black/crimson warm-up jacket and track-pants layers; the other poses retain their athletic wrestling gear. Selected PNG originals remain in ignored `artifacts/pose-sources/` files. Exact prompts, references, generated sources and final paths are recorded in [RAVEN](pose-art-raven.md), [VALKYRIE](pose-art-valkyrie.md) and [NOVA](pose-art-nova.md).

Health takes priority: at most 25% selects groggy, then at most 50% selects tired. Above 50%, stress 60+ selects frustrated, hype 6+ selects fiery, hype 3–5 selects excited, otherwise normal. Enemy weakness of 2+ can also select frustrated. The condition badge opens an interactive preview of all six poses, motion styles and thresholds without changing the run. See the [condition preview screenshot](slay-condition.jpg).

## Card illustrations

All 25 active cards now use independent, move-specific imagegen illustrations at `public/assets/cards/{card-id}.webp`. Every asset is 1024×683 WebP at quality 88. Strikes show the named elbow, shoulder, fist or boot contact; throws show waist locks, backward arches or shoulder carries; submissions show specific arm and head control. Defensive and support cards show guarding, breathing, crowd interaction and recovery. The nightmare has its own psychological scene.

The game, deck, rewards, encyclopedia and detail views share this asset mapping and contain the whole landscape composition. Classification color and text reinforce the physical technique rather than relying only on artwork.

Generation mode: built-in imagegen, one final image per card. Original PNG sources are preserved locally in ignored artifact files; optimized browser assets and complete prompt sets are versioned:

- [Strikes, aerial moves and finishers — 9 prompts](card-art-strikes.md)
- [Throws, submissions and defense — 8 prompts](card-art-holds.md)
- [Support, recovery and nightmare — 8 prompts](card-art-support.md)

The three initial generic card images remain as historical source assets and are no longer referenced by active card rendering.

## Live art rigs

The original **43 active WebP images** remain unchanged: 18 fighter/pose images and 25 card illustrations. Hand-authored landmarks in [`src/live-art-rigs.js`](../src/live-art-rigs.js) define each image's local head, hair, torso, limb and visible-eye regions. The renderer uses a custom WebGL 2D deformation mesh, with Canvas 2D fallback. This is a **Live2D-style custom rig**, not native Cubism `.moc3` model data or 3D skeletal animation.

Breathing, gaze, head movement, delayed hair/body motion and blinking operate inside those regions; ropes, crowd, planted feet and image boundaries stay pinned. Closed, obscured, profile and very small eyes omit painted blink masks. The same art component appears in fighters, avatars, roster selection, hand/deck/reward cards, encyclopedia/detail views and cinematics.

Pose changes crossfade smoothly while preserving the motion clock and easing condition parameters. A saved global **Illustration Motion On / Still** setting applies throughout the app. OS reduced motion suppresses spatial motion; offscreen art, art behind an open modal and hidden tabs pause rendering. The original image remains visible while its live renderer loads. Shared motion math and fit calculations are covered by the `npm test` suite.

## Card-art cinematics

All 25 dedicated card-art compositions now drive short 2D cinematic overlays. Strikes, aerial moves, throws, submissions, grapples, defense, tactics and nightmare use distinct motion paths and timing. Results come from actual before/after engine snapshots: damage and absorbed guard, healing, draw, energy, hype, stress and applied status effects. A serial input lock holds card-play and end-turn controls during the active cue.

Settings offers **Full / Concise** presentation. Concise keeps the same artwork and real outcomes with shorter timing; operating-system reduced-motion preferences suppress spatial motion. Reserved HUD, performer and caption regions keep text clear. Desktop cinematics place contained action art in the left 60% and vertically stacked title/outcomes in the right 40%; mobile uses art above separate caption rows and a 300px stage. Condition previews and roster cards also separate art from text. See the [cinematic screenshot](slay-cinematic.jpg) and [layout geometry checklist](arena-layout-checklist.md).

## Higgsfield attempt

Higgsfield was requested as part of the art workflow. Reference-upload calls did not return a confirmed result. A subsequent text-only image-generation call was interrupted after 400.9 seconds without a response or job ID; its submission outcome is unknown. No verified Higgsfield output is used in this build, and that unknown request was not resubmitted. Final assets were completed with imagegen.

## Fonts

All fonts are self-hosted. Do Hyeon gives Korean titles an angular sports headline; Teko carries scores, changing numerals and finisher/result headlines; Barlow Condensed handles wrestler names and English broadcast captions; Noto Sans KR keeps rules, effects and condition text readable. SIL Open Font License files are included for [Do Hyeon](../public/assets/licenses/DoHyeon-OFL.txt), [Teko](../public/assets/licenses/Teko-OFL.txt), [Barlow Condensed](../public/assets/licenses/BarlowCondensed-OFL.txt) and [Noto Sans KR](../public/assets/licenses/NotoSansKR-OFL.txt).
