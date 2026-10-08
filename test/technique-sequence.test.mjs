import test from "node:test";
import assert from "node:assert/strict";
import { newRun, playCard } from "../src/game.js";
import { createCardCue } from "../src/presentation.js";
import { techniqueSequence } from "../src/technique-sequence.js";
import { cuePlayback, cueEventPlan } from "../src/cue-timing.js";
import { classicCombatFrame } from "../src/classic-combat.js";

function resolvedCue(cardId) {
  const before = newRun("raven", 314159);
  before.activeGimmick = null;
  before.hand = [{ id: cardId, uid: "sequence-card", upgraded: false }];
  before.draw = [{ id: "guard", uid: "sequence-next", upgraded: false }];
  before.deck = structuredClone([...before.hand, ...before.draw]);
  before.energy = 10;
  before.player.hype = 9;
  before.enemy.hp = before.enemy.maxHp = 300;
  before.enemy.block = 0;
  const after = playCard(before, "sequence-card");
  return {
    after,
    cue: {
      ...createCardCue(before, after, before.hand[0]),
      id: 42,
      startedAt: 1000,
    },
  };
}

function freeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

test("original mode presents full card art before the paired wrestlers on contiguous clocks", () => {
  for (const cardId of [
    "strike",
    "powerbomb",
    "guard",
    "kimura",
    "wristlock",
  ]) {
    const { cue } = resolvedCue(cardId);
    const shots = techniqueSequence(cue);
    assert.deepEqual(
      shots.map((shot) => shot.kind),
      ["card", "fighters"],
      cardId,
    );
    assert.equal(shots[0].cue.startedAt, cue.startedAt, cardId);
    assert.equal(shots[1].cue.startedAt, cue.startedAt + cue.duration, cardId);
    assert.equal(shots[1].cue.duration, cue.duration, cardId);
    assert.notEqual(shots[0].cue.id, shots[1].cue.id, cardId);
    assert.equal(
      shots[0].cue.art,
      cue.art,
      `${cardId}: original card illustration`,
    );
    assert.equal(
      shots[1].cue.artStyle,
      cue.artStyle,
      `${cardId}: source style metadata`,
    );
  }
});

test("both original shots reuse the resolved action without changing its effects or run state", () => {
  for (const cardId of [
    "strike",
    "powerbomb",
    "guard",
    "kimura",
    "wristlock",
  ]) {
    const { cue, after } = resolvedCue(cardId);
    const originalCue = structuredClone(cue);
    const originalState = structuredClone(after);
    freeze(cue);
    freeze(after);
    for (const shot of techniqueSequence(cue)) {
      const { id, startedAt, duration, ...payload } = shot.cue;
      const {
        id: sourceId,
        startedAt: sourceStart,
        duration: sourceDuration,
        ...expected
      } = originalCue;
      assert.deepEqual(
        payload,
        expected,
        `${cardId}: same resolved presentation payload`,
      );
      for (const progress of [0, 0.3, 0.55, 0.8, 1]) {
        const frame = classicCombatFrame(shot.cue, progress);
        if (cue.utility) assert.equal(frame.contact.visible, false, cardId);
      }
    }
    assert.deepEqual(cue, originalCue, cardId);
    assert.deepEqual(
      after,
      originalState,
      `${cardId}: no second card resolution`,
    );
  }
});

test("SD mode retains one shot for both normal technique art and dedicated SD illustrations", () => {
  for (const cardId of ["powerbomb", "wristlock"]) {
    const { cue } = resolvedCue(cardId);
    const shots = techniqueSequence(cue, { displayMode: "sd" });
    assert.equal(shots.length, 1);
    assert.equal(shots[0].kind, "sd");
    assert.equal(shots[0].cue.startedAt, cue.startedAt);
    assert.equal(shots[0].cue.duration, cue.duration);
    assert.equal(shots[0].cue.artStyle, cue.artStyle);
    assert.equal(shots[0].cue.art, cue.art);
  }
});

