# NOVA — State Pose Art Provenance

These five assets were produced with the built-in image_gen imagegen tool, one independent edit call per pose. The existing NOVA image was inspected before editing and used as the sole identity/outfit/style reference. No original character asset was overwritten.

- Reference/edit target: `/Users/rockyhong/Documents/Codex/2026-10-04/1-slay-2-tcg-3-4/public/assets/nova.webp`
- Tool: `image_gen.imagegen` (built-in), with `transparent_background: true` and `referenced_image_paths: [reference]` for every call.
- Normal pose: existing `public/assets/nova.webp`, reused without modification.
- Original generated PNGs: copied intact into `artifacts/pose-sources/`.
- Deployment optimization only: RGBA WebP, aspect ratio retained, maximum height 1300, quality 88, method 6. No recoloring, background removal, cropping, or pose edits were performed after generation.
- Visual QA: original facial identity, long black hair, black/teal ring gear, white wraps, knee pads and boots retained; requested expression and body pose checked; no blood, injury, extra people or background added. PNG and WebP alpha channels were verified to include transparent and opaque pixels.

## excited

- Original generated file: `/Users/rockyhong/.codex/generated_images/01a10648-afc7-7c50-922b-2b49ec52c142/exec-4b6d2af7-848c-4bd6-8044-6b93a855eca4.png`
- Preserved source: `artifacts/pose-sources/nova-excited.png`
- Deployment result: `public/assets/poses/nova-excited.webp`
- Exact prompt:

```text
Use case: identity-preserve.
Asset type: SLAY game full-body transparent character cutout, a new state sprite.
Input image 1: the existing NOVA sprite is both the edit target and the identity/outfit/style reference.
Preserve exactly the same original adult woman NOVA (age 26): her facial identity, long black hair, athletic proportions, black-and-teal professional wrestling sports bra and high-waist ring shorts, teal-trimmed black knee pads, black lace-up tall boots, and white wrist/forearm wraps. Preserve the reference's polished semi-realistic 2.5D game rendering, skin tones, black/teal palette, and studio rim lighting. Do not redesign any clothing or face.
Change only her facial expression and full-body pose to the requested state. Single adult practical clothed athlete, no sensual presentation, no injury, bruises, blood, extra people, text, watermark, ring ropes, or background objects. Full body including all boots and hair must fit uncropped with small transparent margins. Similar three-quarter view to the reference. Make a genuine transparent-background alpha cutout with clean hair edges, no baked black/white/checkerboard backdrop and no ground plane.
State EXCITED: NOVA has a confident, lively smile and bright focused eyes. Both wrapped hands are closed into fists and lifted in an agile, springy ready stance; shoulders open, knees softly bent, weight balanced. The expression is competitive confidence, not glamour posing.
```

## fiery

- Original generated file: `/Users/rockyhong/.codex/generated_images/01a10648-afc7-7c50-922b-2b49ec52c142/exec-788e60c1-15c4-4904-a60c-83d1215ee567.png`
- Preserved source: `artifacts/pose-sources/nova-fiery.png`
- Deployment result: `public/assets/poses/nova-fiery.webp`
- Exact prompt:

```text
Use case: identity-preserve.
Asset type: SLAY game full-body transparent character cutout, a new state sprite.
Input image 1: the existing NOVA sprite is both the edit target and the identity/outfit/style reference.
Preserve exactly the same original adult woman NOVA (age 26): her facial identity, long black hair, athletic proportions, black-and-teal professional wrestling sports bra and high-waist ring shorts, teal-trimmed black knee pads, black lace-up tall boots, and white wrist/forearm wraps. Preserve the reference's polished semi-realistic 2.5D game rendering, skin tones, black/teal palette, and studio rim lighting. Do not redesign any clothing or face.
Change only her facial expression and full-body pose to the requested state. Single adult practical clothed athlete, no sensual presentation, no injury, bruises, blood, extra people, text, watermark, ring ropes, or background objects. Full body including all boots and hair must fit uncropped with small transparent margins. Similar three-quarter view to the reference. Make a genuine transparent-background alpha cutout with clean hair edges, no baked black/white/checkerboard backdrop and no ground plane.
State FIERY: NOVA gives a determined battle roar with intense focused eyes. Both fists are firmly clenched, forearms raised for attack, and her upper body leans forward with athletic intent. Stable fighting footwork, dynamic but anatomically natural. Do not add fire or visual-effect props.
```

## frustrated

- Original generated file: `/Users/rockyhong/.codex/generated_images/01a10648-afc7-7c50-922b-2b49ec52c142/exec-33096722-3176-4eaf-8c45-bebf496bd1e1.png`
- Preserved source: `artifacts/pose-sources/nova-frustrated.png`
- Deployment result: `public/assets/poses/nova-frustrated.webp`
- Exact prompt:

