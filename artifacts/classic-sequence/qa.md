# Original-mode card → fighter sequence

- Original mode now shows the existing animated card illustration/effects first,
  then the paired original-fighter replay. The broadcast header indicates 1/2
  and 2/2. The arena never becomes interactive between shots.
- Each shot has its own identity and contiguous absolute start time. The second
  starts at the end of the first, so it begins with the approach rather than
  appearing at the end of an expired cue. Late resumes seek the elapsed time.
- Game resolution remains one action. Contact sounds follow each visual shot;
  the crowd announcement is emitted only during the first shot. Final arena
  damage summary and completion happen after the second shot.
- The second shot keeps full opacity to avoid briefly revealing the arena.
  Captions/phase labels have an explicit layer above composited card effects.

## Validation

- 327 tests passed, including seven new sequence tests and existing timing tests.
- Production build passed.
- 390×844 browser: first shot `card`, count 2, animated card art present, no paired
  fighters; second shot `fighters`, step 2, starts near progress 0.01/approach.
- Elbow action ends with enemy HP 94/100, energy 9/10, four hand cards and an
  enabled end-turn button: exactly one damage/cost/card-use application.
- Powerbomb screenshots show the restored card cinematic and following original
  fighter drop animation with readable technique/effect captions.
- SD mode still has one shot, `sd`, with the SD combat stage.
- Shortened original mode retains both 650ms shots with reduced motion; KO
  reaches MATCH WON after the full sequence. Full mode restored after testing.
- No browser runtime errors observed.

Screenshots: `01-card-art.jpg`, `02-fighter-replay.jpg`.
