import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, WRESTLERS } from "../src/game.js";
import {
  randomPreviewOpponent,
  createAnimationPreview,
} from "../src/animation-preview.js";

test("random preview opponents cover the other nine wrestlers and never mirror the selected actor", () => {
  for (const actor of Object.keys(WRESTLERS)) {
    const choices = new Set(
      Array.from({ length: 9 }, (_, i) =>
        randomPreviewOpponent(actor, () => (i + 0.5) / 9),
      ),
    );
    assert.equal(choices.size, 9);
    assert.ok(!choices.has(actor));
    assert.deepEqual(
      [...choices].sort(),
      Object.keys(WRESTLERS)
        .filter((id) => id !== actor)
        .sort(),
    );
  }
});

test("every wrestler can preview every real card, including finishers, utility and nightmares, without browser storage", () => {
  for (const actor of Object.keys(WRESTLERS))
    for (const cardId of Object.keys(CARDS)) {
      const result = createAnimationPreview(actor, cardId, {
        random: () => 0.45,
        id: `${actor}-${cardId}`,
        now: 1234,
      });
      assert.ok(result, `${actor}/${cardId}`);
      assert.notEqual(result.opponent, actor);
      assert.equal(result.cue.id, `${actor}-${cardId}`);
      assert.equal(result.cue.startedAt, 1234);
      assert.equal(result.cue.cardId, cardId);
      assert.ok(
        result.cue.results.length > 0,
        `${actor}/${cardId}: resolved results`,
      );
      assert.equal(result.cue.attacking, !!CARDS[cardId].effects.damage);
      if (CARDS[cardId].utility) {
        assert.equal(result.cue.damage, 0);
        assert.deepEqual(result.cue.camera.impacts, []);
      }
      if (CARDS[cardId].effects.damage) assert.ok(result.cue.damage > 0);
    }
  assert.equal(createAnimationPreview("missing", "strike"), null);
  assert.equal(createAnimationPreview("atlas", "missing"), null);
});

test("preview results use the selected wrestler's actual combat passive", () => {
  const regular = createAnimationPreview("nova", "strike").cue.damage;
  assert.ok(createAnimationPreview("raven", "strike").cue.damage > regular);
  assert.ok(
    createAnimationPreview("atlas", "powerbomb").cue.damage >
      createAnimationPreview("nova", "powerbomb").cue.damage,
  );
});
