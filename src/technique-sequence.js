// Each shot uses an absolute slice of the original cue's clock. A delayed
// transition catches up instead of replaying an expired action from the start.
export function techniqueSequence(
  cue,
  { displayMode = "classic", still = false, now = 0 } = {},
) {
  const duration = still
    ? 650
    : Number.isFinite(cue.duration) && cue.duration > 0
      ? cue.duration
      : 2600;
  const startedAt = Number.isFinite(cue.startedAt) ? cue.startedAt : now;
  const kinds = displayMode === "sd" ? ["sd"] : ["card", "fighters"];
  return kinds.map((kind, index) => ({
    kind,
    cue: {
      ...cue,
      id: `${cue.id}:${kind}`,
      duration,
      startedAt: startedAt + index * duration,
    },
  }));
}
