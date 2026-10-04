# SLAY art direction and provenance

SLAY depicts an original adult female professional wrestling league: an underground arena, crimson ropes, practical athletic costumes, distinct silhouettes and warm red / cool blue lighting. User references inform facial features, hairstyle, body type and costume palette. Original reference files are not distributed.

## Active character illustrations

The final character set uses **30 complete, static full-body illustrations**: five fighters with six states each. Active paths are `public/assets/fighters/states/{actor}-{state}.webp`. Body, head, hair, arms and expressions are already painted together in each file; the app displays the complete illustration and crops that same source for face portraits.

| Fighter  | Visual direction                                           | Strategy                                   |
| -------- | ---------------------------------------------------------- | ------------------------------------------ |
| RAVEN    | Long crimson hair, side fringe, black/navy athletic gear   | Opening damage and attack combos           |
| VALKYRIE | Blonde bob, navy gear and white wraps                      | Guard retention and grappling              |
| NOVA     | Long black hair, dark gear and red/steel guards            | Zero-cost draw and deck cycling            |
| VIPER    | Blonde twin braids, bare hands/forearms and green gear     | Weak/vulnerable setup and follow-up damage |
| EMBER    | Wavy brunette hair, muscular build and black/red/gold gear | Crowd heat, calm and low-health comeback   |

States are `normal`, `excited`, `fiery`, `frustrated`, `tired` and `groggy`. They use distinct complete poses and expressions while preserving each fighter's cartoon body and gear. State priority is health ≤25%, health ≤50%, stress ≥60, heat ≥6, heat ≥3, then normal. An enemy's weakness ≥2 also selects frustrated. The condition badge opens all six state previews without changing the run.

All 30 final images were produced by individual built-in `image_gen` **edit** calls. Normal-state edits used the existing complete cartoon body and the corresponding original facial reference together. The five variants then used the corrected normal image and that same original reference, retaining the cartoon body, outfit, hairstyle and palette while changing expression and pose.

The exact prompts, references and returned source PNG paths are recorded in:

