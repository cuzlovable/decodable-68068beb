// ============================================================
// Human Design Compatibility / Synastry Engine
// Gate-to-Gate Connections Only — No House-Based Astrology
// ============================================================

import { UNIQUE_CHANNELS, CENTERS, CenterId, getDefinedCenters } from "./humandesign";

// ─── Connection Types (HD Composites) ───────────────────────

export type ConnectionType =
  | "electromagnetic"   // Each person has one gate of a channel
  | "companionship"     // Both share the same gate (harmonic)
  | "dominance"         // One has a full channel, other has one gate
  | "compromise"        // Both have the full channel defined
  | "zero_compromise";  // 9-0 definition overlay

export interface GateConnection {
  type: ConnectionType;
  gate1: number;
  gate2: number;
  channelName: string;
  channelTheme: string;
  centers: [CenterId, CenterId];
  /** Plain-language chemistry description */
  chemistry: string;
}

export interface CompatibilityResult {
  connections: GateConnection[];
  electromagneticCount: number;
  companionshipCount: number;
  dominanceCount: number;
  compromiseCount: number;
  /** Composite defined centers (union of both charts) */
  compositeDefinedCenters: Set<CenterId>;
  /** Centers only defined in the composite (neither person has alone) */
  newlyDefinedCenters: CenterId[];
  /** Overall chemistry score 0-100 */
  chemistryScore: number;
  /** Dominant connection theme */
  dominantTheme: string;
  /** Summary text */
  summary: string;
}

// ─── Chemistry descriptions by connection type ──────────────

const ELECTROMAGNETIC_CHEMISTRY: Record<string, string> = {
  "64-47": "Together you complete the channel of Abstraction — endless mental inspiration flows between you.",
  "61-24": "You ignite each other's inner knowing. Mutual 'aha' moments are your love language.",
  "63-4": "Logic clicks between you. You finish each other's reasoning like a shared algorithm.",
  "17-62": "One organizes, the other details — a natural workflow partnership.",
  "43-23": "Individual genius meets articulation. You help each other be heard.",
  "11-56": "Curiosity meets storytelling. Together you never run out of things to explore.",
  "31-7": "A natural leadership dynamic. One directs, the other guides — magnetic authority.",
  "8-1": "Creative role modeling at its peak. You inspire each other's authentic expression.",
  "33-13": "A deep listener meets a natural witness. Secrets feel safe between you.",
  "20-10": "Mutual awakening — you see each other's true self and commit to honoring it.",
  "20-34": "Raw charisma. Together your presence fills a room with unstoppable energy.",
  "35-36": "Adventure junkies. You push each other into new experiences constantly.",
  "12-22": "Emotional depth meets social grace. Together you're magnetically charming.",
  "45-21": "Material ambition aligns. You build empires together — the 'money line' connection.",
  "16-48": "Talent meets depth. You refine each other's skills into mastery.",
  "20-57": "Intuitive awareness electrified. You sense things before they happen — together.",
  "15-5": "Your rhythms synchronize. Daily life together feels effortlessly in flow.",
  "46-29": "Saying yes to life — together. Discovery and commitment intertwined.",
  "2-14": "Direction meets empowerment. One knows the way, the other has the fuel.",
  "25-51": "Initiation energy. You challenge each other to be first, to be brave.",
  "10-57": "Survival instincts perfected. Together you navigate life with elegant precision.",
  "26-44": "Material intelligence. Together you sense opportunities before anyone else.",
  "27-50": "Deep caring meets responsibility. A nurturing, protective bond.",
  "59-6": "Intimate fusion. Sexual chemistry and emotional bonding at the deepest level.",
  "34-57": "Pure archetypal power. Intuition fueling raw life force — primal attraction.",
  "3-60": "Mutation energy. Together you catalyze change — nothing stays the same around you.",
  "42-53": "Growth cycles align. You mature and evolve together through life's chapters.",
  "9-52": "Laser focus together. When you partner up, concentration is unbreakable.",
  "19-49": "Sensitivity synthesis. You feel each other's needs before words are spoken.",
  "39-55": "Emotional provocation meets spirit. You push each other's emotional evolution.",
  "41-30": "Desire meets recognition. You fan each other's deepest longings into reality.",
  "54-32": "Transformation drive. Ambition is amplified — you push each other higher.",
  "38-28": "Stubborn purpose. You fight for meaning together — unbreakable when aligned.",
  "58-18": "Joyful correction. You help each other find vitality through honest feedback.",
};

