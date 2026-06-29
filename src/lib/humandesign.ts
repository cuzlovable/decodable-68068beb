// ============================================================
// Human Design Data Engine
// 9 Centers, 64 Gates, 36 Channels, Open Center Logic
// ============================================================

export type CenterId =
  | "head"
  | "ajna"
  | "throat"
  | "g"
  | "heart"
  | "sacral"
  | "splenic"
  | "solar"
  | "root";

export interface Center {
  id: CenterId;
  label: string;
  theme: string;
  openTheme: string;
  /** "Don't" statement when the center is open */
  dontStatement: string;
  /** Deconditioning tip */
  deconditioningTip: string;
  gates: number[];
}

export interface Channel {
  id: string;
  name: string;
  gates: [number, number];
  centers: [CenterId, CenterId];
  theme: string;
}

export interface Gate {
  number: number;
  name: string;
  center: CenterId;
  isMindGate: boolean; // Head or Ajna
}

// ─── 9 Centers ──────────────────────────────────────────────
export const CENTERS: Record<CenterId, Center> = {
  head: {
    id: "head",
    label: "Head",
    theme: "Inspiration & Mental Pressure",
    openTheme: "Overwhelmed by questions that aren't yours",
    dontStatement: "Don't try to answer everyone else's questions today.",
    deconditioningTip: "Let unanswered questions float — they aren't all yours to solve.",
    gates: [64, 61, 63],
  },
  ajna: {
    id: "ajna",
    label: "Ajna",
    theme: "Conceptualization & Mental Awareness",
    openTheme: "Pretending to be certain when you're not",
    dontStatement: "Don't pretend to be certain about things you're not sure of.",
    deconditioningTip: "Practice saying 'I don't know yet' — mental flexibility is your gift.",
    gates: [47, 24, 4, 17, 43, 11],
  },
  throat: {
    id: "throat",
    label: "Throat",
    theme: "Communication & Manifestation",
    openTheme: "Trying to attract attention or speak to be heard",
    dontStatement: "Don't force yourself to speak — wait to be invited or recognized.",
    deconditioningTip: "Silence is your superpower. Speak only when the energy is there.",
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  },
  g: {
    id: "g",
    label: "G / Self",
    theme: "Identity, Love & Direction",
    openTheme: "Searching for identity and love in the wrong places",
    dontStatement: "Don't search for who you are — let your environment reveal it.",
    deconditioningTip: "Cold water therapy for the G-center. Place yourself in correct environments.",
    gates: [7, 1, 13, 25, 46, 2, 15, 10],
  },
  heart: {
    id: "heart",
    label: "Ego",
    theme: "Willpower & Worthiness",
    openTheme: "Trying to prove your worth",
    dontStatement: "Don't try to prove your worth today.",
    deconditioningTip: "You have nothing to prove. Rest when your body says rest.",
    gates: [21, 51, 26, 40],
  },
  sacral: {
    id: "sacral",
    label: "Sacral",
    theme: "Life Force & Sexuality",
    openTheme: "Not knowing when enough is enough",
    dontStatement: "Don't overcommit your energy — you don't have unlimited fuel.",
    deconditioningTip: "Lying flat for 15 minutes to reset the sacral. Honor your energy limits.",
    gates: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  },
  splenic: {
    id: "splenic",
    label: "Spleen",
    theme: "Intuition, Health & Timing",
    openTheme: "Holding on to what isn't good for you",
    dontStatement: "Don't hold onto people, places, or habits that aren't healthy.",
    deconditioningTip: "Practice letting go. Your body knows what's toxic — listen to it.",
    gates: [48, 57, 44, 50, 32, 28, 18],
  },
  solar: {
    id: "solar",
    label: "Solar Plexus",
    theme: "Emotions & Feelings",
    openTheme: "Avoiding confrontation and truth",
    dontStatement: "Don't avoid confrontation — and don't absorb others' emotional waves.",
    deconditioningTip: "Auric distance (6ft+). Separate your emotions from the room's energy.",
    gates: [6, 37, 22, 36, 30, 55, 49],
  },
  root: {
    id: "root",
    label: "Root",
    theme: "Adrenaline & Pressure",
    openTheme: "Rushing to be free of pressure",
    dontStatement: "Don't rush through your day just to relieve pressure.",
    deconditioningTip: "Pressure is not urgency. Move at your own pace — the deadline is an illusion.",
    gates: [53, 60, 52, 19, 39, 41, 58, 38, 54],
  },
};