test("a delayed second shot seeks from its own boundary and completes at the whole sequence deadline", () => {
  const { cue } = resolvedCue("powerbomb");
  const [card, fighters] = techniqueSequence(cue);
  const boundary = cue.startedAt + cue.duration;
  const now = boundary + 225;
  const firstClock = cuePlayback(card.cue, card.cue.duration, now);
  assert.equal(firstClock.remaining, 0);
  assert.deepEqual(cueEventPlan(firstClock, [{ key: "contact", at: 300 }]), [
    { key: "complete", delay: 0 },
  ]);
  const secondClock = cuePlayback(fighters.cue, fighters.cue.duration, now);
  assert.equal(secondClock.elapsed, 225);
  assert.equal(secondClock.animationDelay, -0.225);
  assert.equal(secondClock.remaining, cue.duration - 225);
  const events = cueEventPlan(secondClock, [
    { key: "contact", at: cue.duration * cue.camera.impacts[0] },
  ]);
  assert.equal(now + events.at(-1).delay, cue.startedAt + cue.duration * 2);
  assert.ok(
    events[0].delay > 0,
    "the paired contact has not already expired with the card shot",
  );
});

test("roster SD previews retain the selected fighter replay even for SD utility card illustrations", () => {
  for (const cardId of ["powerbomb", "wristlock"]) {
    const { cue } = resolvedCue(cardId);
    const shots = techniqueSequence(cue, {
      displayMode: "sd",
      includeFighterReplay: true,
    });
    assert.deepEqual(
      shots.map((shot) => shot.kind),
      ["card", "sd"],
    );
    assert.equal(shots[1].cue.startedAt, cue.startedAt + cue.duration);
    assert.equal(shots[1].cue.damage, cue.damage);
    assert.equal(shots[1].cue.artStyle, cue.artStyle);
  }
});

test("fully elapsed sequences only complete and cannot replay stale contact or crowd events", () => {
  const { cue } = resolvedCue("strike");
  for (const shot of techniqueSequence(cue)) {
    const clock = cuePlayback(
      shot.cue,
      shot.cue.duration,
      cue.startedAt + cue.duration * 2 + 100,
    );
    assert.deepEqual(
      cueEventPlan(clock, [
        { key: "contact", at: shot.cue.duration * 0.55 },
        { key: "crowd", at: shot.cue.duration * 0.55 },
      ]),
      [{ key: "complete", delay: 0 }],
    );
  }
});

test("shortened sequences preserve the original shot order with finite 650ms deadlines", () => {
  const { cue } = resolvedCue("powerbomb");
  const classic = techniqueSequence(cue, { still: true });
  assert.deepEqual(
    classic.map((shot) => shot.kind),
    ["card", "fighters"],
  );
  assert.deepEqual(
    classic.map((shot) => shot.cue.duration),
    [650, 650],
  );
  assert.deepEqual(
    classic.map((shot) => shot.cue.startedAt),
    [1000, 1650],
  );
  assert.equal(cuePlayback(classic[1].cue, 650, 1650).remaining, 650);
  const sd = techniqueSequence(cue, { displayMode: "sd", still: true });
  assert.equal(sd.length, 1);
  assert.equal(sd[0].cue.duration, 650);
});

test("missing timestamps and invalid durations use one stable fallback clock", () => {
  for (const duration of [undefined, NaN, 0, -1, Infinity]) {
    const shots = techniqueSequence({ id: 7, duration }, { now: 500 });
    assert.deepEqual(
      shots.map((shot) => shot.cue.startedAt),
      [500, 3100],
    );
    assert.deepEqual(
      shots.map((shot) => shot.cue.duration),
      [2600, 2600],
    );
  }
  assert.equal(
    techniqueSequence({ id: 7, duration: 1000, startedAt: 0 }, { now: 500 })[0]
      .cue.startedAt,
    0,
  );
});
