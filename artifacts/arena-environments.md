# Arena environment assets

Created 2026-10-06 with the built-in image_gen tool using the imagegen skill. Each is an original 1536 × 1024 production raster illustration; source PNGs are retained in the generation directory. WebP files are quality 88, method 6, with no resize or retouch, collectively approximately 1.6 MB. The prior Blender arena in public/assets/arena.webp was inspected for ring perspective and framing but not provided as an edit target.

## Framing and integration

- An empty physical ring fills approximately the lower half of each painting. Its surface is pale and the active sprites can occupy x≈30% and x≈70%, feet near y≈85% of the image. Use the full illustration as background, object-position:center center; avoid a top-only crop.
- Packed audience and gesture details fill the upper half and sides, with barricades, multiple balconies, camera equipment and structural lighting. In-game crowd motion/audio remains a separate renderer responsibility.
- No foreground fighters, lettering, logos or UI. Stylized character decorations exist as venue artwork on distant walls of the warehouse/neon scenes. They are architectural decorations, not playable fighters.
- Distinct venues: underground red/amber brick warehouse; neon cyan/magenta event hall; stadium televised gold/navy sports bowl; championship crimson/gold grand finals palace.
- Original existing arena.webp remains unchanged as a fallback.

## Files and prompts

### Underground

- Asset: `public/assets/arenas/underground.webp`
- Source: `/Users/rockyhong/.codex/generated_images/01a10efe-712b-79b1-8a9c-a6595115e954/exec-841984c0-ebe3-4078-8d21-5f5d5ec9ddaf.png`

```text
Use case: stylized-concept. Asset type: production background painting for a premium 2.5D cartoon women's professional wrestling deck-building game. Create a full-bleed 1536x1024 landscape illustration of an UNDERGROUND WRESTLING ARENA. Detailed hand-painted cel-shaded 3D/anime environment with crisp controlled outlines, realistic architecture and rich material detail. Elevated camera at one ring corner, viewing diagonally down into a large physical square wrestling ring. Composition is essential: empty pale gray ring canvas occupies the central lower half, its far edge around 48% image height, front edge around 88%, leaving broad open space for two game character sprites. Four black steel corner posts, exactly three taut red ropes per side, correctly connected turnbuckles. Ring crops slightly at bottom edge. Entire upper half and sides contain a packed, dense, lively audience of HUNDREDS of distinct fans, layered stadium tiers and close ringside barricades; individual small faces, varied clothing, raised hands, clapping, some foam fingers and blank colored placards, smartphone glints. Industrial converted warehouse with brick, exposed beams, overhead steel trusses and red/amber lamps, warm dramatic red side light plus soft neutral overhead light on mat. Fans remain visible, not black blobs. Tiny ring steps, metal barricades, monitor equipment complete the ringside. Tasteful atmospheric depth and subtle haze. High detail and visual density, polished videogame concept art, coherent perspective. No wrestlers or fighters in the ring or foreground, no readable text, no logos, no UI, no watermarks, no objects standing on the canvas. Make the ring surface bright enough for characters to read, with textured fabric and contact shadows. Crowd details are secondary to the calm empty central gameplay surface.
```

### Neon

- Asset: `public/assets/arenas/neon.webp`
- Source: `/Users/rockyhong/.codex/generated_images/01a10efe-712b-79b1-8a9c-a6595115e954/exec-2acb1585-e1b1-43f5-8f2e-930520406190.png`

```text
Use case: stylized-concept. Asset type: production background painting for a premium 2.5D cartoon women's professional wrestling deck-building game. Create a full-bleed 1536x1024 landscape illustration of a NEON WRESTLING ARENA inside a packed Japanese night event hall. Detailed hand-painted cel-shaded 3D/anime environment with crisp controlled outlines, realistic architecture, rich physical materials. Elevated camera at one ring corner, viewing diagonally down into a large physical square wrestling ring. Empty pale cool gray ring canvas occupies central lower half, far edge around 48% image height, front edge around 88%, broad calm open canvas for two game character sprites. Four black steel corner posts, three taut luminous violet ropes per side, properly connected turnbuckles. Front ring corner cropped slightly at bottom edge. Hundreds of enthusiastic densely packed spectators tightly fill the upper half and sides, two curved decks of seating, individual small faces, varied clothing, raised hands, clapping, foam fingers, blank colored placards, camera flashes and cyan glow sticks. Sophisticated contemporary venue with overhead steel truss lattice, abstract geometric magenta LED ribbon displays, cyan rim lights and violet accent lighting; NO letters on displays. Neon turquoise and magenta entrance arch toward rear left. Reflective black barricades, metal access steps, ringside monitor equipment. Small bright white spotlights illuminate the canvas, beautiful magenta/cyan bounce light on dark fans and architecture. Crowd is visible and lively, not black blobs. Polished vivid videogame concept art, high density with coherent perspective. NO wrestlers or fighters in the ring or foreground, no readable text, no logos, no UI, no watermarks, no objects standing on canvas. Keep central ring surface neutral and pale for game sprite readability; crowd details secondary to the gameplay surface.
```

