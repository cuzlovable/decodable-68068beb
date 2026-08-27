import { describe, expect, it } from "vitest";
import { calculateCompatibility, parseProfileLines } from "./compatibility";

describe("compatibility engine", () => {
  it("detects an electromagnetic channel when each side brings one gate", () => {
    // Channel 64-47 (Abstraction)
    const result = calculateCompatibility(
      { definedGates: [64], profile: "1/3" },
      { definedGates: [47], profile: "1/3" },
    );
    expect(result.electromagnetic_channels.map((c) => c.id)).toContain("64-47");
    expect(result.compromised_channels).toHaveLength(0);
    expect(result.eligible).toBe(true);
  });

  it("flags a compromised channel when one side has the full channel and the other a hanging gate", () => {
    const result = calculateCompatibility(
      { definedGates: [64, 47], profile: "1/3" },
      { definedGates: [64], profile: "4/6" },
    );
    expect(result.compromised_channels.map((c) => c.id)).toContain("64-47");
    expect(result.eligible).toBe(false);
    expect(result.overall_tier).toBe("ineligible");
  });

  it("scores profile line matches", () => {
    expect(
      calculateCompatibility({ definedGates: [], profile: "1/3" }, { definedGates: [], profile: "1/3" })
        .profile_compatibility,
    ).toBe("strongest");
    expect(
      calculateCompatibility({ definedGates: [], profile: "1/3" }, { definedGates: [], profile: "1/5" })
        .profile_match_count,
    ).toBe(1);
    expect(
      calculateCompatibility({ definedGates: [], profile: "1/3" }, { definedGates: [], profile: "4/6" })
        .profile_compatibility,
    ).toBe("none");
  });

  it("reports combined-chart center counts as the electromagnetic tier", () => {
    const result = calculateCompatibility(
      { definedGates: [64, 47], profile: "1/3" },
      { definedGates: [64, 47], profile: "1/3" },
    );
    expect(result.combined_centers.defined + result.combined_centers.open).toBe(9);
    expect([1, 2, 3, 4]).toContain(result.electromagnetic_tier);
  });

  it("uses radius for location compatibility", () => {
    const near = calculateCompatibility(
      { definedGates: [], profile: null },
      { definedGates: [], profile: null },
      { distanceMiles: 4.2, radiusMiles: 10 },
    );
    expect(near.location_compatibility).toBe("within_radius");
    const far = calculateCompatibility(
      { definedGates: [], profile: null },
      { definedGates: [], profile: null },
      { distanceMiles: 42, radiusMiles: 10 },
    );
    expect(far.location_compatibility).toBe("outside_radius");
  });

  it("parses profile lines", () => {
    expect(parseProfileLines("4/6")).toEqual([4, 6]);
    expect(parseProfileLines(null)).toBeNull();
  });
});
