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

export const HOUSE_LABELS: Record<number, string> = {
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

/** Tropical ecliptic longitude (0–360°) for a gate, refined by line when given. */
export function gateLongitude(gate: number, line?: number | null): number | null {
  const idx = WHEEL.indexOf(gate);
  if (idx === -1) return null;
  const step = 360 / 64;
  const lineOffset = line && line >= 1 && line <= 6 ? ((line - 0.5) / 6) * step : step / 2;
  return (idx * step + lineOffset) % 360;
}


export type HousePlacement = { house: number; label: string; ordinal: string; sign: string };

/**
 * Whole-sign house placement.
 * Uses the Ascendant sign when available (accurate), otherwise falls back to
 * solar houses (Sun sign = 1st house) which needs no birth time.
 */
export function housePlacement(
  gate: number,
  birthDate?: string | null,
  ascSignIndex?: number | null
): HousePlacement | null {
  const gSign = gateSignIndex(gate);
  const base = ascSignIndex ?? sunSignIndex(birthDate);
  if (gSign === null || base === null || base === undefined) return null;
  const house = ((gSign - base + 12) % 12) + 1;
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

/** Astrological house flavour used to colour the stage & atmosphere copy. */
const HOUSE_THEME: Record<number, { theme: string; setting: string; audience: string; keywords: string[] }> = {
  1: { theme: "showing up as yourself and being seen first-hand", setting: "places where you arrive as the main presence", audience: "people who respond to you directly", keywords: ["plaza", "studio", "gym"] },
  2: { theme: "building resources, skill and self-worth", setting: "places tied to craft, value and steady earning", audience: "people who value substance and quality", keywords: ["market", "artisan shop", "craft studio"] },
  3: { theme: "local movement, conversation and learning", setting: "neighbourhood spots within short reach", audience: "neighbours, siblings-in-spirit, quick-talkers", keywords: ["neighborhood café", "bookstore", "community class"] },
  4: { theme: "roots, home and private belonging", setting: "domestic, sheltered, family-feeling spaces", audience: "chosen family and close-knit circles", keywords: ["home kitchen", "garden", "family restaurant"] },
  5: { theme: "play, romance and creative expression", setting: "spaces made for delight and performance", audience: "playful people and admirers", keywords: ["theater", "dance studio", "art class"] },
  6: { theme: "daily rhythm, service and refining the craft", setting: "routine-friendly, practical, health-oriented spaces", audience: "people who work alongside you day to day", keywords: ["wellness studio", "co-working space", "farmers market"] },
  7: { theme: "one-to-one meeting and partnership", setting: "spaces built for two — booths, benches, small tables", audience: "partners, collaborators, close counterparts", keywords: ["intimate restaurant", "tea house", "wine bar"] },
  8: { theme: "depth, mystery and shared resources", setting: "spaces rich in research, privacy and transformation", audience: "people seeking depth and honest guidance", keywords: ["esoteric library", "archive", "hot spring"] },
  9: { theme: "travel, study and meaning-making", setting: "expansive spaces that widen your horizon", audience: "seekers, teachers and travellers", keywords: ["university", "museum", "trailhead"] },
  10: { theme: "public life, visibility and contribution", setting: "spaces where your work is witnessed", audience: "peers, mentors and the wider public", keywords: ["conference venue", "gallery", "civic center"] },
  11: { theme: "community, networks and shared futures", setting: "gathering spaces with many loose connections", audience: "communities, groups and future friends", keywords: ["community hub", "meetup space", "co-op"] },
  12: { theme: "retreat, solitude and the unseen", setting: "quiet, contemplative, slightly hidden spaces", audience: "few people — and the quiet ones who find you", keywords: ["retreat center", "chapel", "secluded shoreline"] },
};

/** PHS Environment colour (1–6) — the physical terrain your body needs. */
const ENV_COLOR: Record<number, { name: string; setting: string; keywords: string[] }> = {
  1: { name: "Caves", setting: "enclosed, contained rooms with clear boundaries", keywords: ["small venue", "reading nook", "cabin"] },
  2: { name: "Markets", setting: "spaces with traffic, exchange and passing life", keywords: ["market", "bazaar", "arcade"] },
  3: { name: "Kitchens", setting: "spaces where things are made, mixed and shared", keywords: ["kitchen", "workshop", "bakery"] },
  4: { name: "Mountains", setting: "elevated spaces with a view over the terrain", keywords: ["lookout", "rooftop", "hill trail"] },
  5: { name: "Valleys", setting: "low, held spaces between two rises — sheltered and grounded", keywords: ["valley trail", "courtyard", "canyon park"] },
  6: { name: "Shores", setting: "edges and thresholds where two elements meet", keywords: ["shoreline", "riverbank", "harbor"] },
};

/** PHS Environment tone (1–6) — how you should engage the space. */
const ENV_TONE: Record<number, { name: string; cue: string; audience: string }> = {
  1: { name: "Smell", cue: "trust the first scent-level impression of a room", audience: "be around people whose presence smells right before they speak" },
  2: { name: "Taste", cue: "let the flavour of a place decide — the ambience you can almost taste", audience: "be with people whose company has a distinct, agreeable flavour" },
  3: { name: "Outer Vision", cue: "choose spaces by what you can see happening around you", audience: "be where you can watch people move" },
  4: { name: "Inner Vision", cue: "choose spaces that match the picture you hold inside", audience: "be with people who fit your inner image of the moment" },
  5: { name: "Feeling", cue: "read the emotional weather of the room before staying", audience: "be with people whose mood lands well on you" },
  6: { name: "Touch", cue: "let physical contact with the place decide — texture, temperature, surface", audience: "be with people you feel comfortable near physically" },
};

const ENV_FIXED: Record<number, [string, string]> = {
  1: ["Selective", "Blending"], 2: ["Internal", "External"], 3: ["Wet", "Dry"],
  4: ["Active", "Passive"], 5: ["Narrow", "Wide"], 6: ["Natural", "Artificial"],
};

export type NodalContext = {
  /** Externally calculated house number (Placidus) — overrides whole-sign. */
  houseNumber?: number | null;
  /** PHS Environment variable colour (1–6). */
  envColor?: number | null;
  /** PHS Environment variable tone (1–6). */
  envTone?: number | null;
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
  phsLabel: string | null;
};

export function nodalProfile(
  gate: number | null | undefined,
  birthDate?: string | null,
  kind: "south" | "north" = "south",
  ascSignIndex?: number | null,
  context?: NodalContext
): NodalProfile | null {
  if (!gate) return null;
  const gateName = GATE_NAMES[gate] ?? `Gate ${gate}`;
  const center = (GATE_TO_CENTER as Record<number, string>)[gate];
  const atmos = CENTER_ATMOSPHERE[center] ?? FALLBACK;

  const whole = housePlacement(gate, birthDate, ascSignIndex);
  const houseNumber = context?.houseNumber ?? whole?.house ?? null;
  const house: HousePlacement | null = houseNumber
    ? {
        house: houseNumber,
        label: HOUSE_LABELS[houseNumber],
        ordinal: ordinal(houseNumber),
        sign: whole?.sign ?? SIGNS[gateSignIndex(gate) ?? 0],
      }
    : null;
  const houseTheme = houseNumber ? HOUSE_THEME[houseNumber] : null;

  const color = context?.envColor && context.envColor >= 1 && context.envColor <= 6 ? context.envColor : null;
  const tone = context?.envTone && context.envTone >= 1 && context.envTone <= 6 ? context.envTone : null;
  const col = color ? ENV_COLOR[color] : null;
  const ton = tone ? ENV_TONE[tone] : null;
  const fixed = color && tone ? ENV_FIXED[color][tone <= 3 ? 0 : 1] : null;
  const phsLabel =
    col && ton
      ? `${fixed} ${col.name.replace(/s$/, "")} · ${ton.name}`
      : col
      ? col.name
      : null;

  const verb = kind === "south" ? "calls on" : "grows";
  const coreTheme = [
    `Environments where your ${gateName.toLowerCase()} ${verb} you`,
    houseTheme ? `through ${houseTheme.theme} (${ordinal(houseNumber!)} house)` : null,
    ton ? `— ${ton.cue}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const setting = [
    atmos.setting,
    houseTheme ? `set in ${houseTheme.setting}` : null,
    col ? `with a ${fixed?.toLowerCase() ?? ""} ${col.name.replace(/s$/, "").toLowerCase()} quality — ${col.setting}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  const audience = [
    atmos.audience,
    houseTheme ? `especially ${houseTheme.audience}` : null,
    ton ? ton.audience : null,
  ]
    .filter(Boolean)
    .join("; ");

  const keywords = Array.from(
    new Set([...atmos.keywords, ...(houseTheme?.keywords ?? []), ...(col?.keywords ?? [])])
  ).slice(0, 8);

  return {
    gate,
    gateName,
    house,
    coreTheme,
    setting,
    audience,
    keywords,
    phsLabel,
    tags: keywords.map(
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
