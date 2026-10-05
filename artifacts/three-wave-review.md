# Three-wave arena implementation and independent review

Date: 2026-10-06 (Asia/Seoul)

## Engine changes

- Three complete circuits: wave 1 rookie, wave 2 contender, wave 3 champion. Each uses the connected 38-node, 6-lane, 8-stage route; total progression is 24 stages.
- Every path contains at least four pre-boss matches per wave, hence at least 15 victories including all three bosses to complete a new run.
- Distinct bosses: IRON REGENT 84 HP / 12 opening attack, guard-first pattern; SABLE QUEEN 124 HP / 14 attack, taunt-first pattern; EMPRESS 168 HP / 16 attack, longer pattern with consecutive attacks. Normal/elite base HP scales 1.00 / 1.12 / 1.24, with +0 / +1 / +2 attack by wave.
- Boss reward credits are 80 / 110 / 150. First two bosses enter `wave-clear`; only the third enters `victory`.
- `continueToNextWave` validates a living player, defeated boss and nonfinal intermission; grants at most 35% maximum HP and 25 stress reduction once, then starts the next circuit. Deck card instances, selected upgrade paths, money, unused items and unused gimmicks carry forward. A queued corner gimmick can be selected during intermission and activates once for the next opening match.
- Paid-removal prices carry across the run. Per-location service use is keyed by wave, so the matching local shop in wave two remains usable.
- Legacy terminal victories remain terminal and archiveable. Existing active encounters retain their exact enemy, draw order, cards, resources and seed while adopting wave one. Intermission saves normalize and resume deterministically.

## Executed engine checks

`node --test test/waves.test.mjs test/game.test.mjs test/run-mechanics.test.mjs`

Result: **34 tests passed, 0 failures**. Full output: `artifacts/three-wave-engine-test-results.txt`.

This includes:

- **20 completed three-wave public-action runs**: all ten wrestlers on seeds 20903 and 424242. Each ends at wave 3, local floor 8, with 24 recorded locations and three boss clears.
- **120 policy scenarios**: ten wrestlers × four seeds × safe/balanced/risk route policy. All terminate; all 40 balanced cases complete; both safe and risk routes can win; risk routes earn more while taking materially more damage.
- Eight focused wave tests cover boss stats/pattern escalation and route previews, every path's mandatory matches, once-only rewards/phase transitions, resource/upgrade carry, repeated/invalid continue actions, wave-specific removal, legacy saves, real public-action intermission/final fixtures and queued next-wave gimmicks.
- The DEV victory fixture actually plays all three circuits through public game actions. It ends after exactly 15 victories and retains upgraded cards; no HP, cards, coins, phase or boss victories are forged for that UI fixture.

## Independent touch and UI review

Inspected `HandInteraction.jsx`, `hand-interaction.js`, `RunJourney.jsx`, `route-gestures.js`, `WaveProgression.jsx`, the main run-loading / navigation integration and archive eligibility.

`node --test test/hand-interaction.test.mjs test/route-gestures.test.mjs`

Result: **32 tests passed, 0 failures**. Full output: `artifacts/three-wave-touch-review-results.txt`.

Confirmed:

- Taps use the painted card's x/y bounds and z-order; drags use stable exposed rails. A pointer leaving the original press target cannot complete a double tap. Different cards, large movement, long holds, multitouch and cancellation discard the armed pair.
- A card/route shows pressed, 1/2 armed and 2/2 confirmed stages. The 180 ms confirmed stage precedes exactly one commit; repeated input during the lock cannot duplicate an action. Hand commit rechecks playability and current lock.
- Timer cleanup covers changed hand/context/turn/energy, route context, unmount, outside pointer, blur and document hiding. Both ChampionRoad call sites receive modal/navigation context and lock flags.
- `wave-clear` is accepted by the normal save loader. The wave panel's next boss name, title and artwork come from actual next-wave metadata. Final archive eligibility requires the last wave for new runs; legacy winners without wave fields remain eligible.

Issues found and resolved during review:

1. Route intermission timer originally omitted modal/navigation context, permitting a pending route commit behind a keyboard-opened dialog. ChampionRoad now receives and observes context/lock props at both main call sites.
2. Hand pointer IDs could survive a global abort after pointer capture release. Global abort now clears the pointer set before canceling, so future touch IDs do not become permanently blocked.
3. Selecting a card moves it up 16 px; recomputing release hitboxes could change a stationary bottom-edge tap to the underlying card. The press rectangle is now frozen for the stationary release. The touch owner also checked the actual bottom-edge click in the browser.
4. Route pressed scaling changed the tile's release bounds and dropped border taps. Press feedback now uses brightness/outline without moving the target.
5. Intermission inventory initially excluded corner-gimmick staging. Engine and inventory UI now allow it, covered by the next-wave opening test.

No remaining actionable findings in the reviewed paths. Browser screenshot/viewport/gesture observations are recorded separately by the root and touch owners; the reviewer did not claim physical Safari-device verification.
