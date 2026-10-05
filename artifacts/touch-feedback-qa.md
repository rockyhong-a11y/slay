# Touch feedback and accidental activation regression check

## Diagnosis and regression loop

Command: `node --test test/hand-interaction.test.mjs test/route-gestures.test.mjs`.

The initial run failed four new regressions (see `touch-feedback-before.txt`):
1. A visible raised card was mapped to the covered neighbor's horizontal rail.
2. Releasing outside a card inherited the original UID and could complete a pair.
3. Distant taps on one large card could trigger autoplay.
4. Distant taps on one route tile could trigger entry.

The final focused run passes 32 tests (`touch-feedback-after.txt`). Additional regressions cover expiry, context resets, spatial tolerance, different-card arming before React selection, and a stationary press whose artwork rises before release.

## Final behavior

- Taps hit the actual visible two-dimensional card, resolving paint order; intentional drags retain stable horizontal rails.
- A clean press owns its original card rectangle until release so the 16px lift cannot change a stationary tap's target.
- Cards and routes require the same target within 420ms and within 28px. Movement, long press, cancellation, multi-pointer input, context changes and hidden windows invalidate armed taps.
- The first tap shows a named gold `1/2` selection. Expiry returns to a selected-only label. The second valid tap shows a green `2/2` confirmation for 180ms before one action; the action is locked against duplicate taps.
- Card action callbacks are read fresh; context includes wave/floor/turn/phase/energy/modal/navigation. Route context includes modal/navigation lock and wave/floor/phase.
- Pointer bookkeeping and timers clear on blur, visibility changes, context changes and unmount. Blocked cards display the concrete energy/heat condition.
- Route pressed feedback changes brightness, avoiding a shrinking hitbox near tile edges. Reduced motion keeps static acknowledgement.

## Actual browser checks

CUA / Chromium in-app browser; DEV-only fixtures, ordinary save untouched.

At 393×852 with ten cards:
- `[100,650]` visibly belongs to raised Elbow (`qa-hand-1`) but used to map to Powerbomb's rail. One tap now selects Elbow with `1/2`; a double tap shows `2/2`, consumes exactly one card (10→9) and deals its expected six damage (100→94).
- Waiting past the tap window shows selected-only feedback and retains all ten cards.
- Drag `[100,650]→[230,650]` selects Ankle Lock (`qa-hand-9`) and does not play it.
- Tapping Championship Drive shows `열기 3 필요` while retaining all ten cards.
- A stationary bottom-edge tap `[100,785]` selects Powerbomb and shows `1/2` even though it rises before release.
- Selected card top 566px; host top 564px. The raised artwork remains within the clipped hand; document client/scroll dimensions both 393×852.

At default 1280×720 route view:
- First tap on `f2-4` shows `프로 숍 · 1/2 · 같은 곳을 한 번 더 탭`.
- A valid second pair shows node `confirmed`, green `✓ 이동` badge, inspector `✓ 2/2 · 이동 확정`, and disabled `이동 확정` button.
- The requested shop opens once after acknowledgement; no credits are spent merely entering.
- Final browser console errors: none.

Evidence: `touch-feedback-browser.json`, `touch-feedback-hand.png`, `touch-feedback-blocked.png`, `touch-feedback-route.png`, `touch-feedback-route-confirmed.png`.

Temporary viewport override reset; agent-created tab closed. Physical iOS/Safari was not available; multitouch/long-press/cancel/context edges are state-machine regressions plus source lifecycle review, not claimed as real-device observations.
