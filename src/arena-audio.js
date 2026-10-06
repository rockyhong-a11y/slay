import { useEffect, useRef, useState } from "react";

/** Finite, locally generated contact sounds and crowd beds; no media autoplay. */
export function createArenaAudio(context) {
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  const live = new Set();
  const crowdNodes = new Set();
  const contactNodes = new Set();
  const noiseBuffers = new Map();
  let disposed = false;
  function track(source, outputs, group = contactNodes) {
    const entry = { source, outputs };
    live.add(entry);
    group.add(entry);
    source.onended = () => {
      source.disconnect();
      outputs.forEach((node) => node.disconnect());
      live.delete(entry);
      group.delete(entry);
    };
    return source;
  }
  function stop(entries) {
    for (const { source } of [...entries]) {
      try {
        source.stop(context.currentTime);
      } catch {}
      // Disconnect synchronously as well: muted or hidden tabs must not wait
      // for an audio-thread onended callback, including future scheduled claps.
      source.onended?.();
      source.onended = null;
    }
  }
  function noiseSource(color = "brown") {
    if (!noiseBuffers.has(color)) {
      const noise = context.createBuffer(
        2,
        context.sampleRate * 2,
        context.sampleRate,
      );
      for (let channel = 0; channel < 2; channel++) {
        const data = noise.getChannelData(channel);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          const sample = Math.random() * 2 - 1;
          last = (last + sample * 0.045) / 1.025;
          data[i] = color === "white" ? sample : last * 3;
        }
      }
      noiseBuffers.set(color, noise);
    }
    const source = context.createBufferSource();
    source.buffer = noiseBuffers.get(color);
    source.loop = true;
    return source;
  }
  function play(kind) {
    if (disposed) return;
    // UI confirmation stays light; combat calls technique/impact at contact.
    if (kind === "attack") return impact({ damage: 6 });
    const now = context.currentTime;
    const source = context.createOscillator(),
      gain = context.createGain();
    source.type = "sine";
    source.frequency.setValueAtTime(660, now);
    source.frequency.exponentialRampToValueAtTime(330, now + 0.16);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    source.connect(gain).connect(master);
    track(source, [gain]).start();
    source.stop(now + 0.24);
  }
  function envelope(gain, at, duration, amplitude, attack = 0.006) {
    gain.gain.setValueAtTime(0.001, at);
    gain.gain.linearRampToValueAtTime(amplitude, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  }
  function tone({ at, duration, from, to, amplitude, type = "sine", attack }) {
    const source = context.createOscillator();
    const gain = context.createGain();
    source.type = type;
    source.frequency.setValueAtTime(from, at);
    source.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope(gain, at, duration, amplitude, attack);
    source.connect(gain).connect(master);
    track(source, [gain]).start(at);
    source.stop(at + duration + 0.015);
  }
  function texture({
    at,
    duration,
    frequency,
    amplitude,
    type = "bandpass",
    color = "white",
    attack,
  }) {
    const source = noiseSource(color);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.6;
    envelope(gain, at, duration, amplitude, attack);
    source.connect(filter).connect(gain).connect(master);
    track(source, [filter, gain]).start(at);
    source.stop(at + duration + 0.015);
  }
  function contact(cue, family) {
    if (disposed || !cue) return;
    // Only the newest contact owns the sound stage. Crowd ambience has its own
    // group and is left intact; a long combo cannot accumulate unbounded bass.
    stop(contactNodes);
    const at = context.currentTime;
    const rawStrength = Number(cue.effect?.strength);
    const strength = Math.min(
      1.5,
      Math.max(0.65, Number.isFinite(rawStrength) ? rawStrength : 1),
    );
    const weight = cue.knockout ? 1.2 : cue.finisher || cue.heavy ? 1.12 : 1;
    const level = Math.min(1.4, strength * weight);
    const hit = (options) =>
      tone({ at, ...options, amplitude: options.amplitude * level });
    const air = (options) =>
      texture({ at, ...options, amplitude: options.amplitude * level });
    if (family === "guard" || family === "defense") {
      hit({ from: 1260, to: 670, duration: 0.2, amplitude: 0.12 });
      hit({ from: 1770, to: 1120, duration: 0.14, amplitude: 0.075 });
      hit({ from: 130, to: 55, duration: 0.18, amplitude: 0.18 });
      air({
        frequency: 2400,
        type: "highpass",
        duration: 0.065,
        amplitude: 0.2,
      });
    } else if (family === "grapple" && !cue.effect?.grounded) {
      // The canvas slap sits above a low, resonant wooden ring thud.
      hit({ from: 112, to: 36, duration: 0.46, amplitude: 0.4 });
      hit({
        from: 170,
        to: 62,
        duration: 0.32,
        amplitude: 0.14,
        type: "triangle",
      });
      air({ frequency: 560, type: "lowpass", duration: 0.32, amplitude: 0.46 });
      air({ frequency: 1550, duration: 0.095, amplitude: 0.2 });
    } else if (family === "submission") {
      // A tight cloth lock and three restrained pressure pulses, rather than
      // the explosive mat slam used by throws.
      air({ frequency: 620, duration: 0.38, amplitude: 0.18, attack: 0.03 });
      hit({
        from: 390,
        to: 245,
        duration: 0.24,
        amplitude: 0.07,
        type: "triangle",
      });
      for (let beat = 0; beat < 3; beat++)
        hit({
          at: at + beat * 0.17,
          from: 108 + beat * 15,
          to: 76,
          duration: 0.13,
          amplitude: 0.15,
        });
    } else if (family === "focus" || family === "tactics") {
      hit({
        from: 360,
        to: 760,
        duration: 0.36,
        amplitude: 0.09,
        attack: 0.045,
      });
      hit({
        from: 540,
        to: 1140,
        duration: 0.29,
        amplitude: 0.045,
        attack: 0.03,
      });
      air({ frequency: 1800, duration: 0.3, amplitude: 0.07, attack: 0.055 });
    } else if (family === "nightmare") {
      hit({
        from: 127,
        to: 43,
        duration: 0.56,
        amplitude: 0.17,
        type: "triangle",
        attack: 0.03,
      });
      hit({ from: 132, to: 48, duration: 0.5, amplitude: 0.085, attack: 0.02 });
      air({ frequency: 450, duration: 0.42, amplitude: 0.2, attack: 0.04 });
    } else if (family === "grapple") {
      hit({ from: 160, to: 85, duration: 0.17, amplitude: 0.19 });
      air({ frequency: 930, duration: 0.18, amplitude: 0.15, attack: 0.018 });
    } else {
      // Sharp contact, low body weight and a short displaced-air tail.
      air({
        frequency: 1900,
        type: "highpass",
        duration: 0.07,
        amplitude: 0.31,
      });
      hit({
        from: 185,
        to: 43,
        duration: 0.24,
        amplitude: 0.32,
        type: "triangle",
      });
      air({ frequency: 850, duration: 0.14, amplitude: 0.16 });
    }
    if (cue.knockout) {
      hit({ from: 76, to: 28, duration: 0.72, amplitude: 0.16 });
      hit({
        from: 740,
        to: 370,
        duration: 0.4,
        amplitude: 0.055,
        attack: 0.02,
      });
    }
  }
  function technique(cue) {
    if (!cue) return;
    const absorbed = cue.absorbed || cue.blocked || 0;
    const family =
      cue.attacking && !cue.damage && absorbed > 0
        ? "guard"
        : cue.effect?.family || cue.effectFamily || "strike";
    contact(cue, family);
  }
  function impact(cue) {
    if (!cue) return;
    contact(
      cue,
      !cue.damage && cue.blocked > 0 ? "guard" : cue.effectFamily || "strike",
    );
  }
  function crowd(reaction) {
    if (disposed || !reaction) return;
    stop(crowdNodes);
    const now = context.currentTime;
    const duration = reaction.kind === "eruption" ? 2.5 : 1.7;
    const source = noiseSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(reaction.kind === "boo" ? 380 : 1050, now);
    filter.Q.value = 0.45;
    gain.gain.setValueAtTime(0.001, now);
    const intensity = Math.min(
      1,
      Math.max(0, Number(reaction.intensity) || 0.5),
    );
    gain.gain.linearRampToValueAtTime(0.65 * intensity, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter).connect(gain).connect(master);
    track(source, [filter, gain], crowdNodes).start();
    source.stop(now + duration);
    // A low, rounded crowd chant for boos; separate claps for a submission chant.
    if (reaction.kind === "boo") {
      for (const frequency of [145, 183, 222]) {
        const voice = context.createOscillator(),
          envelope = context.createGain();
        voice.type = "sine";
        voice.frequency.setValueAtTime(frequency, now);
        voice.frequency.linearRampToValueAtTime(
          frequency * 0.8,
          now + duration,
        );
        envelope.gain.setValueAtTime(0.001, now);
        envelope.gain.linearRampToValueAtTime(0.035, now + 0.25);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
        voice.connect(envelope).connect(master);
        track(voice, [envelope], crowdNodes).start();
        voice.stop(now + duration);
      }
    } else {
      const claps =
        reaction.kind === "submission"
          ? 3
          : reaction.kind === "eruption"
            ? 7
            : 4;
      for (let i = 0; i < claps; i++) {
        const at =
          now + 0.12 + i * (reaction.kind === "submission" ? 0.43 : 0.17);
        const clap = noiseSource(),
          high = context.createBiquadFilter(),
          envelope = context.createGain();
        high.type = "highpass";
        high.frequency.value = 1100;
        envelope.gain.setValueAtTime(0.001, at);
        envelope.gain.linearRampToValueAtTime(0.3, at + 0.012);
        envelope.gain.exponentialRampToValueAtTime(0.001, at + 0.09);
        clap.connect(high).connect(envelope).connect(master);
        track(clap, [high, envelope], crowdNodes).start(at);
        clap.stop(at + 0.1);
      }
    }
  }
  return {
    play,
    technique,
    impact,
    crowd,
    stop: () => stop(live),
    dispose() {
      if (disposed) return;
      disposed = true;
      stop(live);
      master.disconnect();
      noiseBuffers.clear();
    },
  };
}