// ─── 36 Channels ────────────────────────────────────────────
export const CHANNELS: Channel[] = [
  // Head ↔ Ajna
  { id: "64-47", name: "Abstraction", gates: [64, 47], centers: ["head", "ajna"], theme: "Mental activity and abstract thinking" },
  { id: "61-24", name: "Awareness", gates: [61, 24], centers: ["head", "ajna"], theme: "Thinking and inspiration" },
  { id: "63-4", name: "Logic", gates: [63, 4], centers: ["head", "ajna"], theme: "Logical understanding" },
  // Ajna ↔ Throat
  { id: "17-62", name: "Acceptance", gates: [17, 62], centers: ["ajna", "throat"], theme: "Organizational thinking" },
  { id: "43-23", name: "Structuring", gates: [43, 23], centers: ["ajna", "throat"], theme: "Individual knowing" },
  { id: "11-56", name: "Curiosity", gates: [11, 56], centers: ["ajna", "throat"], theme: "Seeking and stimulation" },
  { id: "4-63", name: "Logic", gates: [4, 63], centers: ["ajna", "head"], theme: "Logic and formulaic answers" },
  // Throat ↔ G
  { id: "31-7", name: "The Alpha", gates: [31, 7], centers: ["throat", "g"], theme: "Leadership" },
  { id: "8-1", name: "Inspiration", gates: [8, 1], centers: ["throat", "g"], theme: "Creative role modeling" },
  { id: "33-13", name: "The Prodigal", gates: [33, 13], centers: ["throat", "g"], theme: "Witness and listener" },
  { id: "20-10", name: "Awakening", gates: [20, 10], centers: ["throat", "g"], theme: "Commitment to self" },
  // Throat ↔ Sacral
  { id: "20-34", name: "Charisma", gates: [20, 34], centers: ["throat", "sacral"], theme: "Power of now" },
  // Throat ↔ Solar Plexus
  { id: "35-36", name: "Transitoriness", gates: [35, 36], centers: ["throat", "solar"], theme: "Jack of all trades" },
  { id: "12-22", name: "Openness", gates: [12, 22], centers: ["throat", "solar"], theme: "Social being" },
  { id: "45-21", name: "Money Line", gates: [45, 21], centers: ["throat", "heart"], theme: "Materialist" },
  // Throat ↔ Spleen
  { id: "16-48", name: "The Wavelength", gates: [16, 48], centers: ["throat", "splenic"], theme: "Talent" },
  { id: "20-57", name: "The Brainwave", gates: [20, 57], centers: ["throat", "splenic"], theme: "Penetrating awareness" },
  // G ↔ Sacral
  { id: "15-5", name: "Rhythm", gates: [15, 5], centers: ["g", "sacral"], theme: "Fixed rhythms" },
  { id: "46-29", name: "Discovery", gates: [46, 29], centers: ["g", "sacral"], theme: "Saying yes" },
  { id: "2-14", name: "The Beat", gates: [2, 14], centers: ["g", "sacral"], theme: "Direction and empowerment" },
  // G ↔ Spleen
  { id: "25-51", name: "Initiation", gates: [25, 51], centers: ["g", "splenic"], theme: "First to be or try" },
  { id: "10-57", name: "Perfected Form", gates: [10, 57], centers: ["g", "splenic"], theme: "Survival behavior" },
  // Heart ↔ Sacral
  { id: "26-44", name: "Surrender", gates: [26, 44], centers: ["heart", "splenic"], theme: "Transmitter" },
  // Heart ↔ G
  { id: "25-51", name: "Initiation", gates: [25, 51], centers: ["g", "heart"], theme: "Competitive spirit" },
  // Heart ↔ Throat
  { id: "45-21", name: "Money Line", gates: [45, 21], centers: ["throat", "heart"], theme: "Material world" },
  // Sacral ↔ Spleen
  { id: "27-50", name: "Preservation", gates: [27, 50], centers: ["sacral", "splenic"], theme: "Custodian" },
  { id: "59-6", name: "Intimacy", gates: [59, 6], centers: ["sacral", "solar"], theme: "Mating and bonding" },
  { id: "34-57", name: "Power", gates: [34, 57], centers: ["sacral", "splenic"], theme: "Human archetype" },
  { id: "3-60", name: "Mutation", gates: [3, 60], centers: ["sacral", "root"], theme: "Energy to begin and pulse" },
  { id: "42-53", name: "Maturation", gates: [42, 53], centers: ["sacral", "root"], theme: "Cycles of growth" },
  { id: "9-52", name: "Concentration", gates: [9, 52], centers: ["sacral", "root"], theme: "Focus and determination" },
  // Sacral ↔ Solar Plexus
  { id: "59-6", name: "Mating", gates: [59, 6], centers: ["sacral", "solar"], theme: "Fertility" },
  // Solar Plexus ↔ Root
  { id: "19-49", name: "Synthesis", gates: [19, 49], centers: ["root", "solar"], theme: "Sensitivity and need" },
  { id: "39-55", name: "Emoting", gates: [39, 55], centers: ["root", "solar"], theme: "Spirit and provocation" },
  { id: "41-30", name: "Recognition", gates: [41, 30], centers: ["root", "solar"], theme: "Feelings and desire" },
  // Spleen ↔ Root
  { id: "54-32", name: "Transformation", gates: [54, 32], centers: ["root", "splenic"], theme: "Ambition and drive" },
  { id: "38-28", name: "Struggle", gates: [38, 28], centers: ["root", "splenic"], theme: "Stubbornness and purpose" },
  { id: "58-18", name: "Judgment", gates: [58, 18], centers: ["root", "splenic"], theme: "Correction and vitality" },
];

