# Original character combat choreography

The original mode now renders both selected fighters through the finite paired
choreography used by SD. Strike approach/contact/recoil, powerbomb lift/rotation/
landing, submission pressure, incoming guard/hurt and recovery move complete
illustrations. The existing condition artwork and sweat, injury and gear layers
stay together. No body parts are split or reconstructed.

The ten actor silhouettes use measured union alpha bounds so transparent image
gutters do not shrink the characters. Camera bounds include rotated/elevated
sprites and responsive resting positions. Card art remains visible as a reference
inset during original-mode replays; SD mode retains its existing presentation.

## Verification

- 320 automated tests passed; production build passed.
- Geometry tests sample every card, ten actor pairings, four portrait/landscape
  sizes and 51 progress points. Full silhouettes stay within the stage.
- 390×844 browser: Elbow Strike reaches contact/hurt, consumes one action point
  and deals 6 damage. Powerbomb lifts and rotates the defender before landing.
- 844×390 browser: Figure-four enters submission/pressure with both figures fully
  visible and independent of the text panel.
- Incoming attack: enemy pose `strike`, player pose `hurt`; blocked incoming
  attack: player pose `guard` with no health damage.
- SD utility card in original mode: `focus`, defender `idle`, contact opacity 0.
- Shortened mode: both transforms stay unrotated/unscaled; KO reaches reward and
  releases input normally. Full mode restored after testing.
- Outgoing replay summary: original stage returns to `idle`; physical flare and
  glyph counts are zero while the damage summary remains visible.
- Browser console: no runtime errors during local verification.
- Lifecycle coverage: stages stop RAF after the finite cue, on hidden/paused
  surfaces and at unmount. Artwork and wear components remain RAF-free.

Screenshots: `powerbomb-portrait.jpg`, `submission-landscape.jpg`,
`strike-contact.jpg`, `incoming-guard.jpg`, `incoming-hit.jpg`.
