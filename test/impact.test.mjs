import test from "node:test";
import assert from "node:assert/strict";
import { newRun, playCard, endTurn } from "../src/game.js";
import {
  createArenaImpact,
  fighterImpactFrames,
  techniqueShot,
} from "../src/presentation.js";

function encounter(card = "strike") {
  const state = newRun("raven", 12345);
  state.phase = "combat";
  state.hand = [{ id: card, uid: "impact-card", upgraded: false }];
  state.deck = structuredClone(state.hand);
  state.draw = [];
  state.discard = [];
  state.exhaust = [];
  state.energy = 10;
  state.player.hype = 9;
  state.player.stress = 0;
  state.player.block = 0;
  state.activeGimmick = null;
  state.enemy.hp = state.enemy.maxHp = 100;
  state.enemy.block = 0;
  state.enemy.weak = 0;
  return state;
}

test("arena reactions use real guarded damage and preserve engine snapshots", () => {
  for (const block of [0, 5, 30]) {
    const before = encounter();
    before.enemy.block = block;
    const original = structuredClone(before);
    const after = playCard(before, before.hand[0].uid);
    const impact = createArenaImpact(before, after, {
      instance: before.hand[0],
    });
    assert.equal(impact.target, "enemy");
    assert.equal(impact.damage, before.enemy.hp - after.enemy.hp);
    assert.equal(impact.blocked, before.enemy.block - after.enemy.block);
    assert.equal(impact.label === "GUARD", impact.damage === 0);
    assert.ok(impact.duration > 650 && impact.duration < 1200);
    assert.deepEqual(before, original);
    assert.deepEqual(JSON.parse(JSON.stringify(impact)), impact);
  }
});

test("enemy guard reactions report absorbed hits even when the new turn resets guard", () => {
  for (const [block, weak, expected] of [
    [0, 0, 0],
    [3, 0, 3],
    [20, 0, 8],
    [20, 2, 6],
  ]) {
    const before = encounter();
    before.player.block = block;
    before.enemy.weak = weak;
    before.enemy.intent = { type: "attack", value: 8 };
    const after = endTurn(before);
    const impact = createArenaImpact(before, after, { attacker: "enemy" });
    assert.equal(impact.attacker, "enemy");
    assert.equal(impact.target, "player");
    assert.equal(impact.damage, before.player.hp - after.player.hp);
    assert.equal(impact.blocked, expected);
    assert.equal(impact.label === "GUARD", impact.damage === 0);
  }
});

test("healing, enemy guard and invalid actions do not invent a contact", () => {
  const before = encounter("focus");
  const after = playCard(before, before.hand[0].uid);
  assert.equal(
    createArenaImpact(before, after, { instance: before.hand[0] }),
    null,
  );
  before.enemy.intent = { type: "guard", value: 8 };
  assert.equal(
    createArenaImpact(before, endTurn(before), { attacker: "enemy" }),
    null,
  );
  assert.equal(createArenaImpact(before, before), null);
  assert.equal(createArenaImpact(null, after), null);
});

test("incoming hit score precedes turn healing, while pressure self damage cannot masquerade as a strike", () => {
  const recovering = encounter();
  recovering.player.hp -= 12;
  recovering.activeGimmick = { id: "icecorner", uid: "test-corner", floor: 1 };
  recovering.enemy.intent = { type: "attack", value: 8 };
  const recovered = endTurn(recovering);
  assert.equal(
    recovering.player.hp - recovered.player.hp,
    5,
    "recovery heals three after contact",
  );
  assert.equal(
    createArenaImpact(recovering, recovered, { attacker: "enemy" }).damage,
    8,
  );

  const guarded = encounter();
  guarded.player.block = 20;
  guarded.player.stress = 99;
  guarded.nextNightmareAt = 110;
  guarded.enemy.intent = { type: "attack", value: 8 };
  const broken = endTurn(guarded);
  assert.equal(guarded.player.hp - broken.player.hp, 8);
  const reaction = createArenaImpact(guarded, broken, { attacker: "enemy" });
  assert.equal(reaction.damage, 0);
  assert.equal(reaction.blocked, 8);
  assert.equal(reaction.label, "GUARD");

  const taunted = encounter();
  taunted.player.stress = 99;
  taunted.nextNightmareAt = 110;
  taunted.enemy.intent = { type: "taunt", value: 8 };
  const stressed = endTurn(taunted);
  assert.equal(taunted.player.hp - stressed.player.hp, 8);
  assert.equal(
    createArenaImpact(taunted, stressed, { attacker: "enemy" }),
    null,
  );
});