// ─── Unique channel list (deduplicated by gate pair) ────────
const seen = new Set<string>();
export const UNIQUE_CHANNELS = CHANNELS.filter((ch) => {
  const key = [...ch.gates].sort().join("-");
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// ─── Gates → Center mapping ────────────────────────────────
export const GATE_TO_CENTER: Record<number, CenterId> = {};
for (const center of Object.values(CENTERS)) {
  for (const gate of center.gates) {
    GATE_TO_CENTER[gate] = center.id;
  }
}

// ─── All 64 Gates ──────────────────────────────────────────
export const GATES: Gate[] = Array.from({ length: 64 }, (_, i) => {
  const num = i + 1;
  const center = GATE_TO_CENTER[num] || "g";
  return {
    number: num,
    name: `Gate ${num}`,
    center,
    isMindGate: center === "head" || center === "ajna",
  };
});

// ─── Open Center Detection ─────────────────────────────────
/**
 * Given a set of defined gate numbers, determine which centers are defined/open.
 * A center is DEFINED if it has at least one complete channel
 * (both gates of a channel present in the defined gates set).
 */
export function getDefinedCenters(definedGates: number[]): Set<CenterId> {
  const gateSet = new Set(definedGates);
  const definedCenters = new Set<CenterId>();

  for (const channel of UNIQUE_CHANNELS) {
    if (gateSet.has(channel.gates[0]) && gateSet.has(channel.gates[1])) {
      definedCenters.add(channel.centers[0]);
      definedCenters.add(channel.centers[1]);
    }
  }

  return definedCenters;
}

export function getOpenCenters(definedGates: number[]): CenterId[] {
  const defined = getDefinedCenters(definedGates);
  return (Object.keys(CENTERS) as CenterId[]).filter((c) => !defined.has(c));
}

// ─── Daily Deconditioning Tips ─────────────────────────────
export interface DeconditioningItem {
  id: string;
  center: CenterId;
  title: string;
  description: string;
  duration?: string;
}

export function getDeconditioningItems(openCenters: CenterId[]): DeconditioningItem[] {
  const items: DeconditioningItem[] = [];

  for (const centerId of openCenters) {
    const center = CENTERS[centerId];
    items.push({
      id: `decon-${centerId}`,
      center: centerId,
      title: `${center.label} Center Reset`,
      description: center.deconditioningTip,
      duration: centerId === "sacral" ? "15 min" : centerId === "solar" ? "6ft+ distance" : undefined,
    });
  }

  // Universal tips
  items.push(
    {
      id: "decon-auric",
      center: "solar",
      title: "Auric Distance Practice",
      description: "Spend 15+ minutes alone to recalibrate your aura. At least 6 feet from others.",
      duration: "15 min",
    },
    {
      id: "decon-lying",
      center: "sacral",
      title: "Sacral Lie-Down",
      description: "Lie flat on your back before sleep. Let the sacral motor wind down naturally.",
      duration: "15 min",
    },
    {
      id: "decon-cold",
      center: "g",
      title: "Cold Water G-Center Reset",
      description: "Splash cold water on your chest/sternum area to reset the magnetic monopole.",
      duration: "2 min",
    }
  );

  return items;
}

// ─── Mind Gate Rinse Tips (Head + Ajna gates) ──────────────
export const MIND_GATE_TIPS: Record<number, { name: string; tip: string }> = {
  64: { name: "Confusion", tip: "Let mental images swirl without forcing clarity — answers arrive when the noise settles." },
  61: { name: "Mystery", tip: "Sit with the unknown. Not every 'why' is yours to solve today." },
  63: { name: "Doubt", tip: "Question the doubt before acting on it — most of it isn't real." },
  47: { name: "Realization", tip: "Insights surface on their own schedule. Stop chasing the aha." },
  24: { name: "Rationalization", tip: "Stop replaying the loop. Insight returns when you stop gripping it." },
  4:  { name: "Formulization", tip: "'I don't know yet' is a complete answer. Don't fabricate certainty." },
  17: { name: "Opinion", tip: "Don't share opinions that weren't invited — they bounce back as pressure." },
  43: { name: "Insight", tip: "Wait for the correct audience. The right ear unlocks the right words." },
  11: { name: "Ideas", tip: "Ideas are entertainment, not instructions. Enjoy them, don't act on them." },
};

export const MIND_GATES = [64, 61, 63, 47, 24, 4, 17, 43, 11];
