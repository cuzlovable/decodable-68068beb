import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for where a user is in the AuraChem journey.
 *
 * Canonical database fields (no new columns):
 * - profiles.onboarding_completed → Human Design onboarding done
 * - profiles.display_name         → public profile setup done
 */
export type UserStage =
  | "loading"
  | "unauthenticated"
  | "needs_onboarding"
  | "needs_profile"
  | "ready";

interface UserState {
  stage: UserStage;
  userId: string | null;
  displayName: string | null;
  onboardingCompleted: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const UserStateContext = createContext<UserState | null>(null);

export const UserStateProvider = ({ children }: { children: ReactNode }) => {
  const [stage, setStage] = useState<UserStage>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUserId(null);
      setDisplayName(null);
      setOnboardingCompleted(false);
      setError(null);
      setStage("unauthenticated");
      return;
    }

    setUserId(session.user.id);

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, onboarding_completed")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileError) {
      // Fail soft: keep the user authenticated, surface the error, do not guess a stage.
      setError(profileError.message);
      setStage("needs_onboarding");
      return;
    }

    setError(null);
    const completed = Boolean(data?.onboarding_completed);
    const name = data?.display_name?.trim() || null;

    // Seed display_name from OAuth metadata once, if the profile has none yet.
    if (data && !name) {
      const meta = session.user.user_metadata as Record<string, unknown> | null;
      const metaName =
        (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        "";
      if (metaName) {
        await supabase.from("profiles").update({ display_name: metaName }).eq("user_id", session.user.id);
      }
    }

    setDisplayName(name);
    setOnboardingCompleted(completed);
    setStage(completed ? (name ? "ready" : "needs_profile") : "needs_onboarding");
  }, []);

  useEffect(() => {
    let active = true;

    const run = () => {
      if (!active) return;
      resolve();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!active) return;
      // Defer so we never call Supabase inside the auth callback.
      setTimeout(run, 0);
    });

    run();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [resolve]);

  const value = useMemo<UserState>(
    () => ({ stage, userId, displayName, onboardingCompleted, error, refresh: resolve }),
    [stage, userId, displayName, onboardingCompleted, error, resolve],
  );

  return <UserStateContext.Provider value={value}>{children}</UserStateContext.Provider>;
};

export const useUserState = () => {
  const ctx = useContext(UserStateContext);
  if (!ctx) throw new Error("useUserState must be used inside UserStateProvider");
  return ctx;
};

/** Where an authenticated user belongs, given their stage. */
export const stageHome = (stage: UserStage) => {
  switch (stage) {
    case "needs_onboarding":
      return "/onboarding";
    case "needs_profile":
      return "/design-reveal";
    case "ready":
      return "/profile";
    default:
      return "/auth";
  }
};
