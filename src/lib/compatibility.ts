// ============================================================
// AuraChem — CANONICAL COMPATIBILITY ENGINE
// The single source of truth for chemistry between two charts.
// Consumed by Discover, Likes, Matches and the Chemistry UI.
// Rules are product rules (not AI generated). AI may only
// narrate a result produced here — never determine it.
// ============================================================

import { CENTERS, UNIQUE_CHANNELS, type CenterId, type Channel, getDefinedCenters } from "./humandesign";

/** Human Design data required from each side. Persisted on profiles. */
export interface ChartInput {
  userId?: string;
  /** profiles.defined_gates */
  definedGates: number[];
  /** profiles.profile, e.g. "4/6" */
  profile: string | null;
  /** Current location preferred, birth location fallback. */
  latitude?: number | null;
  longitude?: number | null;
}

export interface ChannelRef {
  id: string;
  name: string;
  gates: [number, number];
  theme: string;
  centers: [CenterId, CenterId];
}

export type ElectromagneticTier = 1 | 2 | 3 | 4;
export type ProfileCompatibility = "strongest" | "partial" | "none" | "unknown";
export type OverallTier = "strong" | "high" | "moderate" | "low" | "ineligible";

export interface CompatibilityResult {
  /** 1 = 9–0, 2 = 8–1, 3 = 7–2, 4 = outside the named tiers. */
  electromagnetic_tier: ElectromagneticTier;
  /** Combined-chart center counts behind the tier: [defined, open]. */
  combined_centers: { defined: number; open: number; label: string };
  electromagnetic_channels: ChannelRef[];
  compromised_channels: ChannelRef[];
  /** Channels both people already have defined on their own. */
  shared_channels: ChannelRef[];
  profile_a: string | null;
  profile_b: string | null;
  profile_match_count: 0 | 1 | 2;
  profile_compatibility: ProfileCompatibility;
  /** Approximate miles apart, null when either location is unknown. */
  distance: number | null;
  location_compatibility: "within_radius" | "outside_radius" | "unknown";
  overall_tier: OverallTier;
  /** False when AuraChem rules exclude the pair from the preferred pool. */
  eligible: boolean;
  /** Structured, non-invented explanation lines for the UI. */
  explanation: ExplanationSection[];
  /** Internal ranking score. Weights documented in RANKING_WEIGHTS. */
  rank_score: number;
}

export interface ExplanationSection {
  key: "electromagnetic" | "compromised" | "profiles" | "location" | "overall";
  heading: string;
  detail: string;
}

/**
 * Ranking weights — documented and configurable, never hidden percentages.
 * Hierarchy: electromagnetic tier > profile-line match > distance.
 * Distance can never outweigh a stronger electromagnetic tier.
 */
export const RANKING_WEIGHTS = {
  /** Points per electromagnetic tier step (tier 1 best). */
  electromagneticTier: 1000,
  /** Points per matching profile line. */
  profileLine: 120,
  /** Points per electromagnetic channel formed. */
  electromagneticChannel: 15,
  /** Points subtracted per mile apart (capped, so location only breaks ties). */
  distancePerMile: 2,
  maxDistancePenalty: 100,
  /** Penalty for being outside the configured radius. */
  outsideRadius: 250,
  /** Penalty applied to compromised (ineligible) pairs. */
  compromised: 5000,
} as const;

/** Product default until a user sets their own preference. */
export const DEFAULT_SEARCH_RADIUS_MILES = 10;

const toRef = (ch: Channel): ChannelRef => ({
  id: ch.id,
  name: ch.name,
  gates: [ch.gates[0], ch.gates[1]],
  theme: ch.theme,
  centers: ch.centers,
});

const has = (set: Set<number>, gate: number) => set.has(gate);

/** A channel is defined for a person when both of its gates are activated. */
export const isChannelDefined = (gates: Set<number>, ch: Channel) =>
  has(gates, ch.gates[0]) && has(gates, ch.gates[1]);

/** A hanging gate: exactly one of the channel's two gates is activated. */
export const isHangingGate = (gates: Set<number>, ch: Channel) =>
  has(gates, ch.gates[0]) !== has(gates, ch.gates[1]);

