import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useUserState } from "@/hooks/useUserState";

type Gate = "app" | "onboarding" | "profile-setup" | "reveal";

const Loading = () => (
  <div className="min-h-screen gradient-celestial flex items-center justify-center">
    <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
  </div>
);

/**
 * Centralized routing guard. Pages never implement their own redirect rules.
 * - "app"           → requires auth + onboarding + profile setup
 * - "onboarding"    → requires auth; completed users are moved forward
 * - "profile-setup" → requires auth + completed Human Design onboarding
 */
export const RequireStage = ({ gate, children }: { gate: Gate; children: ReactNode }) => {
  const { stage } = useUserState();
  const location = useLocation();

  if (stage === "loading") return <Loading />;

  if (stage === "unauthenticated") {
    const next = location.pathname + location.search;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }

  if (gate === "reveal") {
    // Requires a calculated chart; fully onboarded users are never forced back here.
    if (stage === "needs_onboarding") return <Navigate to="/onboarding" replace />;
    if (stage === "ready") return <Navigate to="/profile" replace />;
    return <>{children}</>;
  }

  if (gate === "onboarding") {
    if (stage === "needs_profile") return <Navigate to="/design-reveal" replace />;
    if (stage === "ready") return <Navigate to="/profile" replace />;
    return <>{children}</>;
  }

  if (gate === "profile-setup") {
    if (stage === "needs_onboarding") return <Navigate to="/onboarding" replace />;
    return <>{children}</>;
  }

  // gate === "app"
  if (stage === "needs_onboarding") return <Navigate to="/onboarding" replace />;
  if (stage === "needs_profile") return <Navigate to="/profile-setup" replace />;
  return <>{children}</>;
};
