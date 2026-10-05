# Mobile navigation regression QA

## Root cause and red/green signal

The old `details.onBlur` closed the menu whenever `relatedTarget` was outside, including `null`. A Safari-style tap can blur the summary without focusing the tapped submenu button. Hiding details before the final click prevents navigation. The exact existing callback was first extracted into `dismissNavigationOnBlur` without behavior changes.

`node --test test/navigation.test.mjs` initially failed the regression:

```
submenu must survive blur until activation
false !== true
1 pass / 1 fail
```

The fix ignores unknown/null blur destinations. A document capture-phase pointerdown explicitly dismisses real outside taps; keyboard focus leaving the menu still closes it. Escape and Enter remain native. No pointer event is prevented or stopped by the new helper. Listener cleanup is covered.

Secondary routing issue fixed: #deck, #roster, and #inventory now resolve as modal destinations, preserve the underlying page in browser history, and clear their hash on close. Unknown hashes fall back to the arena.

Final targeted command: `node --test test/navigation.test.mjs test/mobile-interactions.test.mjs` — 15/15 passed.

## Browser checks

Actual CUA-driven Chromium in-app browser on the isolated local Vite fixture `http://127.0.0.1:5174/?qaHand=10&qaActor=viper` (QA fixture does not persist the run).

- 393 × 852: all six hamburger items clicked successfully: arena, champion road, deck, roster, card encyclopedia, corner inventory.
- Deck/roster/inventory use their expected hashes and rendered their intended dialogs.
- Map → Deck → browser Back restored map without a dialog; Forward restored deck; Close restored map hash.
- A tap on the non-focusable credits display closed the menu.
- Enter opened the menu and activated Deck; Escape closed the menu.
- 844 × 390: corner inventory opened from the hamburger menu. Document size remained exactly 844 × 390 (no outer overflow).
- Console errors: none at the end of the checks.
- The same old normal Chromium click succeeded before the change, so the bug was not a general layering/pointer interception issue. The Safari null-focus event sequence is covered by the deterministic regression test; this session did not operate a physical iOS device.

Screenshots:
- `artifacts/navigation-deck-393x852.png`
- `artifacts/navigation-inventory-844x390.png`

Temporary viewport override reset after checks. The root task will verify the newly coordinated initial modal/hash resolver after completing its entry/loadout UI.
