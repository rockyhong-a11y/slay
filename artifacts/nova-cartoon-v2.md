# Nova cartoon face revision — 2026-10-06

Mode: built-in `image_gen.imagegen`, style-transfer edits with genuine transparent background. No Live2D, disassembled facial overlays, photo composites or image-generation CLI/API were used.

User request: bring Nova's face into the clean cartoon tone of the other roster characters. All six complete, connected state sprites were redrawn with the same approved cel-shaded face. Existing dark side-parted hair, hoop earrings, athletic silhouette, costume, poses and expression progression were retained. The tool introduced some line/shadow simplification throughout the body as part of the coherent cel-shaded illustration.

## Inputs and visual acceptance

- Edit targets: original `public/assets/fighters/states/nova-{normal,excited,fiery,frustrated,tired,groggy}.webp` at preceding commit.
- Face/line/shadow style references for normal: `raven-normal.webp` and `viper-normal.webp`.
- Face identity reference for the remaining states: the newly accepted `nova-normal.webp`.
- Each original target and reference was inspected with `view_image` before editing.
- All six generated outputs were visually checked: same adult identity, brown eyes, correct costume, connected neck/limbs, complete body, distinct expression and pose.
- WebP encoding and resizing only: Sharp, 1000 × 1500, quality 92, alphaQuality 100. Generated alpha preserved; no manual facial compositing or alpha masking.
- Generated PNG output display can show RGB beneath alpha. Decoded alpha and actual WebP display were checked to verify the transparent background.
- Final consumed sprites: `public/assets/fighters/states/nova-*.webp`.
- Normal fallback and legacy source aliases synchronized: `public/assets/fighters/nova.webp`, `public/assets/nova.webp`.
- Five legacy state aliases synchronized: `public/assets/poses/nova-{excited,fiery,frustrated,tired,groggy}.webp`.
- Retired `nova-atlas.webp` was not touched because no live UI consumes the former Live2D atlas.
- Original generated sources retained in `artifacts/nova-cartoon-v2-sources/`.

## Normal prompt

Use case: style-transfer. Asset type: transparent full-body adult female professional wrestler sprite for a 2D cartoon fighting game. EDIT IMAGE 1 (Nova in the normal state). Images 2 and 3 are STYLE references only, not subjects. Primary request: redraw Nova's FACE and hair treatment in the exact clean 2D anime/cartoon cel-shaded tone of the other roster fighters: confident sharply inked almond-shaped brown eyes with simplified highlights, clean graphic brows, a small simply drawn nose, restrained flat-color lips, decisive contour lines and only two or three flat cel-shadow tones. Remove the semi-photorealistic beauty-render face, skin texture and soft airbrushed gradients. Nova must remain recognizably the same adult woman with long dark side-parted hair and hoop earrings. Preserve image 1's existing normal calm expression, original full-body stance, athletic muscular proportions, exact black/teal/red wrestling costume, harness straps, protective gloves, pads and boots, the location of every limb, and all details below the neck as closely as possible. Head must be naturally integrated with neck, no pasted face seams or floating parts. Do not change outfit or enlarge chest. Single connected character only. Composition: same full-body framing, entire hair and boots visible, no cut-off extremities, tall 2:3 canvas with center placement matching image 1. Background truly transparent alpha, no background painting, no floor, no cast shadow, no checkerboard pixels, no text or logo. Output one finished sprite, not a contact sheet.

Source: `exec-2fbe3d5a-194e-4875-8380-cc87826e5874.png`.

## excited

Use case: style-transfer. Asset type: transparent complete full-body adult female professional wrestler sprite. Image 1 is the EDIT TARGET: Nova in excited state. Image 2 is the APPROVED CHARACTER / FACE STYLE REFERENCE: cartoon Nova. Redraw the face in image 1 to match image 2's exact clean inked anime/cartoon cel shading, simplified brown eyes, graphic brows, simply drawn nose and restrained flat-color lips. No photoreal beauty-render skin or airbrushed face. Keep the same adult facial identity from image 2, long dark side-parted hair and hoop earrings. State emotion: excited upbeat confidence with a small warm smile, both fists raised in a light guard. Preserve image 1's exact pose, body silhouette and athletic muscular proportions, every limb location, black and teal wrestling sports outfit, harness, black/red/silver gloves and guards, pads and boots; no costume changes. Head and neck are naturally connected, no pasted face edges. Entire figure head to boot soles remains inside canvas. Same centered full-body 2:3 portrait composition as image 1. Clean final production illustration, single connected character, no separate face panels. Background must be genuine transparent alpha, no floor or scene or cast shadow; no text, border, watermark.

Source: `exec-27329975-7d2a-4bc1-9e62-1bc052681603.png`.

## fiery

