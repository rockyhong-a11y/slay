import test from "node:test";
import assert from "node:assert/strict";
import { createArenaAudio } from "../src/arena-audio.js";
import { CARDS, newRun, playCard } from "../src/game.js";
import { createCardCue, createArenaImpact } from "../src/presentation.js";

// The fake audio clock leaves onended queued until advance(). This catches
// mute/unmount leaks that would be hidden by a synchronous fake stop().
class AudioParam {
  value = 0;
  events = [];
  setValueAtTime(value, time) {
    this.events.push({ method: "set", value, time });
  }
  linearRampToValueAtTime(value, time) {
    this.events.push({ method: "linear", value, time });
  }
  exponentialRampToValueAtTime(value, time) {
    this.events.push({ method: "exponential", value, time });
  }
}

class AudioNode {
  constructor(context, kind) {
    this.context = context;
    this.kind = kind;
    this.gain = new AudioParam();
    this.frequency = new AudioParam();
    this.Q = new AudioParam();
    this.connections = [];
    this.disconnected = false;
    this.stopTimes = [];
    context.nodes.push(this);
  }
  connect(node) {
    this.connections.push(node);
    return node;
  }
  disconnect() {
    this.disconnected = true;
    this.connections = [];
  }
  start(at = this.context.currentTime) {
    this.startedAt = at;
  }
  stop(at = this.context.currentTime) {
    this.stopTimes.push(at);
    this.stoppedAt = at;
  }
}

class AudioContext {
  currentTime = 10;
  sampleRate = 1000;
  destination = {};
  nodes = [];
  createGain = () => new AudioNode(this, "gain");
  createOscillator = () => new AudioNode(this, "oscillator");
  createBufferSource = () => new AudioNode(this, "buffer");
  createBiquadFilter = () => new AudioNode(this, "filter");
  createBuffer(channels, length) {
    const data = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return { getChannelData: (index) => data[index] };
  }
  get sources() {
    return this.nodes.filter((node) =>
      ["oscillator", "buffer"].includes(node.kind),
    );
  }
  advance(seconds) {
    this.currentTime += seconds;
    for (const source of this.sources) {
      if (!source.ended && source.stoppedAt <= this.currentTime) {
        source.ended = true;
        source.onended?.();
      }
    }
  }
}

function resolvedCue(id) {
  const before = newRun("raven", 237);
  before.energy = 20;
  before.player.hype = 10;
  before.player.stress = 20;
  before.enemy.hp = before.enemy.maxHp = 500;
  const instance = { id, uid: "audio-card", upgraded: false };
  before.hand = [instance];
  const after = playCard(before, instance.uid);
  assert.notEqual(after, before, id);
  return createCardCue(before, after, instance);
}

function signature(context) {
  return context.nodes
    .filter((node) => node.kind === "oscillator" || node.kind === "filter")
    .map((node) => [
      node.kind,
      node.type,
      node.frequency.value,
      node.frequency.events,
    ])
    .flat();
}

function assertFiniteAndQuiet(context, maxDuration) {
  assert.ok(context.sources.length > 0);
  for (const source of context.sources) {
    assert.ok(Number.isFinite(source.startedAt));
    assert.ok(Number.isFinite(source.stoppedAt));
    assert.ok(source.stoppedAt > source.startedAt);
    assert.ok(source.stoppedAt - context.currentTime <= maxDuration);
  }
  for (const node of context.nodes) {
    for (const event of [...node.gain.events, ...node.frequency.events]) {
      assert.ok(Number.isFinite(event.value));
      assert.ok(Number.isFinite(event.time));
    }
    for (const event of node.gain.events)
      assert.ok(
        event.value > 0 && event.value <= 0.65,
        "mix layers have a conservative peak",
      );
  }
}

test("all real card techniques produce finite contact sounds and release every node naturally", () => {
  for (const id of Object.keys(CARDS)) {
    const context = new AudioContext();
    const audio = createArenaAudio(context);
    audio.technique(resolvedCue(id));
    assertFiniteAndQuiet(context, 0.8);
    context.advance(1);
    assert.ok(
      context.nodes.slice(1).every((node) => node.disconnected),
      id,
    );
    assert.equal(
      context.nodes[0].disconnected,
      false,
      "master stays available until disposal",
    );
    audio.dispose();
    assert.ok(context.nodes.every((node) => node.disconnected));
  }
});

test("strike, mat slam, hold, guard, focus and nightmare have distinct contact timbres", () => {
  const signatures = new Set();
  for (const id of [
    "strike",
    "powerbomb",
    "kneebar",
    "guard",
    "focus",
    "nightmare",
  ]) {
    assert.ok(CARDS[id], id);
    const context = new AudioContext();
    createArenaAudio(context).technique(resolvedCue(id));
    signatures.add(JSON.stringify(signature(context)));
  }
  assert.equal(signatures.size, 6);
});

