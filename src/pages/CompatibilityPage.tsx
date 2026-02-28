import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Users, Crown, AlertTriangle, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  computeCompatibility,
  CompatibilityResult,
  GateConnection,
  CONNECTION_TYPE_META,
  ConnectionType,
} from "@/lib/compatibility";

// Demo gates for the "other" person (will be replaced with real match data)
const DEMO_OTHER_GATES = [1, 8, 13, 33, 7, 31, 57, 20, 48, 16, 6, 59, 54, 32, 41, 30];
const DEMO_OTHER_NAME = "Luna";

const CONNECTION_ICONS: Record<ConnectionType, React.ReactNode> = {
  electromagnetic: <Zap className="w-4 h-4" />,
  companionship: <Users className="w-4 h-4" />,
  dominance: <Crown className="w-4 h-4" />,
  compromise: <AlertTriangle className="w-4 h-4" />,
  zero_compromise: <Sparkles className="w-4 h-4" />,
};

const CompatibilityPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ConnectionType | "all">("all");

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (!data) {
        navigate("/onboarding");
        return;
      }
      setProfile(data);

      // User's gates — from variables or demo
      const vars = (data.variables as any) || {};
      const userGates: number[] = vars.defined_gates || [
        64, 47, 24, 61, 17, 62, 10, 20, 34, 57, 27, 50, 3, 60, 42, 53,
      ];

      const compat = computeCompatibility(userGates, DEMO_OTHER_GATES);
      setResult(compat);
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading || !result) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  const filteredConnections =
    activeFilter === "all"
      ? result.connections
      : result.connections.filter((c) => c.type === activeFilter);

  const filters: { key: ConnectionType | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: result.connections.length },
    { key: "electromagnetic", label: "⚡ Electromagnetic", count: result.electromagneticCount },
    { key: "companionship", label: "🤝 Companion", count: result.companionshipCount },
    { key: "dominance", label: "👑 Dominance", count: result.dominanceCount },
    { key: "compromise", label: "⚠️ Compromise", count: result.compromiseCount },
  ];

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
            <h1 className="font-display text-xl font-bold text-foreground">Compatibility</h1>
            <p className="text-xs text-muted-foreground">Gate-to-Gate Synastry</p>
          </div>
        </div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6 text-center shadow-aura"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full gradient-aura flex items-center justify-center">
              <span className="font-display text-xl font-bold text-primary-foreground">
                {profile?.display_name?.[0] || "Y"}
              </span>
            </div>
            <Heart className="w-6 h-6 text-rose-400 animate-pulse" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
              <span className="font-display text-xl font-bold text-primary-foreground">
                {DEMO_OTHER_NAME[0]}
              </span>
            </div>
          </div>

          <h2 className="font-display text-lg font-semibold text-foreground mb-1">
            {profile?.display_name || "You"} & {DEMO_OTHER_NAME}
          </h2>

          {/* Chemistry Score */}
          <div className="relative w-28 h-28 mx-auto my-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${result.chemistryScore * 2.64} 264`}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold text-foreground">
                {result.chemistryScore}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Chemistry</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-3.5 h-3.5" />
            {result.dominantTheme}
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{result.summary}</p>

          {/* Newly defined centers */}
          {result.newlyDefinedCenters.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">✨ Centers Activated Together</p>
              <p className="text-xs text-muted-foreground">
                {result.newlyDefinedCenters.join(", ")} — defined only when you're together.
              </p>
            </div>
          )}
        </motion.div>

        {/* Connection Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/60 text-muted-foreground border border-border/50 hover:bg-card"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Connections List */}
        <div>
          {filteredConnections.map((conn, i) => (
            <ConnectionCard key={`${conn.type}-${conn.gate1}-${conn.gate2}`} conn={conn} index={i} />
          ))}
        </div>

        {filteredConnections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No {activeFilter} connections found.
          </div>
        )}

        {/* HD-only notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-2xl bg-card/50 border border-border/30 text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Pure Neutrino Stream Logic.</span>{" "}
            This analysis uses only Gate-to-Gate composites from the Human Design system.
            Traditional astrological house overlaps are suppressed — they don't exist in the neutrino
            mechanics and would compromise your Design reading.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

function ConnectionCard({ conn, index }: { conn: GateConnection; index: number }) {
  const meta = CONNECTION_TYPE_META[conn.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: index * 0.05 }}
      className="mb-3 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${meta.color}`}>{CONNECTION_ICONS[conn.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-sm font-semibold text-foreground">
              {conn.channelName}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-card border border-border/50 ${meta.color} font-medium`}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Gates {conn.gate1}–{conn.gate2} · {conn.centers[0]} ↔ {conn.centers[1]}
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{conn.chemistry}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default CompatibilityPage;