- [Four normal-state edits: RAVEN, VALKYRIE, NOVA and EMBER](fighter-state-prompts.json)
- [Twenty state variants for those four fighters](fighter-state-variant-prompts.json)
- [VIPER's normal and five variant edits](viper-state-prompts.json)

Original PNG outputs are preserved locally in ignored `artifacts/fighter-state-sources/`. The 30 production assets are 1000×1500 RGBA WebP, exported at quality 92 with method 6. The app crops face portraits from these same complete files, using `public/assets/fighters/states/portraits.json`.

| Fighter  | Original reference supplied by the user |
| -------- | --------------------------------------- |
| VIPER    | `Cammy White.jpeg`                      |
| EMBER    | `WWE SUP.jpeg`                          |
| VALKYRIE | `download.jpg`                          |
| NOVA     | `Unknown.jpeg`                          |
| RAVEN    | `example.com.jpeg`                      |

The earlier [five base prompts](cartoon-fighter-prompts.json) and [five atlas prompts](cartoon-puppet-prompts.json) remain historical production records.

## Viper gear removal and grappling expansion

All six active VIPER state files and the loading fallback now remove the red beret, headband, armored gauntlets and attached gloves. Natural blonde hair, bare hands and forearms replace those accessories while preserving the existing face, green gear, pose and condition. These are six individual built-in image edit calls, documented in [the exact prompts](viper-no-gear-prompts.json). Exports retain genuine alpha and the 1000×1500 production framing. [Browser checks](viper-no-gear-browser-checks.json) confirm all six whole-body/portrait pairs load the same complete state image.

The expanded card collection adds 25 separate techniques: five powerbomb variants, seven slams/suplexes, ten joint locks/submissions and three grappling connections. Their dedicated 1024×683 WebP illustrations and exact built-in generation prompts are recorded in [new card prompts](new-card-prompts.json). The earlier 25 realistic illustrations remain available; the new series uses coherent cartoon wrestling anatomy matching the current fighter direction.

## Static rendering and card cinematics

The active app renders completed images. Continuous Canvas puppets, WebGL meshes, procedural facial painting, hair springs and their frame scheduler are removed. Previous six-part atlases and photographic pose records are historical production material and do not supply the current character presentation.

The 50 dedicated card illustrations are stored at `public/assets/cards/{card-id}.webp`. Cards, rewards, deck views, encyclopedia details and card-cast scenes use the same technique mapping. Library detail views retain the full composition; face portraits intentionally crop a completed fighter illustration. Full-screen cast scenes use a sharp technique foreground and a blurred duplicate of the same image behind it.

Finite card-cast cinematics retain discipline-specific timing and transitions for strikes, aerial moves, throws, submissions, grapples, defense, tactics and nightmare. They show actual engine outcomes: damage, absorbed guard, healing, draw, energy, heat, pressure and status effects. Card-play and end-turn input remain locked during each cue. Full / Concise and operating-system reduced-motion preferences apply to the cinematic presentation.

HUD, performers and captions occupy separate reserved regions. Cast titles and outcomes sit below the technique foreground. Portrait casts crop outer arena space to focus on the wrestlers and contact point; wide slams and throws preserve more of the pose. Powerbombs lift and drop, slams load and hit the mat, and submissions tighten progressively. [Actual cast checks](cinematic-browser-checks.json), [portrait/landscape combat checks](combat-responsive-browser-checks.json) and screenshots confirm these layouts. The earlier [verification record](cartoon-fighter-qa.md) and [arena checklist](arena-layout-checklist.md) remain historical records.

## Card illustration provenance

The original 25 card images were generated with built-in imagegen as individual move-specific illustrations. Together with the new grappling series, all 50 production files are 1024×683 WebP, exported at quality 88. Original PNG sources are retained locally in ignored artifact files; complete prompts for the original series are versioned:

- [Strikes, aerial moves and finishers — 9 prompts](card-art-strikes.md)
- [Throws, submissions and defense — 8 prompts](card-art-holds.md)
- [Support, recovery and nightmare — 8 prompts](card-art-support.md)

The initial three generic card images are historical assets and are not used by active card rendering.

## Blender state-review gallery

The [30-image gallery](fighter-state-gallery.jpg) was rendered in Blender 5.2.2 LTS at 3840×4885. Its editable [scene](fighter-state-gallery.blend), [rebuild script](../tools/build-state-gallery.py) and [machine-readable verification](fighter-state-gallery-facts.json) are included. The scene is a QA comparison of finished 2D illustrations, arranged as five fighter rows and six condition columns.

Each image occupies one plane with four vertices, one face and full-image UVs. One complete RGBA texture is packed per plane; the recorded source, assigned texture and packed bytes have matching SHA-256 values. All 30 planes use the same scale and orientation and fit inside the gallery camera. The inventory contains 30 image planes, caption text and a camera, with zero armatures, actions or animation drivers. This is an inspection gallery of complete images, rather than a 3D character-generation or animation pipeline.

## Arena

The repository includes the editable Blender scene `artifacts/arena.blend` and the procedural scene/render script `tools/render-arena.py`. The browser asset is `public/assets/arena.webp`. This state-illustration revision does not claim a new Blender character rig or animation export.

## Journey event cutscenes

Three new cel-shaded wrestling environment plates supply locker-room recovery, backstage opportunities, and high-stakes contract events. The active files are `public/assets/events/lockerroom.webp`, `backstage.webp` and `highstakes.webp`, each 1600×900 RGB WebP exported at quality 90. All three were generated through separate built-in `image_gen` calls; the exact prompts, original PNG paths and production hashes are in [the cutscene prompt record](journey-cutscene-prompts.json). Original PNGs are also copied to ignored `artifacts/journey-{scene}-source.png` files.

The event UI displays the environment and one complete current-fighter illustration. Finite camera transitions and dialogue beats introduce the scene before the player chooses a visible outcome. The scenes do not animate separate facial or body parts. Combat likewise animates complete fighter images for short attack and recoil cues; items and corner gimmicks use the established Phosphor icon system rather than unproduced raster icon paths.

## Historical production records

Earlier semi-realistic character poses are documented in [RAVEN](pose-art-raven.md), [VALKYRIE](pose-art-valkyrie.md) and [NOVA](pose-art-nova.md). The [living-art research](live-art-research.md) describes an abandoned runtime approach, not a shipped feature.

Higgsfield preflight attempted model recommendations, reference-upload confirmation for the original Cammy image, and preference retrieval. The calls did not return a verified result and were interrupted after 1505.6 seconds; this was a local interruption, not a confirmed server timeout. No model, upload or cost was verified, and no generation request was submitted for this revision. There was no returned job ID or asset. The final 30 images are attributed to the built-in image-generation edits recorded above.

## Fonts and licensing

Fonts are self-hosted: Do Hyeon for Korean titles, Teko for scores and result headlines, Barlow Condensed for English names, and Noto Sans KR for rules and card effects. SIL Open Font Licenses: [Do Hyeon](../public/assets/licenses/DoHyeon-OFL.txt), [Teko](../public/assets/licenses/Teko-OFL.txt), [Barlow Condensed](../public/assets/licenses/BarlowCondensed-OFL.txt), [Noto Sans KR](../public/assets/licenses/NotoSansKR-OFL.txt).

The source-code MIT license does not grant reuse rights for user-supplied reference images. Generated/rendered asset provenance is recorded separately from the code license.
