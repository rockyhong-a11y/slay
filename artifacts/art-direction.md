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

## Card illustrations

All 25 active cards now use independent, move-specific imagegen illustrations at `public/assets/cards/{card-id}.webp`. Every asset is 1024×683 WebP at quality 88. Strikes show the named elbow, shoulder, fist or boot contact; throws show waist locks, backward arches or shoulder carries; submissions show specific arm and head control. Defensive and support cards show guarding, breathing, crowd interaction and recovery. The nightmare has its own psychological scene.

The game, deck and rewards use this same asset mapping. The encyclopedia renders the whole landscape composition and offers a larger, uncropped technique image in each detail view. Classification color and text reinforce the physical technique rather than relying only on artwork.

Generation mode: built-in imagegen, one final image per card. Original PNG sources are preserved locally in ignored artifact files; optimized browser assets and complete prompt sets are versioned:

- [Strikes, aerial moves and finishers — 9 prompts](card-art-strikes.md)
- [Throws, submissions and defense — 8 prompts](card-art-holds.md)
- [Support, recovery and nightmare — 8 prompts](card-art-support.md)

The three initial generic card images remain as historical source assets and are no longer referenced by active card rendering.

## Higgsfield attempt

Higgsfield was requested as part of the art workflow. Reference-upload calls did not return a confirmed result. A subsequent text-only image-generation call was interrupted after 400.9 seconds without a response or job ID; its submission outcome is unknown. No verified Higgsfield output is used in this build, and that unknown request was not resubmitted. Final assets were completed with imagegen.

## Fonts

Self-hosted Barlow Condensed and Noto Sans KR are distributed under their included SIL Open Font License files in `public/assets/licenses/`.