export function useArenaSound() {
  const [enabled, setEnabled] = useState(false);
  const ctx = useRef(null),
    audio = useRef(null),
    enabledRef = useRef(false);
  enabledRef.current = enabled;
  const invoke = (method, value) => {
    if (!enabledRef.current || document.hidden) return;
    try {
      ctx.current ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.current ||= createArenaAudio(ctx.current);
      ctx.current.resume().catch(() => {});
      audio.current[method](value);
    } catch {
      /* Unsupported audio never blocks a turn. */
    }
  };
  useEffect(() => {
    const suspend = () => {
      if (document.hidden) audio.current?.stop();
    };
    document.addEventListener("visibilitychange", suspend);
    return () => {
      document.removeEventListener("visibilitychange", suspend);
      audio.current?.dispose();
      ctx.current?.close().catch(() => {});
      audio.current = null;
      ctx.current = null;
    };
  }, []);
  return {
    enabled,
    toggle() {
      enabledRef.current = !enabledRef.current;
      setEnabled(enabledRef.current);
      if (!enabledRef.current) audio.current?.stop();
      else invoke("play", "skill");
    },
    play: (kind) => invoke("play", kind),
    technique: (cue) => invoke("technique", cue),
    impact: (cue) => invoke("impact", cue),
    crowd: (reaction) => invoke("crowd", reaction),
    stop: () => audio.current?.stop(),
  };
}
