import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CARDS, getCard } from "../src/game.js";
import {
  CARD_DETAILS,
  CARD_DISCIPLINES,
  CARD_TYPE_LABELS,
  CARD_RARITY_LABELS,
  getCardDetail,
  getLibraryCards,
} from "../src/card-library.js";

test("the encyclopedia covers every real engine card with unique technique art and acquisition", () => {
  assert.deepEqual(Object.keys(CARD_DETAILS).sort(), Object.keys(CARDS).sort());
  assert.equal(getLibraryCards().length, 50);
  const paths = new Set();
  for (const [id, definition] of Object.entries(CARDS)) {
    const detail = getCardDetail(id);
    assert.equal(detail.art, `cards/${id}.webp`);
    assert.ok(detail.alt.length > 15, id);
    assert.ok(detail.technique.length > 30, id);
    assert.ok(detail.acquisition.length > 10, id);
    assert.ok(
      CARD_DISCIPLINES.some(
        (d) => d.id === detail.disciplineSlug && d.label === detail.discipline,
      ),
    );
    assert.ok(CARD_TYPE_LABELS[definition.type]);
    assert.ok(CARD_RARITY_LABELS[definition.rarity]);
    paths.add(detail.art);
  }
  assert.equal(paths.size, 50);
  assert.equal(getCardDetail("not-a-card"), null);
  assert.equal(
    getCardDetail({ id: "strike", upgraded: true }),
    CARD_DETAILS.strike,
  );
});

test("physical technique discipline stays separate from engine card type", () => {
  assert.equal(CARD_DISCIPLINES.length, 8);
  const throws = getLibraryCards({ discipline: "throw" }).map((c) => c.id);
  assert.deepEqual(
    throws.sort(),
    [
      "suplex",
      "powerbomb",
      "championship",
      "sitoutpowerbomb",
      "jackknifepowerbomb",
      "popuppowerbomb",
      "gutwrenchpowerbomb",
      "foldingpowerbomb",
      "bodyslam",
      "powerslam",
      "sidewalkslam",
      "spinebuster",
      "bellysuplex",
      "snapsuplex",
      "samoandrop",
    ].sort(),
  );
  assert.equal(CARD_DETAILS.finisher.disciplineSlug, "strike");
  assert.equal(CARD_DETAILS.championship.disciplineSlug, "throw");
  assert.deepEqual(
    getLibraryCards({ type: "finisher" })
      .map((c) => c.id)
      .sort(),
    ["finisher", "championship", "sharpshooter"].sort(),
  );
  assert.deepEqual(
    getLibraryCards({ discipline: "submission" })
      .map((c) => c.id)
      .sort(),
    [
      "ironclad",
      "headlock",
      "reversal",
      "armbar",
      "kimura",
      "americana",
      "anklelock",
      "kneebar",
      "heelhook",
      "figurefour",
      "bostoncrab",
      "sharpshooter",
      "crossface",
    ].sort(),
  );
  assert.equal(CARD_DETAILS.moonsault.disciplineSlug, "aerial");
});

test("all 50 technique illustrations exist as distinct WebP files", () => {
  const hashes = new Set();
  for (const detail of Object.values(CARD_DETAILS)) {
    const bytes = readFileSync(
      new URL(`../public/assets/${detail.art}`, import.meta.url),
    );
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", detail.id);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", detail.id);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(hashes.size, Object.keys(CARDS).length);
});

test("upgraded move descriptions retain combo prerequisites and extra combo", () => {
  assert.match(
    getCard({ id: "powerbomb", upgraded: true }).description,
    /콤보 2 이상이면 피해 \+9/,
  );
  assert.match(
    getCard({ id: "doubletap", upgraded: true }).description,
    /콤보 \+1/,
  );
  assert.match(
    getCard({ id: "finisher", upgraded: true }).description,
    /열기 3 소모/,
  );
});

test("search, type, discipline, and rarity filters combine without hiding nightmares by default", () => {
  assert.ok(getLibraryCards().some((c) => c.id === "nightmare"));
  assert.deepEqual(
    getLibraryCards({ search: "  GERMAN SUPLEX  " }).map((c) => c.id),
    ["suplex"],
  );
  assert.deepEqual(
    getLibraryCards({ search: "파이어맨스 캐리" }).map((c) => c.id),
    ["championship"],
  );
  assert.deepEqual(
    getLibraryCards({ search: " KIMURA LOCK ", discipline: "submission" }).map(
      (c) => c.id,
    ),
    ["kimura"],
  );
  assert.deepEqual(
    getLibraryCards({ type: "finisher", discipline: "submission" }).map(
      (c) => c.id,
    ),
    ["sharpshooter"],
  );
  assert.deepEqual(
    getLibraryCards({
      discipline: "throw",
      type: "finisher",
      rarity: "rare",
    }).map((c) => c.id),
    ["championship"],
  );
  assert.equal(getLibraryCards({ search: "없는 기술" }).length, 0);
  assert.ok(
    getLibraryCards({ type: "skill", discipline: "defense" }).every(
      (c) => c.type === "skill" && c.disciplineSlug === "defense",
    ),
  );
});

test("base and upgraded library views read exact effects from the engine without mutation", () => {
  const before = JSON.stringify(CARDS);
  for (const upgraded of [false, true]) {
    for (const library of getLibraryCards({ upgraded })) {
      const engine = getCard({ id: library.id, upgraded });
      assert.equal(library.name, engine.name);
      assert.equal(library.cost, engine.cost);
      assert.equal(library.description, engine.description);
      assert.deepEqual(library.effects, engine.effects);
      assert.equal(library.exhaust, engine.exhaust);
    }
  }
  assert.equal(JSON.stringify(CARDS), before);
  const nightmare = getLibraryCards({ upgraded: true, type: "nightmare" })[0];
  assert.equal(nightmare.onDrawStress, 3);
  assert.equal(nightmare.effects.calm, 14);
});