function getDefaultChemistry(type: ConnectionType, channelName: string): string {
  switch (type) {
    case "electromagnetic":
      return `Electromagnetic pull through the Channel of ${channelName} — magnetic, irresistible attraction.`;
    case "companionship":
      return `Shared gate energy — you 'get' each other on the ${channelName} frequency. Comfortable and familiar.`;
    case "dominance":
      return `One leads on the ${channelName} channel — a teacher-student dynamic that deepens over time.`;
    case "compromise":
      return `Both fully defined in ${channelName} — strong but potentially stubborn. Neither yields easily.`;
    default:
      return `Connection through ${channelName}.`;
  }
}

// ─── Core Synastry Algorithm ────────────────────────────────

/**
 * Compute gate-to-gate compatibility between two charts.
 * Strictly HD mechanics — no house overlaps, no zodiacal friction.
 * Focus: electromagnetic connections, companionship, dominance, compromise.
 */
export function computeCompatibility(
  gatesA: number[],
  gatesB: number[]
): CompatibilityResult {
  const setA = new Set(gatesA);
  const setB = new Set(gatesB);
  const connections: GateConnection[] = [];

  for (const channel of UNIQUE_CHANNELS) {
    const [g1, g2] = channel.gates;
    const aHasG1 = setA.has(g1);
    const aHasG2 = setA.has(g2);
    const bHasG1 = setB.has(g1);
    const bHasG2 = setB.has(g2);

    const aFull = aHasG1 && aHasG2;
    const bFull = bHasG1 && bHasG2;

    const channelKey = [...channel.gates].sort().join("-");

    // ── Compromise: both have the full channel
    if (aFull && bFull) {
      connections.push({
        type: "compromise",
        gate1: g1,
        gate2: g2,
        channelName: channel.name,
        channelTheme: channel.theme,
        centers: channel.centers,
        chemistry: getDefaultChemistry("compromise", channel.name),
      });
      continue;
    }

    // ── Dominance: one has full channel, other has at least one gate
    if (aFull && (bHasG1 || bHasG2)) {
      connections.push({
        type: "dominance",
        gate1: g1,
        gate2: g2,
        channelName: channel.name,
        channelTheme: channel.theme,
        centers: channel.centers,
        chemistry: getDefaultChemistry("dominance", channel.name),
      });
      continue;
    }
    if (bFull && (aHasG1 || aHasG2)) {
      connections.push({
        type: "dominance",
        gate1: g1,
        gate2: g2,
        channelName: channel.name,
        channelTheme: channel.theme,
        centers: channel.centers,
        chemistry: getDefaultChemistry("dominance", channel.name),
      });
      continue;
    }

    // ── Electromagnetic: each person has one gate of the channel
    const electro =
      (aHasG1 && bHasG2 && !aHasG2 && !bHasG1) ||
      (aHasG2 && bHasG1 && !aHasG1 && !bHasG2);
    if (electro) {
      connections.push({
        type: "electromagnetic",
        gate1: g1,
        gate2: g2,
        channelName: channel.name,
        channelTheme: channel.theme,
        centers: channel.centers,
        chemistry:
          ELECTROMAGNETIC_CHEMISTRY[channelKey] ||
          getDefaultChemistry("electromagnetic", channel.name),
      });
      continue;
    }

    // ── Companionship: both share the same single gate (no full channel)
    const sharedGates: number[] = [];
    if (aHasG1 && bHasG1) sharedGates.push(g1);
    if (aHasG2 && bHasG2) sharedGates.push(g2);
    if (sharedGates.length > 0 && !aFull && !bFull) {
      connections.push({
        type: "companionship",
        gate1: sharedGates[0],
        gate2: sharedGates.length > 1 ? sharedGates[1] : sharedGates[0],
        channelName: channel.name,
        channelTheme: channel.theme,
        centers: channel.centers,
        chemistry: getDefaultChemistry("companionship", channel.name),
      });
    }
  }

  // ── Composite centers
  const allGates = [...new Set([...gatesA, ...gatesB])];
  const compositeDefinedCenters = getDefinedCenters(allGates);
  const definedA = getDefinedCenters(gatesA);
  const definedB = getDefinedCenters(gatesB);
  const newlyDefinedCenters = [...compositeDefinedCenters].filter(
    (c) => !definedA.has(c) && !definedB.has(c)
  );

  const electromagneticCount = connections.filter((c) => c.type === "electromagnetic").length;
  const companionshipCount = connections.filter((c) => c.type === "companionship").length;
  const dominanceCount = connections.filter((c) => c.type === "dominance").length;
  const compromiseCount = connections.filter((c) => c.type === "compromise").length;

  // ── Chemistry score (electromagnetic weighs heaviest)
  const chemistryScore = Math.min(
    100,
    electromagneticCount * 18 +
      companionshipCount * 8 +
      dominanceCount * 10 +
      newlyDefinedCenters.length * 12 -
      compromiseCount * 5
  );

  // ── Dominant theme
  let dominantTheme = "Neutral";
  const max = Math.max(electromagneticCount, companionshipCount, dominanceCount, compromiseCount);
  if (max === electromagneticCount && max > 0) dominantTheme = "High Electromagnetic Pull";
  else if (max === companionshipCount && max > 0) dominantTheme = "Deep Companionship";
  else if (max === dominanceCount && max > 0) dominantTheme = "Teacher-Student Dynamic";
  else if (max === compromiseCount && max > 0) dominantTheme = "Power Struggle Potential";

  // ── Summary
  const parts: string[] = [];
  if (electromagneticCount > 0)
    parts.push(`${electromagneticCount} electromagnetic connection${electromagneticCount > 1 ? "s" : ""} — irresistible pull`);
  if (newlyDefinedCenters.length > 0)
    parts.push(`${newlyDefinedCenters.length} center${newlyDefinedCenters.length > 1 ? "s" : ""} activated only together`);
  if (companionshipCount > 0)
    parts.push(`${companionshipCount} companionship harmonic${companionshipCount > 1 ? "s" : ""}`);
  if (dominanceCount > 0)
    parts.push(`${dominanceCount} dominance channel${dominanceCount > 1 ? "s" : ""}`);
  if (compromiseCount > 0)
    parts.push(`${compromiseCount} compromise zone${compromiseCount > 1 ? "s" : ""} — navigate with awareness`);

  const summary = parts.length > 0
    ? parts.join(". ") + "."
    : "Minimal gate overlap — an open field for discovery.";

  return {
    connections,
    electromagneticCount,
    companionshipCount,
    dominanceCount,
    compromiseCount,
    compositeDefinedCenters,
    newlyDefinedCenters,
    chemistryScore,
    dominantTheme,
    summary,
  };
}

// ─── Connection type metadata for UI ────────────────────────

export const CONNECTION_TYPE_META: Record<ConnectionType, { label: string; color: string; icon: string }> = {
  electromagnetic: { label: "Electromagnetic", color: "text-rose-400", icon: "⚡" },
  companionship: { label: "Companionship", color: "text-sky-400", icon: "🤝" },
  dominance: { label: "Dominance", color: "text-amber-400", icon: "👑" },
  compromise: { label: "Compromise", color: "text-orange-400", icon: "⚠️" },
  zero_compromise: { label: "9-0 Definition", color: "text-purple-400", icon: "🔮" },
};
