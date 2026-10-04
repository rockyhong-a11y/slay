# SLAY living illustration research

Reviewed on 2026-10-04. This note records the starting architecture and authoring
constraints; it does not claim that a Cubism model has been built or integrated.

## Current material and local findings

- Active illustrations: 3 normal fighters, 15 condition cutouts, 25 technique
  cards: **43 separate image sources**. Arena artwork is separate.
- The project has WebP illustrations and pose footprint metadata, but no
  `.moc3`, `.model3.json`, `.physics3.json`, `.motion3.json`, `.cmo3`, `.can3`,
  layered PSD, or Cubism SDK dependency.
- Cubism/Live2D was not found in the inspected `/Applications`,
  `~/Applications`, common application-support paths, or a Spotlight name
  search. This is a scoped observation, not a claim that every disk location
  was examined. Blender is installed.
- `src/live-art-rigs.js` now supplies 43 image-specific sets of normalized
  landmarks. Every image was individually inspected with `view_image`.
  Existing image pixels were not modified.

## What actual Cubism integration needs

Cubism stores authored deformation in `.moc3`. Its `.model3.json` links that
model to texture atlases and optional physics, expressions and motions. The Web
framework loads those files, constructs the model and renderer, loads textures,
and updates ArtMesh vertices from parameters. A raster illustration or a CSS
transform is not a runtime Cubism model.
[Cubism Web model loading](https://docs.live2d.com/en/cubism-sdk-manual/model-web/)

A credible authoring pipeline is: separate artwork into editable parts; import
the prepared artwork; author ArtMeshes, deformer hierarchies and parameter key
forms; author expressions/physics/motions; pack the texture atlas; export the
runtime model for the intended SDK version. `.cmo3` is the editor source and
`.can3` is animation source; the export contains `.moc3`, `.model3.json` and
atlas PNGs, with motion and physics files when authored.
[Runtime export](https://docs.live2d.com/en/cubism-editor-manual/export-moc3-motion3-files/),
[Editor file types](https://docs.live2d.com/en/cubism-editor-manual/file-type-and-extension/)

Material separation includes eyes, eyelashes, hair and other independently
moving parts. Hidden areas exposed by movement must be painted. The current
flat images have no such hidden pixels or independent eyelid/mouth layers.
Large head turns, arm articulation and expressive facial acting therefore need
additional authoring material. Small deformation is feasible with the existing
pixels. A flat image can serve as limited geometry; that does not create the
missing artwork.
[Material separation](https://docs.live2d.com/en/cubism-editor-manual/divide-the-material/),
[PSD import](https://docs.live2d.com/en/cubism-editor-manual/psd-import/)

Cubism Core is distributed through the official SDK download, while the Web
framework and samples are available on GitHub. Integrating Core would also mean
retaining its own distribution/license terms separately from SLAY's code
license. No SDK was installed during this review.
[SDK for Web](https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-for-web/),
[Official download](https://www.live2d.com/en/sdk/download/web/)

## Feasible custom GPU rig

The following are engineering recommendations inferred from the actual assets,
not claims about Cubism capabilities or a finished implementation.

Use a triangulated 2D mesh with image-specific, smoothly decaying influence
regions. Give the torso a small breathing movement, head a separate subtle
tilt, hair a delayed sway, and guarded arms their own small offset. Preserve the
subject's silhouette and planted feet. For cards, animate each wrestler's
regions independently while keeping arena ropes, posts, floor and crowds
stationary. This should be described as a **custom GPU 2D mesh rig** or **living
illustration**, and not native Live2D Cubism.

Do not copy a face or hair region over an unchanged full image: the original
pixels would remain and create ghosts. Either deform those pixels once in the
mesh or prepare a proper separated layer with a repaired background. A blink
created by local masking can be restrained, but it is not a replacement for
authored eyelid textures. Omit blinking where eyes are closed, obscured, tiny
or seen at an extreme angle.

The rig map currently has at most 7 parts and 2 eyes per image. UV origin is the
upper left. Ellipse centers/radii and source-sampling skin points are individually
authored. Shared helpers only assign motion amplitudes and phase offsets.

Special cards:

- `moonsault`, `suplex` and `reversal` have inverted/lying subjects, so their
  landmarks follow the source orientation.
- `ringcraft` and `encore` have a smaller distant second wrestler.
- `comeback` has one full upper-body subject and a cropped opponent's legs in
  the foreground. Its planted foreground boot remains pinned.
- `focus` already has closed eyes.
- `rally` has front ropes crossing the body; the torso influence stays above
  the nearest crossing.
- `nightmare` has a small back-facing athlete plus enormous painted eyes in
  the sky. The latter are aura regions, not character blink targets.
- There are no completely unpopulated cards.

## Render coverage

These are the seven render entry points in the reviewed source. Replacing the
shared components covers their repeated uses automatically.

| Entry point                               | Coverage                                     | Integration constraint                                                                                                     |
| ----------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `main.jsx` `Card` art                     | Hand, rewards, deck, draw, discard, upgrades | Keep animated art inside the existing art viewport; leave cost, text and rarity frame in DOM.                              |
| `main.jsx` profile avatar                 | Sidebar player portrait                      | Preserve the round 35px crop and current face framing. Avoid applying the old image zoom twice.                            |
| `main.jsx` roster art                     | All 3 character choices                      | `.roster-card > div` currently styles text; a new art `<div>` must not inherit that rule. Use explicit art/copy selectors. |
| `CombatPresentation.jsx` `FighterSprite`  | Player, opponent, 5-condition preview        | Preserve `pose-layout.json` aspect/bottom anchoring, condition selection, preload cancellation and still mode.             |
| `CombatPresentation.jsx` `TechniqueScene` | Every card and finisher cinematic            | Keep cue identity, timing, completion guards and announcement. Art renderer must not capture input.                        |
| `KnowledgePages.jsx` `LibraryCard`        | Complete 25-card encyclopedia                | Pause offscreen cards, retain lazy loading and accessible names.                                                           |
| `KnowledgePages.jsx` `CardDetail`         | Large card detail dialog                     | Preserve top-layer clipping, focus management and full base/upgraded effect text.                                          |

The arena background image is not a fighter rig target. `ConditionGuide` reuses
`FighterSprite`, so a separate implementation is unnecessary. All current
`img`-specific CSS must be checked when introducing wrapper/canvas elements.

## Runtime and transition safeguards

Use a shared animation clock/RAF, cached textures, visibility-driven updates
and a limited renderer pool or a shared renderer. A separate WebGL context for
every card in a 25-card library creates avoidable resource pressure. Device
capabilities and budgets vary; explicitly release textures/buffers when unused,
cap backing-buffer resolution and provide context-loss recovery with a static
image fallback. These choices follow the resource-management principles in
[MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

For a condition change, retain the old rig until the new texture is decoded and
has rendered its first frame, then crossfade two complete sources. Use a request
generation token so a late load cannot replace the latest pose. Do not morph
standing vertices into kneeling vertices from a different source. Maintain a
continuous clock through the fade and use the existing footprint metadata to
keep the floor contact stable. Route changes and unmounts must unregister
surfaces, observers and callbacks.

Reduced-motion mode should show a stable source and suppress continuous mesh
motion and blinking. Canvas imagery needs the same meaningful alternative text
as its source; decorative cinematic art remains hidden from assistive tech.
Keep pointer events on the card/button, not the canvas, so keyboard and combat
locks retain their current behavior.

## QA acceptance checklist

- All 43 rig keys match real active assets; each region uses that source's UVs.
- All seven entry points animate, including rewards, every pile, upgrades,
  avatar, roster, condition preview, library and detail dialog.
- Subjects breathe independently. Hair and head move separately; ropes,
  background and planted feet remain stable at the intended amplitudes.
- Eyes blink only at the actual eyelids. No foreground ghosts, face smearing,
  transparent-edge halos or repeated source pixels.
- Condition changes, rapid card play, enemy turn, victory, defeat, new run and
  route changes do not show a stale source or leave an animation callback.
- Existing cinematic/input-lock completion remains independent of art loading.
- Small mobile cards, large detail views and dark/light themes keep text,
  numbers and frames clear. New wrappers do not alter card geometry or overlap
  HUD/intent text. Typography stays outside the deformed image.
- Offscreen/library cards pause; reduced motion remains stable; context loss or
  texture errors retain a readable static fallback.
- Repeated navigation and opening/closing the detail dialog does not accumulate
  RAF loops, contexts or texture memory.
