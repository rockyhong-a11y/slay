# Three waves, upgrade branches and touch feedback — 2026-10-06

Browser: Codex in-app Chromium, local Vite build. Pointer interactions and responsive viewport checks; this is not a physical iOS-device test. DEV journey fixtures use the same public game actions and do not overwrite the normal saved run.

## Upgrade flow

- 393 × 852: locker-room training opens the card picker; choosing Powerbomb opens three distinct paths. Corrected the retained card-grid scroll position by resetting modal scroll and heading focus when the upgrade target changes.
- Selecting Swift Bomb displays the selected state and a sticky enabled confirmation button. Confirming upgrades the card and returns to the map, consuming that locker-room action.
- 1280 × 800: the shop's personal training offers Powerbomb's Last Ride, Crash and Cover, and Swift Bomb side by side. Cancelling after selecting a path leaves the displayed balance at 115.
- Reopening and confirming Crash and Cover reduces the balance to 70 once; training is disabled afterward. The deck shows Powerbomb +, the chosen label, damage 24, combo bonus 7, block 10, and weak 1.
- Searching the library for the branch name “스위프트 밤” finds Powerbomb. Its detail view lists all three branches and their actual effects.
- Evidence: `upgrade-choice-mobile.png`, `upgrade-choice-desktop.png` (screenshots are local, ignored by Git).

## Wave progression and layout

- A real first-boss win renders the intermediate screen with Iron Regent defeated, the three-wave ladder, Sable Queen next, 15 cards / 3 upgrades / 1 consumable carried, and recovery information.
- Clicking the Wave 2 button enters a real normal battle. Header displays W2/3, intermediate difficulty; credits remain 300 and player health is 74/74.
- 393 × 852 and 844 × 390: fighters, overlapping hand, energy and end-turn controls remain on one screen. Document width/height equals the viewport; no page overflow in the landscape check.
- A real three-wave fixture reaches final victory against Empress (0/168 HP), displays W3/3, and offers completed-deck saving only at this terminal stage.
- Evidence: `wave-two-mobile.png`, `wave-two-landscape.png`.

## Verification

- Browser console: no warnings or errors in the tested flows.
- Full suite: 191 passing tests, including all 132 branch effects, persistence, transition rejection, route invariants, and touch cancellation cases.
- Production `/slay/` build passed; DEV fixture names absent from generated JavaScript.
- See `touch-feedback-qa.md` and `three-wave-review.md` for independent gesture and engine checks.