```text
Use case: identity-preserve.
Asset type: SLAY game full-body transparent character cutout, a new state sprite.
Input image 1: the existing NOVA sprite is both the edit target and the identity/outfit/style reference.
Preserve exactly the same original adult woman NOVA (age 26): her facial identity, long black hair, athletic proportions, black-and-teal professional wrestling sports bra and high-waist ring shorts, teal-trimmed black knee pads, black lace-up tall boots, and white wrist/forearm wraps. Preserve the reference's polished semi-realistic 2.5D game rendering, skin tones, black/teal palette, and studio rim lighting. Do not redesign any clothing or face.
Change only her facial expression and full-body pose to the requested state. Single adult practical clothed athlete, no sensual presentation, no injury, bruises, blood, extra people, text, watermark, ring ropes, or background objects. Full body including all boots and hair must fit uncropped with small transparent margins. Similar three-quarter view to the reference. Make a genuine transparent-background alpha cutout with clean hair edges, no baked black/white/checkerboard backdrop and no ground plane.
State FRUSTRATED: NOVA has a worried, frustrated expression with furrowed eyebrows and slightly lowered shoulders. One wrapped hand rests against her forehead while the other hand remains in a defensive guard. Keep her standing full-body and athletic, as she regroups under psychological pressure.
```

## tired

- Original generated file: `/Users/rockyhong/.codex/generated_images/01a10648-afc7-7c50-922b-2b49ec52c142/exec-e8bc9c81-843f-4ed1-b45f-8b0e8e239179.png`
- Preserved source: `artifacts/pose-sources/nova-tired.png`
- Deployment result: `public/assets/poses/nova-tired.webp`
- Exact prompt:

```text
Use case: identity-preserve.
Asset type: SLAY game full-body transparent character cutout, a new state sprite.
Input image 1: the existing NOVA sprite is both the edit target and the identity/outfit/style reference.
Preserve exactly the same original adult woman NOVA (age 26): her facial identity, long black hair, athletic proportions, black-and-teal professional wrestling sports bra and high-waist ring shorts, teal-trimmed black knee pads, black lace-up tall boots, and white wrist/forearm wraps. Preserve the reference's polished semi-realistic 2.5D game rendering, skin tones, black/teal palette, and studio rim lighting. Do not redesign any clothing or face.
Change only her facial expression and full-body pose to the requested state. Single adult practical clothed athlete, no sensual presentation, no injury, bruises, blood, extra people, text, watermark, ring ropes, or background objects. Full body including all boots and hair must fit uncropped with small transparent margins. Similar three-quarter view to the reference. Make a genuine transparent-background alpha cutout with clean hair edges, no baked black/white/checkerboard backdrop and no ground plane.
State TIRED: NOVA is visibly breathless and fatigued without injury. Her head is lowered, mouth slightly open to catch her breath, upper body bent forward, and BOTH hands are braced on her thighs just above her knee pads. Standing feet apart for balance. Preserve all identity and outfit details.
```

## groggy

- Original generated file: `/Users/rockyhong/.codex/generated_images/01a10648-afc7-7c50-922b-2b49ec52c142/exec-b29a450e-2dec-4ce3-8ea4-f7b7cd17e696.png`
- Preserved source: `artifacts/pose-sources/nova-groggy.png`
- Deployment result: `public/assets/poses/nova-groggy.webp`
- Exact prompt:

```text
Use case: identity-preserve.
Asset type: SLAY game full-body transparent character cutout, a new state sprite.
Input image 1: the existing NOVA sprite is both the edit target and the identity/outfit/style reference.
Preserve exactly the same original adult woman NOVA (age 26): her facial identity, long black hair, athletic proportions, black-and-teal professional wrestling sports bra and high-waist ring shorts, teal-trimmed black knee pads, black lace-up tall boots, and white wrist/forearm wraps. Preserve the reference's polished semi-realistic 2.5D game rendering, skin tones, black/teal palette, and studio rim lighting. Do not redesign any clothing or face.
Change only her facial expression and full-body pose to the requested state. Single adult practical clothed athlete, no sensual presentation, no injury, bruises, blood, extra people, text, watermark, ring ropes, or background objects. Full body including all boots and hair must fit uncropped with small transparent margins. Similar three-quarter view to the reference. Make a genuine transparent-background alpha cutout with clean hair edges, no baked black/white/checkerboard backdrop and no ground plane.
State GROGGY: NOVA is dizzy and struggling to recover but uninjured. She is down on ONE knee; ONE wrapped hand braces against an implied mat below her, and the OTHER hand barely maintains a protective guard. Her head is slightly bowed with unfocused tired eyes. Anatomically correct kneeling athletic recovery pose; transparent background means no visible mat or environment. Full body, both boots, and supporting hand all visible.
```
