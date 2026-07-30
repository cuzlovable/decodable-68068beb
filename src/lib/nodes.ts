// Nodal environment helpers: gate archetypes, astrological house placement,
// and the "stage & atmosphere" narrative used on the Environment page.

import { GATE_TO_CENTER } from "@/lib/humandesign";

export const GATE_NAMES: Record<number, string> = {
  1: "Self-Expression", 2: "Direction of the Self", 3: "Ordering", 4: "Formulization",
  5: "Fixed Rhythms", 6: "Friction", 7: "The Role of the Self", 8: "Contribution",
  9: "Focus", 10: "Behavior of the Self", 11: "Harmony of Ideas", 12: "Caution",
  13: "The Listener", 14: "Power Skills", 15: "Extremes", 16: "Skills",
  17: "Opinions", 18: "Correction", 19: "Wanting", 20: "The Now",
  21: "The Hunter", 22: "Openness", 23: "Assimilation", 24: "Rationalizing",
  25: "The Spirit of the Self", 26: "The Egoist", 27: "Caring", 28: "The Game Player",
  29: "Perseverance", 30: "Recognition of Feelings", 31: "Leading", 32: "Continuity",
  33: "Privacy", 34: "Power", 35: "Change", 36: "Crisis",
  37: "Friendship", 38: "The Fighter", 39: "Provocation", 40: "Aloneness",
  41: "Contraction", 42: "Growth", 43: "Insight", 44: "Alertness",
  45: "The Gatherer", 46: "Determination of the Self", 47: "Realizing", 48: "Depth of Knowledge",
  49: "Principles", 50: "Values", 51: "Shock", 52: "Stillness",
  53: "Beginnings", 54: "Ambition", 55: "Spirit", 56: "Stimulation",
  57: "Intuitive Clarity", 58: "Vitality", 59: "Intimacy", 60: "Acceptance",
  61: "Inner Truth", 62: "Detail", 63: "Doubt", 64: "Confusion",
};

// Zodiac order of the 64 gates, beginning at 0° Aries (inside gate 25).
const WHEEL: number[] = [
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12,
  15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6,
  46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11,
  10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36,
];

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const HOUSE_LABELS: Record<number, string> = {
  1: "Identity & first impressions",
  2: "Resources & self-worth",
  3: "Local life & learning",
  4: "Home & roots",
  5: "Play & creativity",
  6: "Daily rhythm & craft",
  7: "One-to-one connection",
  8: "Depth, mystery & shared resources",
  9: "Travel, study & meaning",
  10: "Public life & visibility",
  11: "Community & networks",
  12: "Retreat & the unseen",
};

const SUN_SIGN_CUTOFFS: Array<[number, number, number]> = [
  // [month (1-12), day the sign starts, sign index]
  [1, 20, 10], [2, 19, 11], [3, 21, 0], [4, 20, 1], [5, 21, 2], [6, 21, 3],
  [7, 23, 4], [8, 23, 5], [9, 23, 6], [10, 23, 7], [11, 22, 8], [12, 22, 9],
];

export function sunSignIndex(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const [, cutoff, sign] = SUN_SIGN_CUTOFFS[m - 1];
  if (day >= cutoff) return sign;
  return (sign + 11) % 12;
}

export function gateSignIndex(gate: number): number | null {
  const idx = WHEEL.indexOf(gate);
  if (idx === -1) return null;
  const degrees = idx * (360 / 64);
  return Math.floor(degrees / 30) % 12;
}

export type HousePlacement = { house: number; label: string; ordinal: string; sign: string };

