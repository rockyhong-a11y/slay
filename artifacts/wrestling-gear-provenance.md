# Wrestling props and championship belt update

Created 2026-10-06 for SLAY. All 15 assets are original, self-contained native SVG illustrations authored for this project in `tools/build-wrestling-gear.mjs`. No photographs, remote images, copied branding, external fonts or embedded scripts are used. Reproduce with `node tools/build-wrestling-gear.mjs`.

## Prop set

Each prop is a 512 × 384 transparent vector illustration with shaped silhouettes, directional metal/cloth/wood shading, hardware details and a soft grounding shadow.

| Legacy saved ID | Current prop | Asset | Behavior preserved |
| --- | --- | --- | --- |
| icepack | 메디컬 아이스팩 | equipment/icepack.svg | Heal 18, calm 5; once |
| energygel | 링벨 | equipment/ringbell.svg | Energy +2, stress +4; once |
| resin | 폴딩 체어 | equipment/chair.svg | Block 15; once |
| smokespray | 죽도 | equipment/kendostick.svg | Weak 2, vulnerable 1; once |
| crowdwhistle | 링사이드 마이크 | equipment/microphone.svg | Hype +2, calm 4; once |
| trainingtape | 레슬링 손목 테이프 | equipment/wristtape.svg | Draw 2, next attack +4; once |
| ironcorner | 턴버클 패드 | equipment/turnbuckle.svg | Start block 7, turn block 2, opening draw −1; one match |
| spotlightcorner | 스틸 래더 | equipment/ladder.svg | Start hype 2, turn hype 1, opponent attack +2; one match |
| grappleclinic | 브레이크어웨이 테이블 | equipment/table.svg | Grapple damage +3, starting stress +8; one match |
| speedcorner | 링 로프 | equipment/ringrope.svg | Turn energy +1, card block ×0.6; one match |
| icecorner | 코너 스툴 | equipment/stool.svg | Turn healing 3, damage −2; one match |
| mindcorner | 레플리카 챔피언 벨트 | equipment/replica-belt.svg | Turn calm 5, nightmare pressure immunity, opponent HP ×1.2; one match |

No prices, effect magnitudes, loot pool lengths, saved IDs or RNG calls changed. Saved shop descriptions and current known event text update without changing prices, sold state or effects. Chairs, kendo sticks and tables request a crowd boo; the other tools request a cheer. Item use records the response in `lastImpact.crowdReaction`.

## Earned championships

Three separate 1400 × 640 illustrated title belts: stitched black leather straps, decorative side plates, engraved central plates, ranked crowns, gems and copper/silver/gold finishes. The entrance replica above is a finite tactical tool; these three belts are cosmetic earned trophies and never grant passive combat bonuses.

- Wave 1 / IRON REGENT → Rookie Champion, bronze/copper and orange gems.
- Wave 2 / SABLE QUEEN → Contender Champion, silver/navy and blue gems.
- Wave 3 / EMPRESS → World Champion, gold/plum and ruby gems.

The engine stores `championshipBelts` alongside `waveClears`, deduplicating by belt ID. Old three-wave saves recover their actual clear records; a legacy single-wave victory recovers only its defeated boss's trophy. Cross-run collection lives in `slay-championship-belts-v1`, independent of the active run and deck archive. It holds three unique title discoveries and the first wrestler/date. Repeated effects or wins do not duplicate records or overwrite original award dates. Storage failures report failure and retain the previously persisted collection.

## Validation

`test/championship-belts.test.mjs` covers real public-action first/final boss clears, retained trophies across waves, no award before a win, legacy recovery with unchanged gameplay state, repeated normalization, independent collection storage and duplicate suppression, malformed/future storage, blocked writes, old item/shop ID compatibility, and all 15 distinct local SVGs. Full suite: 197 tests passed when this engine/asset handoff was completed. Output: `artifacts/wrestling-gear-tests.txt`.

Desktop browser verification at 1280 × 720: opened the actual first-wave clear screen and confirmed the bronze title award was fully visible; opened the inventory and confirmed 1 / 3 with remaining trophies locked. Opened the real public-action final victory fixture and confirmed all three differentiated titles, 3 / 3, and earned status. Screenshot: `artifacts/championship-belts-desktop.png`. No viewport override was applied. Root is performing mobile and final integrated verification.
