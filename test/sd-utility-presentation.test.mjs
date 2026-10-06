import test from "node:test";
import assert from "node:assert/strict";
import {
  getCard,
  getCardUpgradeOptions,
  newRun,
  playCard,
} from "../src/game.js";
import { getLibraryCards } from "../src/card-library.js";
import { createCardCue, createArenaImpact } from "../src/presentation.js";
import { techniqueEffectLayers } from "../src/technique-effects.js";
import { createCombatQA } from "../src/combat-qa.js";

const ids = [
  "wristlock",
  "hammerlock",
  "omoplata",
  "octopushold",
  "surfboard",
  "stf",
  "toehold",
  "calfslicer",
  "bowandarrow",
  "abdominalstretch",
];

test("SD utility discovery returns precisely ten new holds while preserving all eighteen utilities", () => {
  const cards = getLibraryCards({ type: "sdutility" });
  assert.deepEqual(cards.map((c) => c.id).sort(), [...ids].sort());
  assert.equal(getLibraryCards({ type: "utility" }).length, 18);
  assert.deepEqual(
    getLibraryCards({ search: "SD" })
      .map((c) => c.id)
      .sort(),
    [...ids].sort(),
  );
  assert.equal(
    getLibraryCards({ type: "sdutility", discipline: "throw" }).length,
    0,
  );
  assert.equal(
    getLibraryCards({ type: "sdutility", rarity: "rare" }).length,
    1,
  );
  for (const c of getLibraryCards({
    type: "sdutility",
    upgraded: true,
    upgradePath: "flow",
  })) {
    assert.equal(c.artStyle, "sd2d");
    assert.equal(c.disciplineSlug, "submission");
    assert.equal(c.art, `cards/${c.id}.webp`);
    assert.equal(c.upgradeOptions.length, 3);
    assert.equal(
      c.cost,
      getCard({ id: c.id, upgraded: true, upgradePath: "flow" }).cost,
    );
    assert.match(c.acquisition, /보상.*숍/);
  }
});

test("all fifty SD card variants keep their real hold illustration and resolved resources without fake damage", () => {
  const variants = new Set();
  for (const id of ids) {
    for (const upgrade of [
      { upgraded: false },
      { upgraded: true },
      ...getCardUpgradeOptions(id).map((p) => ({
        upgraded: true,
        upgradePath: p.id,
      })),
    ]) {
      const before = newRun("lynx", 91827);
      before.activeGimmick = null;
      before.hand = [{ id, uid: "sd-utility", ...upgrade }];
      before.draw = Array.from({ length: 6 }, (_, i) => ({
        id: "guard",
        uid: `reserve-${i}`,
        upgraded: false,
      }));
      before.deck = structuredClone([...before.hand, ...before.draw]);
      before.discard = [];
      before.exhaust = [];
      before.energy = 3;
      before.enemy.hp = before.enemy.maxHp = 200;
      before.enemy.block = 9;
      const after = playCard(before, before.hand[0].uid);
      const cue = createCardCue(before, after, before.hand[0]);
      assert.equal(cue.art, `cards/${id}.webp`);
      assert.equal(cue.artStyle, "sd2d");
      assert.equal(cue.attacking, false);
      assert.equal(cue.damage, 0);
      assert.equal(cue.absorbed, 0);
      assert.equal(after.enemy.hp, 200);
      assert.equal(after.enemy.block, 9);
      assert.deepEqual(cue.camera.impacts, []);
      assert.equal(cue.camera.hitstop, 0);
      assert.equal(cue.effect.family, "tactics");
      assert.ok(cue.camera.portrait.field >= 0.96);
      assert.ok(cue.camera.scale.every((scale) => scale <= 1.04));
      assert.equal(createArenaImpact(cue), null);
      assert.ok(
        !cue.results.some((r) => ["damage", "blocked"].includes(r.kind)),
      );
      assert.ok(
        techniqueEffectLayers(cue.effect, cue.camera, cue).every(
          (l) => !/[Bb]urst|[Cc]rack|[Dd]ebris/.test(l.kind),
        ),
      );
      variants.add(cue.effect.variant);
      const definition = getCard(before.hand[0]);
      if (definition.effects.draw)
        assert.equal(
          cue.results.find((r) => r.kind === "draw").value,
          definition.effects.draw,
        );
      if (definition.effects.energy)
        assert.equal(
          cue.results.find((r) => r.kind === "energy").value,
          definition.effects.energy,
        );
      if (definition.effects.nextCardDiscount)
        assert.equal(
          cue.results.find((r) => r.kind === "discount").value,
          definition.effects.nextCardDiscount,
        );
    }
  }
  assert.equal(variants.size, 10);
});

test("isolated SD utility QA fixture exposes the ten real cards with a playable resource sequence", () => {
  const before = createCombatQA({
    hand: 10,
    actor: "lynx",
    impact: "sdutility",
  });
  assert.deepEqual(
    before.hand.map((c) => c.id),
    ids,
  );
  assert.equal(before.energy, 3);
  const after = playCard(before, before.hand[0].uid);
  assert.equal(after.status.nextCardDiscount, 1);
  assert.equal(after.hand.length, 9);
  assert.equal(before.hand.length, 10);
  assert.equal(after.energy, 3);
});
