import { Zap, MapPin, Diamond, AlertTriangle } from "lucide-react";
import {
  OVERALL_LABELS,
  TIER_LABELS,
  type CompatibilityResult,
} from "@/lib/compatibility";

const toneFor = (tier: CompatibilityResult["overall_tier"]) =>
  tier === "ineligible"
    ? "bg-muted text-muted-foreground"
    : tier === "strong" || tier === "high"
      ? "gradient-aura text-primary-foreground"
      : "bg-primary/10 text-primary";

/** Compact badge row for the Discover / Matches cards. */
export const ChemistryBadges = ({
  compatibility,
  showHeadline = true,
}: {
  compatibility: CompatibilityResult;
  showHeadline?: boolean;
}) => (
  <div className="space-y-2">
    {showHeadline && (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${toneFor(
          compatibility.overall_tier,
        )}`}
      >
        {compatibility.overall_tier === "ineligible" && <AlertTriangle className="w-3 h-3" />}
        {OVERALL_LABELS[compatibility.overall_tier]}
      </span>
    )}
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Zap className="w-3 h-3 text-primary" />
        {compatibility.electromagnetic_tier === 4
          ? "Emerging electromagnetic"
          : `${TIER_LABELS[compatibility.electromagnetic_tier]} Electromagnetic`}
      </span>
      <span className="inline-flex items-center gap-1">
        <Diamond className="w-3 h-3 text-primary" />
        {compatibility.profile_compatibility === "unknown"
          ? "Profile pending"
          : `Profile match: ${compatibility.profile_match_count} line${
              compatibility.profile_match_count === 1 ? "" : "s"
            }`}
      </span>
      {compatibility.distance !== null && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3 text-primary" />
          {compatibility.distance} mi away
        </span>
      )}
    </div>
  </div>
);

/** Full "Your Chemistry" explanation, built only from structured data. */
export const ChemistryExplanation = ({
  compatibility,
}: {
  compatibility: CompatibilityResult;
}) => (
  <div className="space-y-3">
    <h3 className="font-display text-base font-semibold text-foreground">Your Chemistry</h3>
    {compatibility.explanation.map((section) => (
      <div key={section.key} className="rounded-xl bg-muted/40 px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{section.heading}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{section.detail}</p>
      </div>
    ))}
  </div>
);

export default ChemistryBadges;
