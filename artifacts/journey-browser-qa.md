# Branching journey and combat presentation verification

Checked with the actual React application in the Codex in-app browser. Explicit DEV fixtures use the real engine and controls, skip ordinary run persistence, and are absent from the production build.

## Combat layout

Both five-card and ten-card hands passed at 320×720, 393×852, 667×375, 844×390 and 1280×720. All cards, both complete fighter images, the use button and the end-turn button were inside the viewport. Every exposed card rail was reachable by pointer hit-testing. Hand scroll width equaled its client width; the document had no combat overflow. The page contained no canvas. Measurements are in [the geometry record](journey-fan-geometry.json).

Tapping a ten-card rail selected Sit-out Powerbomb without changing energy, hand size or starting a cinematic. The explicit use button spent two energy, removed the card, dealt 17 damage and added five block. Portrait and landscape proof: [393×852](journey-fan-393x852.jpg), [667×375](journey-fan-667x375.jpg).

## Fighting-game reactions

An incoming 18-point attack with 30 block displayed `BLOCK`, absorbed 18, preserved 72 HP and locked combat input while the reaction played. Without block, it displayed `HEAVY HIT −18` and changed HP from 72 to 54. Both are based on engine contact data: [guard](journey-guard.jpg), [hit](journey-hit.jpg). A winning strike against one remaining HP reported one damage and KO, then opened the real reward screen. The enlarged [technique scene](journey-technique-focus.jpg) uses its dedicated card illustration.

The shortened setting showed a static technique image and actual results. Automated presentation tests verify that shortened/reduced motion omits whole-image displacement and flashing, and that damage from mental pressure or a subsequent healing tick cannot be misreported as physical contact.

## Journey presentation

The graph contains 26 nodes across eight floors. The first victory offered four actual connected choices; future nodes were disabled. A room entry showed the complete Viper illustration over a generated environment, then dialogue and a separate choice screen. Advancing dialogue did not spend the rest action. [Locker-room cutscene](journey-lockerroom.jpg).

The first map review exposed an inspector covering graph nodes. Its layout was corrected before release. The final wide view puts the inspector in its own sidebar, and smaller screens place it below the graph. Four available node centers were pointer-targetable after the fix; the graph has 58 connections. Selecting `f2-1` showed the locker-room inspector, and selecting `f2-2` on a 393px screen showed Backstage before confirmation. [Corrected full route](journey-road.jpg).

A Backstage entry used one complete actor image. At 667×375, actor and dialogue occupied separate columns and both cutscene controls were inside the viewport. Skipping left the event choices unresolved. Choosing the victory promise increased credits by 40 and pressure by 10, which appeared in the result feedback. The connected choices became `f3-1`, `f3-2` and `f3-3`; selecting and confirming the shop entered `f3-2`. [Backstage cutscene](journey-event.jpg).

In the real shop, buying energy gel (40), tactical tape (35) and Spotlight Corner (55) reduced credits from 155 to 25. Inventory showed three one-use items and one stored corner. Reserving the corner showed its benefit, enemy attack +2 tradeoff and next-match status. Entering the connected `f4-3` hardcore match consumed the stored corner and activated its effect. The arena explicitly showed the one-match duration; heat became five on entry and six on the next turn. [Inventory and reservation](journey-inventory.jpg).

After a real 16-point attack, using the medical icepack restored the capped 16 HP and reduced pressure by five. Its inventory slot disappeared (three items became two), while the Spotlight Corner remained active in round two. The item toast reported the actual amounts. Automated tests additionally cover each of the six items, both win/defeat corner expiry, reload persistence, full-capacity rejection and unaffordable event costs.

The original local saved run was still Viper at 71/72 HP, enemy Iron Rose at 15/47 HP, zero energy and round one after DEV checks. Restoring the ordinary URL retained those values and added exactly one migration starter item. The original full-cinematic preference was restored.

Final local validation: 78/78 tests, production build with `/slay/` base, and diff whitespace checks passed. Built JavaScript contains none of the DEV fixture query names or fixture UID strings.