Use case: style-transfer. Asset type: transparent complete full-body adult female professional wrestler sprite. Image 1 is the EDIT TARGET: Nova in fiery state. Image 2 is the APPROVED CHARACTER / FACE STYLE REFERENCE: cartoon Nova. Redraw the face in image 1 to match image 2's exact clean inked anime/cartoon cel shading, simplified brown eyes, graphic brows, simply drawn nose and restrained flat-color lips. No photoreal beauty-render skin or airbrushed face. Keep the same adult facial identity from image 2, long dark side-parted hair and hoop earrings. State emotion: fierce determined focus, lowered brows, steady eyes, both fists up in a forward guard. Preserve image 1's exact pose, body silhouette and athletic muscular proportions, every limb location, black and teal wrestling sports outfit, harness, black/red/silver gloves and guards, pads and boots; no costume changes. Head and neck are naturally connected, no pasted face edges. Entire figure head to boot soles remains inside canvas. Same centered full-body 2:3 portrait composition as image 1. Clean final production illustration, single connected character, no separate face panels. Background must be genuine transparent alpha, no floor or scene or cast shadow; no text, border, watermark.

Source: `exec-95f7b866-ef04-4756-9b0e-8975a22f8a55.png`.

## frustrated

Use case: style-transfer. Asset type: transparent complete full-body adult female professional wrestler sprite. Image 1 is the EDIT TARGET: Nova in frustrated state. Image 2 is the APPROVED CHARACTER / FACE STYLE REFERENCE: cartoon Nova. Redraw the face in image 1 to match image 2's exact clean inked anime/cartoon cel shading, simplified brown eyes, graphic brows, simply drawn nose and restrained flat-color lips. No photoreal beauty-render skin or airbrushed face. Keep the same adult facial identity from image 2, long dark side-parted hair and hoop earrings. State emotion: frustrated concerned frown, knitted brows, slumped shoulders and one fist near the chest. Preserve image 1's exact pose, body silhouette and athletic muscular proportions, every limb location, black and teal wrestling sports outfit, harness, black/red/silver gloves and guards, pads and boots; no costume changes. Head and neck are naturally connected, no pasted face edges. Entire figure head to boot soles remains inside canvas. Same centered full-body 2:3 portrait composition as image 1. Clean final production illustration, single connected character, no separate face panels. Background must be genuine transparent alpha, no floor or scene or cast shadow; no text, border, watermark.

Source: `exec-de2657dd-1a57-4488-829c-5dc9a85921b8.png`.

## tired

Use case: style-transfer. Asset type: transparent complete full-body adult female professional wrestler sprite. Image 1 is the EDIT TARGET: Nova in tired state. Image 2 is the APPROVED CHARACTER / FACE STYLE REFERENCE: cartoon Nova. Redraw the face in image 1 to match image 2's exact clean inked anime/cartoon cel shading, simplified brown eyes, graphic brows, simply drawn nose and restrained flat-color lips. No photoreal beauty-render skin or airbrushed face. Keep the same adult facial identity from image 2, long dark side-parted hair and hoop earrings. State emotion: clearly tired from an athletic wrestling match, weary brows and half-lowered eyelids, mouth slightly open catching breath; shoulders dropped, hands resting on thighs just like image 1. Preserve image 1's exact pose, body silhouette and athletic muscular proportions, every limb location, black and teal wrestling sports outfit, harness, black/red/silver gloves and guards, pads and boots; no costume changes. Head and neck are naturally connected, no pasted face edges. Entire figure head to boot soles remains inside canvas. Same centered full-body 2:3 portrait composition as image 1. Clean final production illustration, single connected character, no separate face panels. Background must be genuine transparent alpha, no floor or scene or cast shadow; no text, border, watermark.

Source: `exec-2a6e238f-c450-42ef-850f-41a240fb7fdc.png`.

## groggy

Use case: style-transfer. Asset type: transparent complete full-body adult female professional wrestler sprite. Image 1 is the EDIT TARGET: Nova in groggy state. Image 2 is the APPROVED CHARACTER / FACE STYLE REFERENCE: cartoon Nova. Redraw the face in image 1 to match image 2's exact clean inked anime/cartoon cel shading, simplified brown eyes, graphic brows, simply drawn nose and restrained flat-color lips. No photoreal beauty-render skin or airbrushed face. Keep the same adult facial identity from image 2, long dark side-parted hair and hoop earrings. State emotion: clearly groggy from an athletic wrestling match, unfocused half-lowered eyelids and concerned brows, mouth slightly open catching breath; torso bent and one arm hanging down just like image 1. Preserve image 1's exact pose, body silhouette and athletic muscular proportions, every limb location, black and teal wrestling sports outfit, harness, black/red/silver gloves and guards, pads and boots; no costume changes. Head and neck are naturally connected, no pasted face edges. Entire figure head to boot soles remains inside canvas. Same centered full-body 2:3 portrait composition as image 1. Clean final production illustration, single connected character, no separate face panels. Background must be genuine transparent alpha, no floor or scene or cast shadow; no text, border, watermark.

Source: `exec-d393b763-c7e0-443f-a1d3-4757267ff195.png`.