### Stadium

- Asset: `public/assets/arenas/stadium.webp`
- Source: `/Users/rockyhong/.codex/generated_images/01a10efe-712b-79b1-8a9c-a6595115e954/exec-f2c23003-0b9a-41a4-9e01-e11e71e5d317.png`

```text
Use case: stylized-concept. Asset type: production background painting for a premium 2.5D cartoon women's professional wrestling deck-building game. Create a full-bleed 1536x1024 landscape illustration of a LIVE TELEVISED MAJOR LEAGUE WRESTLING STADIUM. Detailed hand-painted cel-shaded 3D/anime environment with crisp controlled outlines, architectural realism, rich materials. Elevated camera at one ring corner, viewing diagonally down into a large physical square wrestling ring. Empty pale cream canvas occupies central lower half, far edge around 48% image height, front edge around 88%, broad open flat space for two game character sprites; four dark steel corner posts with black and gold cushions, exactly three taut golden-yellow ropes per side correctly connected to turnbuckles. Front corner cropped slightly at bottom edge. Massive oval sports bowl FULL of thousands of densely packed spectators, tiered upper decks and luxury boxes; foreground fan rows with recognizable small faces, varied colorful shirts, excited raised arms, clapping, blank yellow/white placards, foam hands, hundreds of tiny smartphone lights. White spotlights from suspended square lighting rig dramatically illuminate mat, warm gold ribbons curve around stadium decks, deep navy shadows in vaulted steel dome. Large abstract gold-and-black LED panels and broadcast camera crane visible beyond ring, NO text or brand. Professional ringside broadcast table and black equipment cases behind steel safety barricade, metal access steps. Energetic premium sports television setting, cinematic golden glow, sophisticated balanced detail. No wrestlers or fighters in ring or foreground, no readable text, no logos, no UI, no watermarks, no objects standing on canvas. Crowd lively and readable, not a wall of blobs. Calm pale mat must remain clear for game sprite readability.
```

### Championship

- Asset: `public/assets/arenas/championship.webp`
- Source: `/Users/rockyhong/.codex/generated_images/01a10efe-712b-79b1-8a9c-a6595115e954/exec-c20d300d-e814-4c43-b54c-41575b40dc48.png`

```text
Use case: stylized-concept. Asset type: production background painting for a premium 2.5D cartoon women's professional wrestling deck-building game. Create a full-bleed 1536x1024 landscape illustration of the ultimate CHAMPIONSHIP GRAND ARENA, a vast sold-out championship wrestling finals venue with majestic crimson and antique-gold theatrical architecture. Detailed hand-painted cel-shaded 3D/anime environment, crisp controlled outlines, rich physical materials, premium videogame environment art. Elevated camera at one ring corner, diagonally down into a large physical square wrestling ring. Empty pale ivory canvas occupies central lower half, far edge around 48% image height, front edge around 88%, huge calm open flat surface for two game character sprites. Four black steel ring posts with gold-capped accents and red/gold cushions, exactly three taut crimson ropes each side connected correctly; front corner slightly cropped below frame. Crowd density is spectacular: thousands of tightly packed enthusiastic spectators around ring and three sweeping balcony decks, small visible faces, varied shirts, raised hands, clapping, blank gold/crimson placards and white cellphone glints. Rear entrance stage is a golden crown-shaped architectural arch, a central abstract light sculpture, sweeping red velvet banners with NO text, golden structural ribs and deep crimson LED ribbons around the balcony edges. Suspended elaborate championship lighting truss, dramatic volumetric golden spotlights descending onto pale mat, soft crimson uplight in surrounding stands. Close ringside barricades with intricate gold trim, metal access steps, discreet broadcast equipment. Every seat filled, rich visual density but clear center gameplay zone. No wrestlers or fighters in ring or foreground, no readable text, no logos, no UI, no watermarks, no belt placed in ring, no objects on canvas. Majestic final-boss setting; polished spectacular sports arena, coherent plausible perspective.
```


## Inspection

All four generated images were visually inspected at native size. Dense distinct audience, visible hands/placards, coherent lit ring surface, three-roped sides, venue variation, and empty gameplay space confirmed. Generated source canvases are 1536 × 1024 RGB. Encoding retains dimensions and uses WebP for runtime transfer size. Browser crop and final sprite grounding must be verified after the renderer is integrated.
