export const ARENAS = {
  underground: {
    id: "underground",
    name: "언더그라운드 클럽",
    nameEn: "UNDERGROUND CLUB",
    art: "arenas/underground.webp",
    color: "#e36161",
    description: "낮은 철골 천장 아래 링사이드를 가득 메운 관중과 붉은 조명",
  },
  neon: {
    id: "neon",
    name: "네온 돔",
    nameEn: "NEON DOME",
    art: "arenas/neon.webp",
    color: "#72dce5",
    description: "청록과 자홍 조명, 관중석을 두른 전광판의 네온 경기장",
  },
  stadium: {
    id: "stadium",
    name: "그랜드 스타디움",
    nameEn: "GRAND STADIUM",
    art: "arenas/stadium.webp",
    color: "#d7bd87",
    description: "촘촘한 다층 관중석과 방송 조명이 비추는 대형 스타디움",
  },
  championship: {
    id: "championship",
    name: "크라운 콜로세움",
    nameEn: "CROWN COLOSSEUM",
    art: "arenas/championship.webp",
    color: "#f2cc68",
    description:
      "황금빛 조명과 붉은 입장 무대, 만원 관중이 둘러싼 챔피언십 경기장",
  },
};

// A location is a property of the match. Card use, turns and reloads never reroll it.
export function getArenaEnvironment(state) {
  const wave = Math.min(3, Math.max(1, Number(state?.wave) || 1));
  const floor = Math.min(8, Math.max(1, Number(state?.floor) || 1));
  if (floor === 8)
    return ARENAS[
      wave === 1 ? "neon" : wave === 2 ? "stadium" : "championship"
    ];
  const routes = {
    1: ["underground", "underground", "neon"],
    2: ["neon", "stadium", "neon"],
    3: ["stadium", "championship", "stadium"],
  };
  const index = Math.floor((floor - 1) / 2) % 3;
  return ARENAS[routes[wave][index]];
}

const reactions = {
  cheer: {
    kind: "cheer",
    chant: "LET’S GO!",
    label: "관중의 환호",
    intensity: 0.65,
  },
  eruption: {
    kind: "eruption",
    chant: "THIS IS AWESOME!",
    label: "기립 환호",
    intensity: 1,
  },
  gasp: {
    kind: "gasp",
    chant: "OOOH!",
    label: "충격에 술렁이는 관중",
    intensity: 0.75,
  },
  submission: {
    kind: "submission",
    chant: "TAP! TAP! TAP!",
    label: "탭아웃을 외치는 관중",
    intensity: 0.8,
  },
  boo: { kind: "boo", chant: "BOOO!", label: "관중의 야유", intensity: 0.7 },
  applause: {
    kind: "applause",
    chant: "CLAP! CLAP!",
    label: "응원의 박수",
    intensity: 0.4,
  },
};
export function crowdReaction(kind) {
  const reaction = reactions[kind];
  return reaction
    ? { ...reaction, duration: kind === "eruption" ? 2800 : 2200 }
    : null;
}
export function reactionForTechnique(cue) {
  if (!cue) return null;
  if (cue.knockout || (cue.finisher && cue.damage > 0))
    return crowdReaction("eruption");
  if (cue.attacking && !cue.damage) return crowdReaction("gasp");
  if (cue.disciplineSlug === "submission") return crowdReaction("submission");
  if (cue.damage >= 15 || cue.hits > 1 || cue.disciplineSlug === "aerial")
    return crowdReaction("cheer");
  if (cue.disciplineSlug === "nightmare") return crowdReaction("boo");
  return crowdReaction(
    cue.attacking || ["spotlight", "rally"].includes(cue.cardId)
      ? "cheer"
      : "applause",
  );
}
export function reactionForOpponent(before, after, impact) {
  if (!before || !after || before === after) return null;
  if (impact?.knockout) return crowdReaction("gasp");
  if (impact && !impact.damage && impact.blocked) return crowdReaction("cheer");
  if (
    impact?.damage ||
    after.player.stress > before.player.stress ||
    after.player.hp < before.player.hp
  )
    return crowdReaction("boo");
  return null;
}
