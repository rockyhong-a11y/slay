# Deckbuilding and navigation verification — 2026-10-05

## Result

SHIP. Local production build succeeds; 163 engine, archive, navigation, interaction and presentation tests pass. No unresolved issue in the independent review. Browser checks below used the actual React UI in the Codex Chromium browser. Physical iOS Safari was not available; its null-relatedTarget blur sequence is locked down by a regression test that failed before the fix.

## Navigation

- All six hamburger destinations open at 393×852; outside pointer, keyboard Enter/Escape and focus transitions work.
- Page → modal → browser Back/Forward → close returns to the appropriate page. `#roster` opens the roster directly and still opens after reload.
- The menu no longer hides its submenu during the null blur emitted by Safari button taps. Non-focusable outside taps still dismiss it.
- Existing route double-tap remains operational: the new `f2-4` shop was reached with a real double click.
- See [navigation regression details](navigation-regression-qa.md).

## Routes and removal

- 38 nodes, 92 connections, 950 complete paths. Exhaustive graph test: all paths include at least four pre-boss fights, at floors 1, 3, 5, 7; optional extra fights give up to seven. A support-seeking engine run also has four wins on entering the final.
- Shop UI: selected the first card from a ten-card DEV deck. Confirmation removed one card, the visible credit balance changed from 115 to 55, and the service became unavailable. Result feedback reports nine remaining cards.
- Locker room: dismissed arrival, selected Rope Guard and confirmed. Returned to the map with the removal result, using up this location's choice.
- Backstage event: dismissed arrival, selected Headlock and confirmed. Returned to the map with the removal result; alternative event rewards were not granted.
- Tests cover duplicate instances, exact UID removal from all piles, invalid phase/UID, one use per location, insufficient funds, minimum five cards, upgrade preservation, legacy route and save migration.
- [Removal screen](deck-removal-393x852.png), [expanded route](champion-road-required-fights.png).

## Champion decks

- `qaJourney=victory` uses public engine actions from Raven seed 23: 8 floors, 5 wins including the boss, 16 cards with 3 upgrades. It does not set victory, HP or cards directly.
- Saved this real completed fixture through the UI as “레이븐 · 관절기 챔피언”. Confirmation became “저장된 클리어 덱”; archive count became 1/20.
- Opened entry preparation and selected the saved 16-card deck. Started the arena: Raven HP 74/74, 80 credits, turn 1, opening supplies, 16 cards total. Upgraded Sharpshooters were present in the opening hand and all 16 cards were visible in My Deck.
- The archive persisted through reload. Choosing Valkyrie displayed only her default eleven-card deck and a clear empty-archive message; Raven's archive was not offered to her.
- Archive tests cover all ten characters, exact duplicate counts/upgrades, fresh run state/UIDs, capacity 20, idempotence, damaged input, storage denial and failed writes without a false success result.
- The DEV archive uses sessionStorage, separate from the player's production localStorage archive; fixture runs do not write the active-run save.
- [Desktop selection](champion-deck-loadout-desktop.png), [393×852](champion-deck-loadout-393x852.png), [844×390](champion-deck-loadout-844x390.png), [320×720](champion-deck-loadout-320x720.png).

## Layout and scope

- 393×852: document dimensions exactly match the viewport; dialog bounds (19,12)–(374,840); selected deck is visible and no error alert appears.
- 320×720: document dimensions exactly match the viewport; dialog bounds (19,12)–(301,708); entry button bounds (42,648.5)–(278,695). Reference/card contents scroll inside the dialog.
- 844×390 landscape and 1280×800 desktop were visually inspected. Landscape character header was compacted to leave more room for deck choices.
- Browser console errors: none. Production JS contains no `qaJourney`, `qaHand`, or fixture error strings. Existing full-page scroll and mobile gesture guards remain in place.
- No blanket accessibility or real-device Safari certification is claimed. New controls have labels, selected/disabled states, explicit permanent-removal confirmation and an editable deck name.

## Reproduce

`npm test` and `BASE_PATH=/slay/ npm run build`.

Development-only UI fixtures: `?qaJourney=shop`, `rest`, `event`, `map`, `victory`; `?qaHand=5#roster` for menu/direct-link checks.