test("fully absorbed attacks sound like guard contact, while KO adds a bounded low tail", () => {
  const blocked = new AudioContext();
  createArenaAudio(blocked).technique({
    attacking: true,
    damage: 0,
    absorbed: 12,
    effect: { family: "strike" },
  });
  const guard = new AudioContext();
  createArenaAudio(guard).technique({ effect: { family: "guard" } });
  assert.deepEqual(signature(blocked), signature(guard));
  const ordinary = new AudioContext();
  createArenaAudio(ordinary).technique({
    damage: 8,
    effect: { family: "strike" },
  });
  const knockout = new AudioContext();
  createArenaAudio(knockout).technique({
    damage: 8,
    knockout: true,
    effect: { family: "strike", strength: 1.55 },
  });
  assert.equal(knockout.sources.length, ordinary.sources.length + 2);
  assertFiniteAndQuiet(knockout, 0.8);
  const peaks = (context) =>
    context.nodes.flatMap((node) =>
      node.gain.events.map((event) => event.value),
    );
  assert.ok(Math.max(...peaks(knockout)) > Math.max(...peaks(ordinary)));
});

test("opponent hit and fully blocked arena cues share the resolved technique sound rules", () => {
  const before = newRun("raven", 123);
  before.player.block = 20;
  before.enemy.intent = { type: "attack", value: 10 };
  const after = structuredClone(before);
  after.player.block = 10;
  const impact = createArenaImpact(before, after, { attacker: "enemy" });
  assert.equal(impact.damage, 0);
  assert.equal(impact.blocked, 10);
  const context = new AudioContext();
  createArenaAudio(context).impact(impact);
  const guard = new AudioContext();
  createArenaAudio(guard).technique({ effect: { family: "guard" } });
  assert.deepEqual(signature(context), signature(guard));
});

test("a replacement contact cuts the previous contact but preserves the crowd bed", () => {
  const context = new AudioContext();
  const audio = createArenaAudio(context);
  audio.crowd({ kind: "cheer", intensity: 0.7 });
  const crowdSources = [...context.sources];
  audio.technique(resolvedCue("powerbomb"));
  const firstContact = context.sources.filter(
    (node) => !crowdSources.includes(node),
  );
  audio.technique(resolvedCue("strike"));
  assert.ok(
    firstContact.every(
      (node) => node.disconnected && node.stoppedAt === context.currentTime,
    ),
  );
  assert.ok(crowdSources.every((node) => !node.disconnected));
  audio.stop();
  assert.ok(context.nodes.slice(1).every((node) => node.disconnected));
});

test("crowd replacement stops scheduled claps synchronously without stopping contact", () => {
  const context = new AudioContext();
  const audio = createArenaAudio(context);
  audio.technique(resolvedCue("armbar"));
  const contactSources = [...context.sources];
  audio.crowd({ kind: "eruption", intensity: 1 });
  const oldCrowd = context.sources.filter(
    (node) => !contactSources.includes(node),
  );
  assert.ok(oldCrowd.some((node) => node.startedAt > context.currentTime));
  audio.crowd({ kind: "boo", intensity: 0.7 });
  assert.ok(
    oldCrowd.every(
      (node) => node.disconnected && node.stoppedAt === context.currentTime,
    ),
  );
  assert.ok(contactSources.every((node) => !node.disconnected));
  audio.stop();
  assert.ok(context.nodes.slice(1).every((node) => node.disconnected));
});

test("every crowd kind has bounded source lifetimes, safe gains and complete natural cleanup", () => {
  for (const kind of [
    "cheer",
    "eruption",
    "boo",
    "submission",
    "applause",
    "gasp",
  ]) {
    const context = new AudioContext();
    const audio = createArenaAudio(context);
    audio.crowd({ kind, intensity: 20 });
    assertFiniteAndQuiet(context, 2.6);
    context.advance(3);
    assert.ok(
      context.nodes.slice(1).every((node) => node.disconnected),
      kind,
    );
    audio.dispose();
  }
});

test("mute/hidden stop is immediate and reusable; disposal is terminal and idempotent", () => {
  const context = new AudioContext();
  const audio = createArenaAudio(context);
  audio.play("skill");
  audio.technique(resolvedCue("powerbomb"));
  audio.crowd({ kind: "submission", intensity: 0.8 });
  audio.stop();
  assert.ok(context.nodes.slice(1).every((node) => node.disconnected));
  const mutedCount = context.sources.length;
  audio.impact({ damage: 15, heavy: true });
  assert.ok(context.sources.length > mutedCount);
  audio.dispose();
  assert.ok(context.nodes.every((node) => node.disconnected));
  const disposedCount = context.nodes.length;
  audio.play("skill");
  audio.technique(resolvedCue("strike"));
  audio.impact({ damage: 15 });
  audio.crowd({ kind: "boo", intensity: 0.7 });
  audio.dispose();
  assert.equal(context.nodes.length, disposedCount);
  context.advance(10);
  assert.ok(context.nodes.every((node) => node.disconnected));
});