export const parseProfileLines = (profile: string | null): [number, number] | null => {
  if (!profile) return null;
  const m = profile.match(/(\d)\s*\/\s*(\d)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
};

export const haversineMiles = (
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number => {
  const R = 3958.7613;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const centerLabels = (centers: CenterId[]) => centers.map((c) => CENTERS[c].label).join(" ↔ ");

const channelLabel = (ch: ChannelRef) => `${ch.gates[0]}–${ch.gates[1]} ${ch.name}`;

export interface CompatibilityOptions {
  /** Miles. Falls back to DEFAULT_SEARCH_RADIUS_MILES. */
  radiusMiles?: number | null;
  /** Pre-computed distance (e.g. from the discover RPC) to avoid exposing coordinates. */
  distanceMiles?: number | null;
}

export function calculateCompatibility(
  a: ChartInput,
  b: ChartInput,
  options: CompatibilityOptions = {},
): CompatibilityResult {
  const gatesA = new Set(a.definedGates || []);
  const gatesB = new Set(b.definedGates || []);

  const electromagnetic: ChannelRef[] = [];
  const compromised: ChannelRef[] = [];
  const shared: ChannelRef[] = [];

  for (const ch of UNIQUE_CHANNELS) {
    const definedA = isChannelDefined(gatesA, ch);
    const definedB = isChannelDefined(gatesB, ch);
    const hangingA = isHangingGate(gatesA, ch);
    const hangingB = isHangingGate(gatesB, ch);

    if (definedA && definedB) {
      shared.push(toRef(ch));
      continue;
    }
    // Compromise: one person has the full channel, the other has a hanging gate in it.
    if ((definedA && hangingB) || (definedB && hangingA)) {
      compromised.push(toRef(ch));
      continue;
    }
    // Electromagnetic: each person brings one of the two gates, completing the channel together.
    if (hangingA && hangingB && !definedA && !definedB) {
      const completed = has(gatesA, ch.gates[0]) !== has(gatesB, ch.gates[0]);
      if (completed) electromagnetic.push(toRef(ch));
    }
  }

  // Combined chart: defined vs open centers of the two charts merged.
  const combinedGates = [...new Set([...gatesA, ...gatesB])];
  const definedCenters = getDefinedCenters(combinedGates);
  const definedCount = definedCenters.size;
  const openCount = 9 - definedCount;

  const electromagnetic_tier: ElectromagneticTier =
    definedCount === 9 ? 1 : definedCount === 8 ? 2 : definedCount === 7 ? 3 : 4;

  const linesA = parseProfileLines(a.profile);
  const linesB = parseProfileLines(b.profile);
  let profile_match_count: 0 | 1 | 2 = 0;
  let profile_compatibility: ProfileCompatibility = "unknown";
  if (linesA && linesB) {
    const count = (linesA[0] === linesB[0] ? 1 : 0) + (linesA[1] === linesB[1] ? 1 : 0);
    profile_match_count = count as 0 | 1 | 2;
    profile_compatibility = count === 2 ? "strongest" : count === 1 ? "partial" : "none";
  }

  let distance: number | null =
    typeof options.distanceMiles === "number" ? options.distanceMiles : null;
  if (
    distance === null &&
    typeof a.latitude === "number" &&
    typeof a.longitude === "number" &&
    typeof b.latitude === "number" &&
    typeof b.longitude === "number"
  ) {
    distance = Math.round(haversineMiles(a.latitude, a.longitude, b.latitude, b.longitude) * 10) / 10;
  }

  const radius = options.radiusMiles ?? DEFAULT_SEARCH_RADIUS_MILES;
  const location_compatibility =
    distance === null ? "unknown" : distance <= radius ? "within_radius" : "outside_radius";

  const eligible = compromised.length === 0;

  let rank_score =
    (5 - electromagnetic_tier) * RANKING_WEIGHTS.electromagneticTier +
    profile_match_count * RANKING_WEIGHTS.profileLine +
    electromagnetic.length * RANKING_WEIGHTS.electromagneticChannel;
  if (distance !== null) {
    rank_score -= Math.min(
      RANKING_WEIGHTS.maxDistancePenalty,
      distance * RANKING_WEIGHTS.distancePerMile,
    );
  }
  if (location_compatibility === "outside_radius") rank_score -= RANKING_WEIGHTS.outsideRadius;
  if (!eligible) rank_score -= RANKING_WEIGHTS.compromised;

  const overall_tier: OverallTier = !eligible
    ? "ineligible"
    : electromagnetic_tier === 1 && profile_match_count > 0
      ? "strong"
      : electromagnetic_tier <= 2
        ? "high"
        : electromagnetic_tier === 3
          ? "moderate"
          : "low";

  const explanation: ExplanationSection[] = [
    {
      key: "electromagnetic",
      heading: electromagnetic.length
        ? `${TIER_LABELS[electromagnetic_tier]} electromagnetic`
        : "Electromagnetic",
      detail: electromagnetic.length
        ? `You complete ${electromagnetic.length === 1 ? "a channel" : `${electromagnetic.length} channels`} together: ${electromagnetic
            .slice(0, 3)
            .map(channelLabel)
            .join(", ")}. Together your charts light up ${definedCount} of 9 centers.`
        : `Together your charts light up ${definedCount} of 9 centers, with no new channels formed between you.`,
    },
    {
      key: "profiles",
      heading:
        profile_compatibility === "strongest"
          ? "Profiles fully aligned"
          : profile_compatibility === "partial"
            ? "1 line match"
            : profile_compatibility === "none"
              ? "No line match"
              : "Profiles unavailable",
      detail:
        linesA && linesB
          ? profile_match_count > 0
            ? `${a.profile} and ${b.profile} share line ${linesA[0] === linesB[0] ? linesA[0] : linesA[1]}${profile_match_count === 2 ? ` and line ${linesA[1]}` : ""}.`
            : `${a.profile} and ${b.profile} share no lines — different ways of moving through life.`
          : "One of you hasn't completed a chart yet.",
    },
    {
      key: "location",
      heading:
        distance === null
          ? "Distance unknown"
          : `${distance} ${distance === 1 ? "mile" : "miles"} apart`,
      detail:
        distance === null
          ? "Add your current location to see how close you are."
          : location_compatibility === "within_radius"
            ? "You're geographically close."
            : `Outside your ${radius}-mile preference.`,
    },
    {
      key: "overall",
      heading: OVERALL_LABELS[overall_tier],
      detail: eligible
        ? "Based on your electromagnetic connection, profile lines and distance."
        : "A compromised channel means one of you has a full channel where the other has only a hanging gate.",
    },
  ];

  if (compromised.length) {
    explanation.splice(1, 0, {
      key: "compromised",
      heading: `${compromised.length} compromised channel${compromised.length === 1 ? "" : "s"}`,
      detail: `${compromised.slice(0, 3).map(channelLabel).join(", ")} — ${centerLabels(
        compromised[0].centers,
      )}.`,
    });
  }

  return {
    electromagnetic_tier,
    combined_centers: {
      defined: definedCount,
      open: openCount,
      label: `${definedCount}–${openCount}`,
    },
    electromagnetic_channels: electromagnetic,
    compromised_channels: compromised,
    shared_channels: shared,
    profile_a: a.profile,
    profile_b: b.profile,
    profile_match_count,
    profile_compatibility,
    distance,
    location_compatibility,
    overall_tier,
    eligible,
    explanation,
    rank_score,
  };
}

export const TIER_LABELS: Record<ElectromagneticTier, string> = {
  1: "9–0",
  2: "8–1",
  3: "7–2",
  4: "Emerging",
};

export const OVERALL_LABELS: Record<OverallTier, string> = {
  strong: "Strong Chemistry",
  high: "High Chemistry",
  moderate: "Growing Chemistry",
  low: "Quiet Chemistry",
  ineligible: "Compromised Connection",
};

/** Ranks candidates by the documented hierarchy. Eligible candidates always first. */
export function rankByCompatibility<T>(
  items: Array<T & { compatibility: CompatibilityResult }>,
): Array<T & { compatibility: CompatibilityResult }> {
  return [...items].sort((x, y) => {
    if (x.compatibility.eligible !== y.compatibility.eligible)
      return x.compatibility.eligible ? -1 : 1;
    return y.compatibility.rank_score - x.compatibility.rank_score;
  });
}