/** Solar-house placement (Sun sign = 1st house) — no birth-time dependency. */
export function housePlacement(gate: number, birthDate?: string | null): HousePlacement | null {
  const gSign = gateSignIndex(gate);
  const sSign = sunSignIndex(birthDate);
  if (gSign === null || sSign === null) return null;
  const house = ((gSign - sSign + 12) % 12) + 1;
  return {
    house,
    label: HOUSE_LABELS[house],
    ordinal: ordinal(house),
    sign: SIGNS[gSign],
  };
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

type CenterAtmosphere = {
  setting: string;
  audience: string;
  keywords: string[];
};

const CENTER_ATMOSPHERE: Record<string, CenterAtmosphere> = {
  head: {
    setting: "Quiet, question-rich spaces — archives, planetariums, lecture halls",
    audience: "Attracts wonderers and people carrying big open questions",
    keywords: ["library", "planetarium", "lecture hall", "philosophy bookstore"],
  },
  ajna: {
    setting: "Study-friendly rooms — reading rooms, seminar spaces, quiet cafés",
    audience: "Attracts thinkers who want your framing and clarity",
    keywords: ["reading room", "bookstore café", "museum", "study space"],
  },
  throat: {
    setting: "Rooms with a stage or a mic — open mics, salons, studios",
    audience: "Attracts audiences who want to hear you speak or perform",
    keywords: ["open mic venue", "recording studio", "talk venue", "art gallery"],
  },
  g: {
    setting: "Places with a strong sense of direction — art spaces, waterfronts, sanctuaries",
    audience: "Attracts people looking for love, direction, and belonging",
    keywords: ["art gallery", "botanical garden", "waterfront park", "sanctuary"],
  },
  heart: {
    setting: "Spaces of exchange and commitment — markets, gyms, deal-making rooms",
    audience: "Attracts people who value willpower, promises, and results",
    keywords: ["market", "gym", "business club", "auction house"],
  },
  splenic: {
    setting: "Grounding, health-forward spaces — wellness studios, forests, saunas",
    audience: "Attracts people needing safety, timing, and instinctive guidance",
    keywords: ["wellness studio", "forest trail", "sauna", "herbal apothecary"],
  },
  solar: {
    setting: "Emotionally rich spaces — live music, intimate restaurants, theaters",
    audience: "Attracts people moving through feeling, romance, and drama",
    keywords: ["live music venue", "intimate restaurant", "theater", "wine bar"],
  },
  sacral: {
    setting: "Hands-on, working spaces — workshops, kitchens, makerspaces",
    audience: "Attracts collaborators with energy to build alongside you",
    keywords: ["makerspace", "cooking class", "craft workshop", "community kitchen"],
  },
  root: {
    setting: "Spaces with momentum — trails, climbing gyms, busy plazas",
    audience: "Attracts people ready to start something and move",
    keywords: ["hiking trail", "climbing gym", "plaza", "run club"],
  },
};

const FALLBACK: CenterAtmosphere = {
  setting: "Spaces that let your aura settle and be met",
  audience: "Attracts people resonating with this theme",
  keywords: ["park", "café", "cultural center"],
};

export type NodalProfile = {
  gate: number;
  gateName: string;
  house: HousePlacement | null;
  coreTheme: string;
  setting: string;
  audience: string;
  keywords: string[];
  tags: string[];
};

export function nodalProfile(
  gate: number | null | undefined,
  birthDate?: string | null,
  kind: "south" | "north" = "south"
): NodalProfile | null {
  if (!gate) return null;
  const gateName = GATE_NAMES[gate] ?? `Gate ${gate}`;
  const center = (GATE_TO_CENTER as Record<number, string>)[gate];
  const atmos = CENTER_ATMOSPHERE[center] ?? FALLBACK;
  const coreTheme =
    kind === "south"
      ? `Environments that call on your ${gateName.toLowerCase()}`
      : `Environments that grow your ${gateName.toLowerCase()}`;

  return {
    gate,
    gateName,
    house: housePlacement(gate, birthDate),
    coreTheme,
    setting: atmos.setting,
    audience: atmos.audience,
    keywords: atmos.keywords,
    tags: atmos.keywords.map(
      (k) => "#" + k.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join("")
    ),
  };
}

/** Ages 38–42 is the nodal transition window. */
export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}
