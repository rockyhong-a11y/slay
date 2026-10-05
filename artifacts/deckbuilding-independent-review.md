# Deckbuilding and navigation independent review

Reviewed the current route, migration, removal, archive, entry UI and navigation changes against the four requested behaviors.

## Findings corrected during review

1. Fresh browsers initially opened the wrestler modal even for explicit #cards/#guide/#map URLs. The initial entry prompt is now restricted to the arena route, while modal hashes retain priority.
2. Successful archive deletion returned a message which was rendered as a red error alert. The loadout now renders archive fallback messages only for failed/recovered loads; successful operation feedback remains in its toast.

Both changes were inspected in the final root-owned `src/main.jsx`.

## Validation

`node --test test/deck-archive.test.mjs test/route-removal.test.mjs test/navigation.test.mjs`: **25/25 passed**.

- Every graph path crosses the mandatory match stages; all 38 nodes remain reachable and continue to the boss.
- Support seeking requires four pre-boss wins. Unavailable/forged next nodes remain rejected.
- Old support-heavy progress retains resources, card instances, offers, seed and active encounter. Additional read-only probes for 4/5/6 prior victories across combat, reward, map, shop, rest and event phases preserved opponent and PRNG state and were idempotent on a second normalization. Rewards/maps after sufficient wins map to stage 7; existing support visits map to stage 6 and then require a final qualifier. No reroll or lost offered reward was found.
- Card removal selects one UID, scrubs every pile, preserves duplicates, enforces the five-card minimum and shop limits, and consumes rest/event choices.
- Completed decks preserve exact quantities/upgrades and actor identity; fresh runs rebuild resources, UIDs, piles, passives and encounters.
- Archive capacity, duplicate saves, corrupt entries, unsupported schemas and failed persistence are covered by explicit tests.
- The UI starts a run only after deck confirmation, and removal presents a concrete card and cost before commitment. Cancellation leaves the engine unchanged.

No unresolved blocker found. Actual iOS device input was not exercised; the Safari null-focus sequence has a deterministic red/green regression, with real Chromium mobile-size navigation checks recorded separately in `navigation-regression-qa.md`.

## Documentation

Updated README, GAME_DESIGN and in-game help for the 38-node/six-lane graph, four mandatory matches, permanent removal costs and opportunity cost, five-card minimum, completed-deck storage and the player-then-deck entry flow. Removed the stale hardcoded test count and identified prior balance artifacts as historical graph measurements.
