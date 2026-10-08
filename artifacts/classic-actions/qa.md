# First-five original fighter action artwork — 2026-10-08

Scope: Raven, Valkyrie, Nova, Viper and Ember in original/cartoon mode. Existing card illustration shot → fighter replay → result sequencing is preserved. The other five fighters keep their existing artwork/motion renderer; SD is unchanged.

## Generated assets

Built-in imagegen produced one transparent 1086×1448 PNG atlas per fighter using her current `fighters/states/*-normal.webp` as the identity reference. Each contains 12 complete independently drawn bodies: ready, windup, elbow, kick, clinch, lift, slam, suplex, armbar, leglock, guard and hurt (60 drawings total). Source PNGs were copied without pixel editing. Exact prompts are in `prompts.json`.

The choreography chooses and sequences these shared action poses for each card's technique family, with card-specific travel/contact timing from the existing combat cues. These are pose-based 2D animations, not 60 separate motion-capture clips per fighter. Authored seated/bridged bodies are not rotated a second time. Movement, lifting, airborne rotation, recoil, contact pause and recovery connect each drawing; preparation and recovery have a 50ms full-body dissolve, while contact drawings cut sharply.

`measure-atlases.py` reads alpha without modifying the PNG. It records each full body's dimensions and applies runtime clipping where adjoining pose crop rectangles contain a neighbor. `alpha-qa.json` records source SHA-256, full primary silhouette containment and zero neighboring alpha>150 character pixels in all 60 clips. The manifest is compact JSON; polygon normalization is cached outside the animation hot path.

## Validation

- `npm test`: **338/338 passed**.
- `BASE_PATH=/slay/ npm run build`: passed.
- Actual atlas tests cover all 60 engine cards, first-five pairs, mixed first/last-five pairs, portrait/landscape containment, crop scaling, wrong/missing metadata and fallback.
- Browser: 390×844 portrait and 844×390 landscape; actual controls and isolated DEV fixtures.
- Raven powerbomb: card illustration then overhead lifting/landing artwork, with whole bodies in frame.
- Valkyrie kick: extended leg silhouette and jumping approach.
- Nova armbar: seated grip paired with a grounded opponent; utility stays free of damage/contact flashes.
- Viper suplex: authored bridge with airborne opponent; no beret or gauntlets.
- Ember elbow: forward elbow action, contact accent, opponent recoil; low-health fixture returns to its original condition image afterward.
- Incoming blocked attack: defender guard and enemy elbow poses; no false hurt pose.
- Atlas: original fallback artwork retained during fighter replay.
- SD mode: SD presentation, no classic action-atlas elements.
- Concise setting: both original shots complete with action atlas inactive; setting restored afterward.
- Browser warning/error log: empty during final smoke checks.

Screenshots: `raven-powerbomb.jpg`, `valkyrie-kick.jpg`, `nova-armbar.jpg`, `viper-suplex.jpg`, `ember-elbow.jpg`.

## Rendering limits

Active poses are whole-body illustrations with intact authored outfits. Idle, recovery-to-idle and reduced-motion mode retain existing condition/wear artwork. Standing-pose injury and clothing masks are intentionally not pasted onto the new bent/extended poses, where they would be misaligned. The generated kick frame is a side-kick silhouette; the existing dropkick/aerial cards animate that shared frame along their airborne path.
