import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, MapPin, Utensils, Trees, Heart, Users,
  Palette, Briefcase, Star, AlertTriangle, Loader2, RefreshCw, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { decodeAll, type PhsVariables } from "@/lib/phs";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";

// Plain-language descriptions per Environment color (the broad terrain you thrive in).
const ENV_DESCRIPTIONS: Record<string, string> = {
  Caves: "You thrive in enclosed, contained spaces with clear edges — rooms, nooks, dens.",
  Markets: "You thrive amid lively exchange — bustling streets, gathering spots, marketplaces.",
  Kitchens: "You thrive where things are being made — workshops, studios, kitchens, makerspaces.",
  Mountains: "You thrive at elevation with sweeping perspective — hills, rooftops, high vistas.",
  Valleys: "You thrive nestled between natural boundaries — valleys, basins, sheltered terrain.",
  Shores: "You thrive at the edge of two worlds — coastlines, riverbanks, transition zones.",
};

// Plain-language descriptions per Digestion / "super-cognition" color (how you best take in life).
const DIG_DESCRIPTIONS: Record<string, string> = {
  Consecutive: "You digest best with one food/idea at a time, fully, in sequence.",
  Alternating: "You digest best with variety — alternating tastes and inputs keeps you sharp.",
  "Open Taste": "You digest best in a relaxed, social setting where flavors stay light.",
  "Closed Taste": "You digest best in quiet focus — no distractions while you take it in.",
  Hot: "You digest best with warm food, warm rooms, warm company.",
  Cold: "You digest best with cool food, cool rooms, calm surroundings.",
};


const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  food: <Utensils className="w-4 h-4" />,
  nature: <Trees className="w-4 h-4" />,
  wellness: <Heart className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
  creative: <Palette className="w-4 h-4" />,
  work: <Briefcase className="w-4 h-4" />,
  spiritual: <Star className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  nature: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  wellness: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  social: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  creative: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  work: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  spiritual: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

type Suggestion = {
  name: string;
  category: string;
  reason: string;
  tip: string;
  nodalAlignment?: string;
  imageQuery?: string;
};

type AIResult = {
  chironReturn: boolean;
  chironMessage: string;
  suggestions: Suggestion[];
};

function imageFor(s: Suggestion) {
  const q = encodeURIComponent(s.imageQuery || `${s.name} ${s.category}`);
  return `https://loremflickr.com/320/200/${q}`;
}


const EnvironmentPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (data && !data.onboarding_completed) { navigate("/onboarding"); return; }
      setProfile(data);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {
            if (data?.birth_latitude && data?.birth_longitude) {
              setUserLocation({ lat: data.birth_latitude, lng: data.birth_longitude });
            } else {
              setUserLocation({ lat: 40.7128, lng: -74.006 });
              setLocationError("Using default location. Enable GPS for better results.");
            }
          }
        );
      } else {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  const decoded = useMemo(
    () => decodeAll((profile?.variables ?? null) as PhsVariables | null),
    [profile?.variables]
  );

  const fetchSuggestions = useCallback(async () => {
    if (!decoded.environment || !userLocation) return;

    setAiLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("environment-suggestions", {
        body: {
          // Send the precise color+tone label so the AI grounds in
          // e.g. "Narrow Valley" instead of generic "Valleys".
          environment: decoded.environment.full,
          environmentColor: decoded.environment.colorLabel,
          environmentTone: decoded.environment.toneLabel,
          digestion: decoded.digestion?.full,
          perspective: decoded.perspective?.full,
          motivation: decoded.motivation?.full,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          birthDate: profile?.birth_date,
          southNodeGate: profile?.south_node_gate,
          northNodeGate: profile?.north_node_gate,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      console.error("Environment AI error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to get suggestions. Try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }, [decoded, userLocation, profile]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-4 py-6 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full gradient-aura flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-semibold text-foreground">My Environment</span>
          </div>
          <div className="w-16" />
        </div>

        {locationError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {locationError}
          </div>
        )}

        {/* Auto-detected environment card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6 shadow-aura"
        >
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-primary font-medium">
              Your Design Environment
            </span>
          </div>

          {decoded.environment ? (
            <>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {decoded.environment.full}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Color {decoded.environment.color} · Tone {decoded.environment.tone} ·{" "}
                {decoded.environment.colorLabel}
              </p>

              {/* Secondary variables */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {decoded.digestion && (
                  <VarChip label="Digestion" value={decoded.digestion.full} sub={`${decoded.digestion.color}.${decoded.digestion.tone}`} />
                )}
                {decoded.perspective && (
                  <VarChip label="Perspective" value={decoded.perspective.full} sub={`${decoded.perspective.color}.${decoded.perspective.tone}`} />
                )}
                {decoded.motivation && (
                  <VarChip label="Motivation" value={decoded.motivation.full} sub={`${decoded.motivation.color}.${decoded.motivation.tone}`} />
                )}
                <VarChip
                  label="Environment"
                  value={decoded.environment.full}
                  sub={`${decoded.environment.color}.${decoded.environment.tone}`}
                  accent
                />
              </div>

              <Button
                onClick={fetchSuggestions}
                disabled={!userLocation || aiLoading}
                className="w-full gradient-aura text-primary-foreground hover:opacity-90"
              >
                {aiLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finding {decoded.environment.full} spots…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Find my {decoded.environment.full} spots</>
                )}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your environment variable hasn't been calculated yet. Finish onboarding so we can decode your color and tone.
            </p>
          )}
        </motion.div>

        {/* Chiron Return Banner */}
        <AnimatePresence>
          {result?.chironReturn && result.chironMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-300/30 p-5 mb-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Star className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground mb-1">
                    ✦ Chiron Return Active
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.chironMessage}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result?.suggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Your {decoded.environment?.full ?? ""} spots
                </h3>
                <Button variant="ghost" size="sm" onClick={fetchSuggestions} disabled={aiLoading}>
                  <RefreshCw className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {result.suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_COLORS[s.category] || "bg-muted text-muted-foreground"}`}>
                      {CATEGORY_ICONS[s.category] || <MapPin className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display text-sm font-semibold text-foreground">{s.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[s.category] || "bg-muted text-muted-foreground"}`}>
                          {s.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{s.reason}</p>
                      <div className="text-[11px] text-foreground/70 bg-muted/50 rounded-lg px-3 py-2">
                        💡 {s.tip}
                      </div>
                      {s.nodalAlignment && (
                        <div className="mt-2 text-[11px] text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2">
                          ✦ {s.nodalAlignment}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !aiLoading && decoded.environment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Tap "Find my {decoded.environment.full} spots" to surface<br />
              where your aura naturally thrives nearby.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

function VarChip({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl px-3 py-2 border ${
        accent ? "border-primary/40 bg-primary/5" : "border-border/40 bg-muted/30"
      }`}
    >
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub}</p>
    </div>
  );
}

export default EnvironmentPage;