test("combo and knockout emphasis retain aggregate damage and cap overkill", () => {
  const double = encounter("doubletap");
  const doubleAfter = playCard(double, double.hand[0].uid);
  const combo = createArenaImpact(double, doubleAfter, {
    instance: double.hand[0],
  });
  assert.equal(combo.hits, 2);
  assert.equal(combo.combo, doubleAfter.combo);
  assert.equal(combo.damage, double.enemy.hp - doubleAfter.enemy.hp);
  const before = encounter("finisher");
  before.enemy.hp = 1;
  const after = playCard(before, before.hand[0].uid);
  const impact = createArenaImpact(before, after, { instance: before.hand[0] });
  assert.equal(impact.damage, 1);
  assert.equal(impact.knockout, true);
  assert.equal(impact.finisher, true);
  assert.equal(impact.heavy, true);
  assert.equal(impact.label, "K.O.");
});

test("complete-image hitstop freezes the contact channel then releases into recoil", () => {
  for (const id of ["strike", "doubletap", "powerbomb", "sidewalkslam"]) {
    const camera = techniqueShot(
      id,
      id.includes("slam") || id.includes("bomb") ? "throw" : "strike",
    );
    assert.ok(camera.hitstop >= 80 && camera.hitstop <= 100);
    for (const contact of camera.impacts) {
      const index = camera.times.indexOf(contact);
      assert.ok(index > 0);
      assert.ok(camera.times[index + 1] > contact);
      for (const channel of ["x", "y", "scale", "rotate"])
        assert.equal(camera[channel][index + 1], camera[channel][index]);
      assert.ok(camera.times[index + 2] > camera.times[index + 1]);
    }
  }
  assert.equal(techniqueShot("headlock", "submission").hitstop, 0);
  assert.deepEqual(techniqueShot("focus", "tactics").impacts, []);
});

test("reduced motion disables whole-image movement and flashing for either combatant", () => {
  for (const attacker of ["player", "enemy"]) {
    const impact = {
      attacker,
      target: attacker === "player" ? "enemy" : "player",
      damage: 18,
      heavy: true,
      duration: 1040,
    };
    for (const side of ["player", "enemy"])
      assert.equal(fighterImpactFrames(impact, side, true), null);
  }
  assert.equal(fighterImpactFrames(null, "player"), null);
});

test("guard braces gently while damage has heavier recoil, and every finite channel returns to rest", () => {
  const cue = {
    attacker: "player",
    target: "enemy",
    damage: 18,
    heavy: true,
    duration: 1040,
  };
  const hit = fighterImpactFrames(cue, "enemy");
  const guard = fighterImpactFrames({ ...cue, damage: 0 }, "enemy");
  assert.ok(Math.max(...guard.x) < Math.max(...hit.x) / 3);
  assert.ok(Math.max(...guard.rotate) < Math.max(...hit.rotate));
  for (const side of ["player", "enemy"]) {
    const frames = fighterImpactFrames(cue, side);
    for (const channel of ["x", "y", "rotate"]) {
      assert.ok(frames[channel].every(Number.isFinite));
      assert.equal(Math.abs(frames[channel][0]), 0);
      assert.equal(Math.abs(frames[channel].at(-1)), 0);
      assert.equal(frames[channel][2], frames[channel][3]);
    }
    assert.equal(frames.filter[0], "brightness(1)");
    assert.equal(frames.filter.at(-1), "brightness(1)");
    assert.equal(frames.transition.times[0], 0);
    assert.equal(frames.transition.times.at(-1), 1);
  }
});
