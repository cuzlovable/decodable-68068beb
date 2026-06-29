// Primary Health System (PHS) variable decoder.
// Each variable is reported by the chart engine as a number `color + tone/10`
// e.g. 5.2 = Color 5, Tone 2.

export type PhsVariableKey = "digestion" | "environment" | "motivation" | "perspective";

export type PhsDecoded = {
  color: number;
  tone: number;
  colorLabel: string;
  toneLabel: string;
  full: string; // e.g. "Narrow Valley"
};

// ---------- ENVIRONMENT (Design Node) ----------
// Color = the broad environment; Tone = the sub-quality.
const ENV_COLORS = ["Caves", "Markets", "Kitchens", "Mountains", "Valleys", "Shores"];
const ENV_TONES: Record<number, string[]> = {
  1: ["Selective", "Promiscuous", "Public", "Private", "Crowded", "Solitary"],
  2: ["Active", "Passive", "Tradition", "Novelty", "Bountiful", "Sparse"],
  3: ["Wood", "Metal", "Earthen", "Stone", "Artificial", "Natural"],
  4: ["Active", "Quiet", "Bare", "Forested", "Sunny", "Shady"],
  5: ["Wet", "Narrow", "Dry", "Deep", "Sunny", "Shady"],
  6: ["Natural", "Artificial", "Lakes", "Rivers", "Oceans", "Streams"],
};

// ---------- DIGESTION (Design Sun/Earth) — Determination ----------
const DIG_COLORS = ["Consecutive", "Alternating", "Open Taste", "Closed Taste", "Hot", "Cold"];
const DIG_TONES: Record<number, string[]> = {
  1: ["Appetite", "Thirst", "Touch", "Sound", "Light", "Smell"],
  2: ["Loud", "Quiet", "Calm", "Nervous", "Solitary", "Social"],
  3: ["Outer Vision", "Inner Vision", "High", "Low", "Direct", "Indirect"],
  4: ["Strategic", "Receptive", "Stimulating", "Soothing", "Empathic", "Detached"],
  5: ["Practical", "Imaginative", "Curious", "Methodical", "Fast", "Slow"],
  6: ["Subjective", "Objective", "Material", "Spiritual", "Light Touch", "Deep Touch"],
};

// ---------- MOTIVATION (Personality Sun/Earth) ----------
const MOT_COLORS = ["Fear", "Hope", "Desire", "Need", "Guilt", "Innocence"];
const MOT_TONES: Record<number, string[]> = {
  1: ["Reasoning", "Logic", "Authority", "Acceptance", "Justice", "Mercy"],
  2: ["Leadership", "Following", "Solidarity", "Independence", "Sharing", "Privacy"],
  3: ["Bonding", "Bargains", "Generosity", "Restraint", "Sentimentality", "Practicality"],
  4: ["Building", "Healing", "Nurturing", "Surviving", "Teaching", "Learning"],
  5: ["Correcting", "Mentoring", "Influencing", "Allowing", "Provoking", "Calming"],
  6: ["Witnessing", "Guiding", "Optimism", "Caution", "Acceptance", "Refusal"],
};

// ---------- PERSPECTIVE / VIEW (Personality Node) ----------
const PERSP_COLORS = ["Survival", "Possibility", "Power", "Wanting", "Probability", "Personal"];
const PERSP_TONES: Record<number, string[]> = {
  1: ["Focused", "Peripheral", "Direct", "Indirect", "Sharp", "Soft"],
  2: ["Active", "Receptive", "Open", "Closed", "Wide", "Narrow"],
  3: ["Realist", "Idealist", "Pragmatic", "Inspired", "Grounded", "Visionary"],
  4: ["Strategic", "Spontaneous", "Calculated", "Intuitive", "Cautious", "Bold"],
  5: ["Internal", "External", "Reflective", "Reactive", "Patient", "Immediate"],
  6: ["Personal", "Universal", "Intimate", "Public", "Felt", "Observed"],
};

function decodeWith(
  raw: number | string | undefined,
  colors: string[],
  tones: Record<number, string[]>,
): PhsDecoded | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (!Number.isFinite(n)) return null;
  const color = Math.floor(n);
  // round to 1 dp to avoid 5.2000000001 → 0.20000001
  const tone = Math.round((n - color) * 10);
  if (color < 1 || color > 6 || tone < 1 || tone > 6) return null;
  const colorLabel = colors[color - 1];
  const toneLabel = tones[color]?.[tone - 1] ?? "";
  const full = toneLabel ? `${toneLabel} ${colorLabel.replace(/s$/, "")}` : colorLabel;
  return { color, tone, colorLabel, toneLabel, full };
}

export function decodeEnvironment(v: number | string | undefined) {
  return decodeWith(v, ENV_COLORS, ENV_TONES);
}
export function decodeDigestion(v: number | string | undefined) {
  return decodeWith(v, DIG_COLORS, DIG_TONES);
}
export function decodeMotivation(v: number | string | undefined) {
  return decodeWith(v, MOT_COLORS, MOT_TONES);
}
export function decodePerspective(v: number | string | undefined) {
  return decodeWith(v, PERSP_COLORS, PERSP_TONES);
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
