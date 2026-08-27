import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChemistryBadges } from "@/components/ChemistrySummary";
import {
  calculateCompatibility,
  DEFAULT_SEARCH_RADIUS_MILES,
  type CompatibilityResult,
} from "@/lib/compatibility";

interface MatchProfile {
  id: string;
  matchId: string;
  displayName: string;
  energyType: string;
  profile: string;
  authority: string;
  chemistryScore: number;
  dominantTheme: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  status: string;
  compatibility: CompatibilityResult | null;
}


// Demo matches (will be replaced with real DB queries when users exist)
const DEMO_MATCHES: MatchProfile[] = [
  {
    id: "demo-1",
    matchId: "demo-match-1",
    displayName: "Luna",
    energyType: "Projector",
    profile: "4/6",
    authority: "Splenic",
    chemistryScore: 82,
    dominantTheme: "You finish each other's sentences before they're even spoken",
    avatarUrl: null,
    lastMessage: null,
    status: "pending",
  },
  {
    id: "demo-2",
    matchId: "demo-match-2",
    displayName: "Orion",
    energyType: "Generator",
    profile: "1/3",
    authority: "Sacral",
    chemistryScore: 71,
    dominantTheme: "Easy, deep conversations, the kind that sticks",
    avatarUrl: null,
    lastMessage: null,
    status: "pending",
  },
  {
    id: "demo-3",
    matchId: "demo-match-3",
    displayName: "Celeste",
    energyType: "Manifesting Generator",
    profile: "3/5",
    authority: "Emotional",
    chemistryScore: 65,
    dominantTheme: "They'll shift how you see yourself in the best way",
    avatarUrl: null,
    lastMessage: null,
    status: "pending",
  },
  {
    id: "demo-4",
    matchId: "demo-match-4",
    displayName: "Atlas",
    energyType: "Manifestor",
    profile: "5/1",
    authority: "Ego Manifested",
    chemistryScore: 58,
    dominantTheme: "Magnetic — sparks fly fast with this one",
    avatarUrl: null,
    lastMessage: null,
    status: "pending",
  },
];

const MatchesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchProfile[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Try to load real matches, fall back to demo
      const { data: realMatches } = await supabase
        .from("matches")
        .select("*")
        .or(`user_a.eq.${session.user.id},user_b.eq.${session.user.id}`);

      if (realMatches && realMatches.length > 0) {
        // Load partner profiles for real matches
        const partnerIds = realMatches.map((m) => (m.user_a === session.user.id ? m.user_b : m.user_a));
        const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", partnerIds);

        const mapped: MatchProfile[] = realMatches.map((m) => {
          const partnerId = m.user_a === session.user.id ? m.user_b : m.user_a;
          const p = profiles?.find((pr) => pr.user_id === partnerId);
          return {
            id: partnerId,
            matchId: m.id,
            displayName: p?.display_name || "Unknown",
            energyType: p?.energy_type || "Generator",
            profile: p?.profile || "—",
            authority: p?.authority || "Sacral",
            chemistryScore: m.chemistry_score || 0,
            dominantTheme: m.dominant_theme || "Neutral",
            avatarUrl: p?.avatar_url || null,
            lastMessage: null,
            status: m.status,
          };
        });
        setMatches(mapped);
      } else {
        setMatches(DEMO_MATCHES);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">High Chemistry</h1>
            <p className="text-xs text-muted-foreground">1:1 connections — collaborators, friends, neighbors </p>
          </div>
          <Link to="/discover" className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Discover
            </Button>
          </Link>
        </div>

        {/* Match Cards */}
        <div className="space-y-4">
          {matches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/chat/${match.matchId}`}>
                <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-aura transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full gradient-aura flex items-center justify-center">
                        {match.avatarUrl ? (
                          <img src={match.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-display text-lg font-bold text-primary-foreground">
                            {match.displayName[0]}
                          </span>
                        )}
                      </div>
                      {/* Chemistry mini badge */}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border-2 border-border flex items-center justify-center">
                        <span className="text-[10px] font-bold text-foreground">{match.chemistryScore}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-0.5">{match.displayName}</h3>
                      {/* Primary headline: Type + Profile */}
                      <p className="text-sm font-medium text-primary">
                        {match.profile} {match.authority} {match.energyType}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">{match.dominantTheme}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 mt-1">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No matches yet. Your aura is calibrating.</p>
          </div>
        )}

        {/* Info footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-2xl bg-card/50 border border-border/30 text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground"></span> Smarter matches start with your feedback.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MatchesPage;
