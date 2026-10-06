// Finite, presentation-only choreography of two complete 2D illustrations.
// Each sprite has one position, rotation and uniform scale. Faces, torsos and
// limbs are never separated, independently moved, or assembled by this module.
const ACTORS = new Set([
  "raven",
  "valkyrie",
  "nova",
  "viper",
  "ember",
  "atlas",
  "seraph",
  "lynx",
  "tempest",
  "onyx",
]);
const HOME_X = 1.55;
const BODY_Y = 1.5;
const HALF_TURN = Math.PI / 2;
const unit = (value) =>
  typeof value !== "number" || Number.isNaN(value)
    ? 0
    : Math.max(0, Math.min(1, value));
const finite = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const smooth = (value) => {
  const t = unit(value);
  return t * t * (3 - 2 * t);
};
const between = (value, start, end) =>
  smooth((value - start) / Math.max(0.0001, end - start));
const mix = (a, b, t) => a + (b - a) * t;

export function sdActorId(value) {
  const requested =
    typeof value === "string" ? value : value?.id || value?.artKey;
  const id = typeof requested === "string" ? requested.toLowerCase() : "";
  return ACTORS.has(id) ? id : "nova";
}

function home(side) {
  return {
    x: side === "player" ? -HOME_X : HOME_X,
    y: BODY_Y,
    rz: 0,
    scale: 1,
    pose: "idle",
    depth: 0,
  };
}
function neutral() {
  return {
    player: home("player"),
    enemy: home("enemy"),
    camera: { zoom: 1, shakeX: 0, shakeY: 0 },
    contact: { visible: false, strength: 0, x: 0, y: 1.8, family: "strike" },
    phase: "idle",
  };
}
function sequence(progress, stops) {
  if (progress <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index++) {
    if (progress > stops[index][0]) continue;
    const [at, value] = stops[index],
      [before, previous] = stops[index - 1];
    return mix(previous, value, between(progress, before, at));
  }
  return stops.at(-1)[1];
}
function contactTimes(cue, incoming) {
  if (incoming) return [0.29];
  const times = [
    ...new Set(
      (Array.isArray(cue.camera?.impacts) ? cue.camera.impacts : []).filter(
        (value) => Number.isFinite(value) && value > 0 && value < 0.92,
      ),
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, 2);
  return times.length ? times : [0.55];
}
function holdFraction(cue, at, pressure, incoming) {
  if (pressure) return 0;
  const duration = Math.max(300, finite(cue.duration, incoming ? 900 : 2600));
  const milliseconds = Math.max(
    0,
    finite(cue.camera?.hitstop, cue.heavy ? 100 : 80),
  );
  return Math.min(0.1, milliseconds / duration, (1 - at) * 0.25);
}
function holdClock(progress, contacts, cue, pressure, incoming) {
  for (const at of contacts) {
    if (
      progress >= at &&
      progress <= at + holdFraction(cue, at, pressure, incoming)
    )
      return at;
  }
  return progress;
}
function mirrored(sprite, direction) {
  return {
    ...sprite,
    x: sprite.x * direction || 0,
    rz: sprite.rz * direction || 0,
  };
}

/**
 * Sample whole-sprite motion at normalized progress. x/y use a six-unit-wide
 * stage with +Y upward; resting sprite centers are at y=1.5 (height 3). rz is
 * radians, scale is uniform, and depth only controls front/back stacking.
 * `pose` selects a complete illustration; it never describes a body part.
 * bodyRatios are the player/enemy atlas shared width-to-height ratios, so the
 * same complete bounds stay above the mat during rotations in either direction.
 */
export function sdCombatFrame(
  cue,
  progress,
  { still = false, incoming = false, bodyRatios = [2 / 3, 2 / 3] } = {},
) {
  const p = unit(progress);
  if (!cue || p >= 1) return neutral();
  const frame = neutral();
  const attacker = ["player", "enemy"].includes(cue.attacker)
    ? cue.attacker
    : incoming
      ? "enemy"
      : "player";
  const defender = attacker === "player" ? "enemy" : "player";
  const direction = attacker === "player" ? 1 : -1;
  const ratioFor = (side) =>
    Math.max(0.1, finite(bodyRatios?.[side === "player" ? 0 : 1], 2 / 3));
  const family =
    cue.effect?.family ||
    cue.effectFamily ||
    (cue.throwing ? "grapple" : cue.pressure ? "submission" : "strike");
  const pressure = family === "submission" || !!cue.pressure;
  const attacking =
    cue.attacking === undefined
      ? finite(cue.damage) > 0 ||
        finite(cue.blocked) > 0 ||
        (incoming && !["defense", "tactics", "nightmare"].includes(family))
      : !!cue.attacking;
  const guarded = attacking && finite(cue.damage) <= 0;
  const grounded = !!cue.effect?.grounded || cue.camera?.kind === "clinch";
  const throwing = family === "grapple" && !grounded && !guarded;
  const kind =
    cue.camera?.kind || (cue.throwing ? "slam" : pressure ? "hold" : "strike");
  const contacts = contactTimes(cue, incoming);
  const first = contacts[0],
    last = contacts.at(-1);
  const hold = holdFraction(cue, last, pressure, incoming);
  const clock = holdClock(p, contacts, cue, pressure, incoming);
  const recovery = Math.min(0.88, Math.max(last + hold + 0.16, 0.73));
  const reset = between(clock, recovery, 1);
  const engage = between(clock, 0.02, first * 0.64);
  const force = Math.min(
    1.35,
    0.75 + Math.max(0, finite(cue.damage)) / 35 + (cue.heavy ? 0.15 : 0),
  );
  const a = home("player"),
    b = home("enemy");
  let point = { x: 0.53, y: 2 };
  let phase = "anticipation";

  if (throwing) {
    const gripAt = first * 0.4,
      liftAt = first * 0.76,
      holdEnd = last + hold;
    const aerial = kind === "aerial",
      suplex = kind === "throw",
      powerbomb = kind === "powerbomb";
    a.pose = clock < first ? "grapple" : "slam";
    b.pose = clock < gripAt ? "guard" : "hurt";
    a.depth = clock < first ? -1 : 1;
    b.depth = -a.depth;
    if (aerial) {
      a.pose = "strike";
      a.depth = 1;
      b.depth = -1;
      a.x = sequence(clock, [
        [0, -HOME_X],
        [gripAt, -1.2],
        [liftAt, 0],
        [first, 0.62],
        [holdEnd, 0.62],
        [recovery, 0.35],
      ]);
      a.y = sequence(clock, [
        [0, BODY_Y],
        [gripAt, 1.48],
        [liftAt, 3.5],
        [first, 1.06],
        [holdEnd, 1.06],
        [recovery, BODY_Y],
      ]);
      a.rz = sequence(clock, [
        [0, 0],
        [gripAt, 0.1],
        [liftAt, -2.45],
        [first, -HALF_TURN],
        [holdEnd, -HALF_TURN],
        [recovery, 0],
      ]);
      b.x = mix(HOME_X, 0.83, engage);
      b.y = mix(BODY_Y, 0.75, between(clock, gripAt, liftAt));
      b.rz = mix(0, -HALF_TURN, between(clock, gripAt, liftAt));
    } else {
      const landingX = suplex ? -1.05 : 0.7;
      a.x = sequence(clock, [
        [0, -HOME_X],
        [gripAt, -0.52],
        [liftAt, -0.36],
        [first, suplex ? 0.18 : -0.36],
        [holdEnd, suplex ? 0.18 : -0.36],
        [recovery, -0.68],
      ]);
      a.y = sequence(clock, [
        [0, BODY_Y],
        [gripAt, BODY_Y],
        [liftAt, 1.67],
        [first, BODY_Y],
        [holdEnd, BODY_Y],
        [recovery, BODY_Y],
      ]);
      a.rz = sequence(clock, [
        [0, 0],
        [gripAt, -0.1],
        [liftAt, suplex ? -0.3 : 0.08],
        [first, 0.2],
        [holdEnd, 0.2],
        [recovery, 0.04],
      ]);
      b.x = sequence(clock, [
        [0, HOME_X],
        [gripAt, 0.55],
        [liftAt, suplex ? -0.55 : powerbomb ? -0.2 : 0.14],
        [first, landingX],
        [holdEnd, landingX],
        [recovery, landingX],
      ]);
      b.y = sequence(clock, [
        [0, BODY_Y],
        [gripAt, BODY_Y],
        [liftAt, powerbomb ? 3.7 : 3.15],
        [first, 0.75],
        [holdEnd, 0.75],
        [recovery, 0.95],
      ]);
      b.rz = sequence(clock, [
        [0, 0],
        [gripAt, 0.12],
        [liftAt, powerbomb ? Math.PI : suplex ? -2.2 : 1.25],
        [first, suplex ? -HALF_TURN : HALF_TURN],
        [holdEnd, suplex ? -HALF_TURN : HALF_TURN],
        [recovery, suplex ? -1.15 : 1.15],
      ]);
    }
    point = { x: b.x, y: 0.3 };
    phase =
      clock < gripAt
        ? "approach"
        : clock < liftAt
          ? aerial
            ? "flight"
            : "lift"
          : clock < first
            ? "drop"
            : clock <= holdEnd
              ? "contact"
              : "recovery";
  } else if ((pressure || (family === "grapple" && grounded)) && !guarded) {
    a.x = mix(-HOME_X, -0.56, engage);
    b.x = mix(HOME_X, pressure ? 0.8 : 0.57, engage);
    a.rz = mix(0, pressure ? -HALF_TURN : -0.07, engage);
    b.rz = mix(0, pressure ? HALF_TURN : 0.07, engage);
    a.y = mix(BODY_Y, pressure ? 1.3 : BODY_Y, engage);
    b.y = mix(BODY_Y, pressure ? 0.8 : BODY_Y, engage);
    a.pose = pressure ? "submission" : "grapple";
    b.pose = pressure ? "hurt" : "guard";
    a.depth = 1;
    b.depth = -1;
    point = { x: 0.38, y: pressure ? 1.04 : 1.8 };
    phase =
      clock < first * 0.64
        ? "grip"
        : clock < recovery
          ? "pressure"
          : "recovery";
  } else if (attacking || family === "strike") {
    let dash = 0,
      knockback = 0,
      hitAccent = 0;
    let activeContact;
    for (let index = 0; index < contacts.length; index++) {
      const at = contacts[index],
        end = at + holdFraction(cue, at, false, incoming);
      const windup = Math.max(
        index ? contacts[index - 1] + 0.06 : 0.03,
        at - 0.13,
      );
      const fadeAt = Math.min(recovery, end + 0.16);
      dash += between(clock, windup, at) * (1 - between(clock, end, fadeAt));
      knockback +=
        between(clock, end, end + 0.08) *
        (1 -
          between(
            clock,
            end + 0.08,
            contacts[index + 1] ? contacts[index + 1] - 0.035 : recovery,
          ));
      if (clock >= at) {
        hitAccent = Math.max(hitAccent, 1 - between(clock, end, fadeAt));
        activeContact = at;
      }
    }
    dash = Math.min(1, dash);
    knockback = Math.min(1, knockback);
    const kick = kind === "aerial" || cue.effect?.variant === "flying-knee";
    a.x = mix(-HOME_X, -0.83, engage) + 0.75 * dash;
    a.y = BODY_Y + (kick ? Math.sin(unit(clock / first) * Math.PI) * 1.05 : 0);
    a.rz = -0.05 * engage + (kick ? -0.42 : -0.16) * dash;
    a.scale = 1 + 0.018 * dash;
    a.pose = "strike";
    a.depth = 1;
    b.depth = -1;
    b.x =
      mix(HOME_X, guarded ? 1.25 : 1.13, engage) +
      (guarded ? 0.09 : 0.58 * force) * knockback;
    b.y = BODY_Y + (guarded ? 0 : 0.14 * knockback * force);
    b.rz = guarded ? 0 : -0.23 * hitAccent * force;
    b.scale = guarded ? 1 : 1 - 0.012 * hitAccent;
    b.pose = guarded ? "guard" : activeContact === undefined ? "idle" : "hurt";
    point = { x: 0.76, y: kick ? 1.85 : 2.15 };
    phase =
      activeContact !== undefined &&
      clock <= activeContact + holdFraction(cue, activeContact, false, incoming)
        ? "contact"
        : clock < first
          ? "approach"
          : "recovery";
  } else {
    const accent = engage * (1 - reset);
    a.pose =
      family === "defense"
        ? "guard"
        : family === "nightmare"
          ? "groggy"
          : "idle";
    a.scale = 1 - (family === "defense" ? 0.012 : 0.006) * accent;
    phase = family === "defense" ? "guard" : "focus";
  }

  if (
    cue.knockout &&
    !guarded &&
    clock >= last + hold + 0.05 &&
    clock < recovery
  ) {
    a.pose = "victory";
    b.pose = "groggy";
  }
  // Reset the entire drawing together. The rotated silhouette's lower edge
  // remains above the mat while it rolls from a horizontal landing to standing.
  for (const [sprite, rest, ratio] of [
    [a, home("player"), ratioFor(attacker)],
    [b, home("enemy"), ratioFor(defender)],
  ]) {
    for (const channel of ["x", "y", "rz", "scale"])
      sprite[channel] = mix(sprite[channel], rest[channel], reset);
    sprite.y = Math.max(
      sprite.y,
      (BODY_Y * Math.abs(Math.cos(sprite.rz)) +
        BODY_Y * ratio * Math.abs(Math.sin(sprite.rz))) *
        sprite.scale,
    );
    if (reset > 0.86) {
      sprite.pose = "idle";
      sprite.depth = 0;
    }
  }
  frame[attacker] = mirrored(a, direction);
  frame[defender] = mirrored(b, direction);
  frame.phase = phase;
  const physical = attacking || family === "grapple" || pressure;
  const currentContact = contacts.find(
    (at) =>
      p >= at &&
      p <
        at +
          holdFraction(cue, at, pressure, incoming) +
          (pressure ? 0.15 : 0.13),
  );
  const currentHold =
    currentContact === undefined
      ? 0
      : holdFraction(cue, currentContact, pressure, incoming);
  const fade =
    currentContact === undefined
      ? 0
      : 1 -
        between(
          p,
          currentContact + currentHold,
          currentContact + currentHold + (pressure ? 0.15 : 0.13),
        );
  frame.contact = {
    visible: physical && currentContact !== undefined,
    strength: physical ? fade * (guarded ? 0.42 : pressure ? 0.62 : force) : 0,
    x: point.x * direction,
    y: point.y,
    family: guarded ? "guard" : pressure ? "submission" : family,
  };
  const lastHoldEnd = last + hold,
    recoilTime = Math.max(0, p - lastHoldEnd);
  const cameraKick =
    physical && !pressure && p > lastHoldEnd
      ? (1 - between(p, lastHoldEnd, lastHoldEnd + 0.13)) * 0.05 * force
      : 0;
  frame.camera = {
    zoom: 1 + engage * (1 - reset) * (throwing ? 0.1 : pressure ? 0.09 : 0.06),
    shakeX: cameraKick ? Math.sin(recoilTime * 125) * cameraKick : 0,
    shakeY: cameraKick
      ? Math.sin(recoilTime * 97 + 0.8) * cameraKick * 0.55
      : 0,
  };
  if (still) {
    frame.player = home("player");
    frame.enemy = home("enemy");
    frame.camera = { zoom: 1, shakeX: 0, shakeY: 0 };
    frame.contact.strength = frame.contact.visible ? 0.2 : 0;
    frame.phase = frame.contact.visible ? "contact" : "idle";
  }
  return frame;
}
