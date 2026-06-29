// Primary Health System (PHS) variable decoder.
// Based on the canonical Variable chart (Ra Uru Hu):
//   • Determination (Design Sun/Earth) — PHS tones
//   • Environment (Design Nodes)       — PHS tones
//   • Motivation (Personality Sun/Earth) — Awareness tones
//   • Perspective (Personality Nodes)  — Awareness tones
// Variables arrive as `color.tone` (e.g. 5.2 = Color 5 / Tone 2).

export type PhsVariableKey = "digestion" | "environment" | "motivation" | "perspective";

export type PhsDecoded = {
  color: number;
  tone: number;
  colorLabel: string;   // e.g. "Valleys"
  toneLabel: string;    // e.g. "Taste"
  leftFixed: string;    // e.g. "Narrow"
  rightFixed: string;   // e.g. "Wide"
  fixedLabel: string;   // leftFixed if tone<=3 else rightFixed
  fixedSide: "left" | "right";
  full: string;         // e.g. "Narrow Valley · Taste"
};

// PHS tones (Determination + Environment)
const PHS_TONES = ["Smell", "Taste", "Outer Vision", "Inner Vision", "Feeling", "Touch"];
// Awareness tones (Motivation + Perspective)
const AWARENESS_TONES = ["Security", "Uncertainty", "Action", "Meditation", "Judgement", "Acceptance"];

// Colors are listed 1 → 6 (matches the bottom row of each box on the chart).
type Table = {
  colors: string[];                  // index 0 = color 1
  leftFixed: string[];               // per color
  rightFixed: string[];              // per color
  tones: string[];                   // shared across colors for this variable type
};

const DETERMINATION: Table = {
  colors:     ["Appetite",   "Taste",   "Thirst", "Touch",   "Sound", "Light"],
  leftFixed:  ["Consecutive","Open",    "Hot",    "Calm",    "High",  "Direct"],
  rightFixed: ["Alternating","Closed",  "Cold",   "Nervous", "Low",   "Indirect"],
  tones: PHS_TONES,
};

const ENVIRONMENT: Table = {
  colors:     ["Caves",     "Markets",  "Kitchens", "Mountains", "Valleys", "Shores"],
  leftFixed:  ["Selective", "Internal", "Wet",      "Active",    "Narrow",  "Natural"],
  rightFixed: ["Blending",  "External", "Dry",      "Passive",   "Wide",    "Artificial"],
  tones: PHS_TONES,
};

const MOTIVATION: Table = {
  colors:     ["Fear",        "Hope",      "Desire", "Need",   "Guilt",       "Innocence"],
  leftFixed:  ["Communalist", "Theist",    "Leader", "Master", "Conditioner", "Observed"],
  rightFixed: ["Separatist",  "Antitheist","Follower","Novice","Conditioned", "Observer"],
  tones: AWARENESS_TONES,
};

const PERSPECTIVE: Table = {
  colors:     ["Survival", "Possibility", "Power",   "Wanting", "Probability", "Personal"],
  leftFixed:  ["Focused",  "Focused",     "Focused", "Focused", "Focused",     "Focused"],
  rightFixed: ["Peripheral","Peripheral", "Peripheral","Peripheral","Peripheral","Peripheral"],
  tones: AWARENESS_TONES,
};

function singularize(s: string) {
  if (s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.endsWith("s") && !s.endsWith("ss")) return s.slice(0, -1);
  return s;
}

function decodeWith(raw: number | string | undefined, table: Table): PhsDecoded | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (!Number.isFinite(n)) return null;
  const color = Math.floor(n);
  const tone = Math.round((n - color) * 10);
  if (color < 1 || color > 6 || tone < 1 || tone > 6) return null;

  const colorLabel = table.colors[color - 1];
  const toneLabel = table.tones[tone - 1];
  const leftFixed = table.leftFixed[color - 1];
  const rightFixed = table.rightFixed[color - 1];
  const fixedSide: "left" | "right" = tone <= 3 ? "left" : "right";
  const fixedLabel = fixedSide === "left" ? leftFixed : rightFixed;

  const full = `${fixedLabel} ${singularize(colorLabel)} · ${toneLabel}`;
  return { color, tone, colorLabel, toneLabel, leftFixed, rightFixed, fixedLabel, fixedSide, full };
}

export function decodeEnvironment(v: number | string | undefined) {
  return decodeWith(v, ENVIRONMENT);
}
export function decodeDigestion(v: number | string | undefined) {
  return decodeWith(v, DETERMINATION);
}
export function decodeMotivation(v: number | string | undefined) {
  return decodeWith(v, MOTIVATION);
}
export function decodePerspective(v: number | string | undefined) {
  return decodeWith(v, PERSPECTIVE);
}

export type PhsVariables = {
  digestion?: number;
  environment?: number;
  motivation?: number;
  perspective?: number;
};

export function decodeAll(vars: PhsVariables | null | undefined) {
  return {
    digestion: decodeDigestion(vars?.digestion),
    environment: decodeEnvironment(vars?.environment),
    motivation: decodeMotivation(vars?.motivation),
    perspective: decodePerspective(vars?.perspective),
  };
}
