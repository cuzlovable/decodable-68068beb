import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signPhotoPath } from "@/lib/photos";
import { MatchModal } from "@/components/MatchModal";
import { ChemistryBadges } from "@/components/ChemistrySummary";
import {
  calculateCompatibility,
  rankByCompatibility,
  DEFAULT_SEARCH_RADIUS_MILES,
  type ChartInput,
  type CompatibilityResult,
} from "@/lib/compatibility";
import { toast } from "sonner";

interface Candidate {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  photos: string[];
  vibe_traits: string[];
  energy_type: string | null;
  authority: string | null;
  profile: string | null;
  defined_gates: number[] | null;
  distance_miles: number | null;
  photoUrl?: string | null;
  compatibility: CompatibilityResult;
}

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [match, setMatch] = useState<{
    name: string;
    matchId: string | null;
    compatibility: CompatibilityResult;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?next=/discover");
        return;
      }

      // Own persisted Human Design data — never recalculated here.
      const { data: me } = await supabase
        .from("profiles")
        .select("defined_gates, profile, search_radius_miles")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const self: ChartInput = {
        userId: session.user.id,
        definedGates: me?.defined_gates || [],
        profile: me?.profile ?? null,
      };
      const radiusMiles = me?.search_radius_miles ?? DEFAULT_SEARCH_RADIUS_MILES;

      const { data, error } = await supabase.rpc("discover_profiles", { limit_count: 30 });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const rows = (data || []) as Omit<Candidate, "compatibility" | "photoUrl">[];
      const withPhotos = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          photoUrl: await signPhotoPath(row.photos?.[0]),
          // ONE canonical compatibility calculation, done once per candidate.
          compatibility: calculateCompatibility(
            self,
            {
              userId: row.user_id,
              definedGates: row.defined_gates || [],
              profile: row.profile,
            },
            { radiusMiles, distanceMiles: row.distance_miles },
          ),
        })),
      );
      setCandidates(rankByCompatibility(withPhotos));
      setLoading(false);
    };
    load();
  }, [navigate]);

  const current = candidates[0];


  const handleAction = async (action: "like" | "pass") => {
    if (!current || acting) return;
    setActing(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("likes").insert({
      user_id: session.user.id,
      target_user_id: current.user_id,
      action,
    });

    if (error) {
      toast.error(error.message);
      setActing(false);
      return;
    }

    if (action === "like") {
      // The database creates a match record when the like is mutual.
      const { data: matchRow } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user_a.eq.${session.user.id},user_b.eq.${current.user_id}),and(user_a.eq.${current.user_id},user_b.eq.${session.user.id})`,
        )
        .maybeSingle();

      if (matchRow) {
        // Reuse the compatibility already calculated for this candidate.
        const compatibility = current.compatibility;
        await supabase
          .from("matches")
          .update({
            chemistry_score: Math.max(0, Math.min(100, compatibility.combined_centers.defined * 10)),
            dominant_theme:
              compatibility.electromagnetic_channels[0]?.theme ||
              compatibility.explanation.find((e) => e.key === "overall")?.heading ||
              null,
          })
          .eq("id", matchRow.id);

        setMatch({
          name: current.display_name || "your match",
          matchId: matchRow.id,
          compatibility,
        });
      }
    }


    setCandidates((prev) => prev.slice(1));
    setActing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-xl font-bold text-foreground">Discover</h1>
          <div className="flex gap-1">
            <Link to="/matches">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/profile-setup">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current.user_id}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="rounded-3xl overflow-hidden bg-card/80 backdrop-blur-sm border border-border/50"
            >
              <div className="aspect-[4/5] bg-muted flex items-center justify-center">
                {current.photoUrl ? (
                  <img
                    src={current.photoUrl}
                    alt={`${current.display_name || "Member"}'s photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="p-5">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {current.display_name || "Someone new"}
                </h2>
                {(current.profile || current.energy_type) && (
                  <p className="text-sm font-medium text-primary mt-0.5">
                    {[current.profile, current.authority, current.energy_type].filter(Boolean).join(" · ")}
                  </p>
                )}
                {current.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">{current.bio}</p>
                )}
                {current.vibe_traits?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {current.vibe_traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-primary/10 text-primary"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                You've seen everyone for now. New auras arrive daily.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {current && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <Button
              onClick={() => handleAction("pass")}
              disabled={acting}
              variant="outline"
              size="icon"
              aria-label="Pass"
              className="w-16 h-16 rounded-full border-border bg-card"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => handleAction("like")}
              disabled={acting}
              size="icon"
              aria-label="Like"
              className="w-16 h-16 rounded-full gradient-aura text-primary-foreground"
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>

      <MatchModal
        open={!!match}
        name={match?.name || ""}
        matchId={match?.matchId || null}
        onClose={() => setMatch(null)}
      />
    </div>
  );
};

export default DiscoverPage;
