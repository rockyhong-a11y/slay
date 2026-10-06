import { useEffect, useRef, useState } from "react";

/** Short stereo crowd beds, generated locally; no media request or autoplay. */
export function createArenaAudio(context) {
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  const live = new Set();
  const crowdNodes = new Set();
  let noise;
  function track(source, outputs, isCrowd = false) {
    const entry = { source, outputs };
    live.add(entry);
    if (isCrowd) crowdNodes.add(entry);
    source.onended = () => {
      source.disconnect();
      outputs.forEach((node) => node.disconnect());
      live.delete(entry);
      crowdNodes.delete(entry);
    };
    return source;
  }
  function stop(entries) {
    for (const { source } of [...entries]) {
      try {
        source.stop();
      } catch {}
    }
  }
  function noiseSource() {
    if (!noise) {
      noise = context.createBuffer(
        2,
        context.sampleRate * 2,
        context.sampleRate,
      );
      for (let channel = 0; channel < 2; channel++) {
        const data = noise.getChannelData(channel);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          last = (last + (Math.random() * 2 - 1) * 0.045) / 1.025;
          data[i] = last * 3;
        }
      }
    }
    const source = context.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    return source;
  }
  function play(kind) {
    const now = context.currentTime;
    const source = context.createOscillator(),
      gain = context.createGain();
    source.type = kind === "attack" ? "triangle" : "sine";
    source.frequency.setValueAtTime(kind === "attack" ? 170 : 660, now);
    source.frequency.exponentialRampToValueAtTime(
      kind === "attack" ? 40 : 330,
      now + 0.16,
    );
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    source.connect(gain).connect(master);
    track(source, [gain]).start();
    source.stop(now + 0.24);
  }
  function crowd(reaction) {
    if (!reaction) return;
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
    gain.gain.linearRampToValueAtTime(0.65 * reaction.intensity, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter).connect(gain).connect(master);
    track(source, [filter, gain], true).start();
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
        track(voice, [envelope], true).start();
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
        track(clap, [high, envelope], true).start(at);
        clap.stop(at + 0.1);
      }
    }
  }
  return {
    play,
    crowd,
    stop: () => stop(live),
    dispose() {
      stop(live);
      master.disconnect();
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
    crowd: (reaction) => invoke("crowd", reaction),
    stop: () => audio.current?.stop(),
  };
}
