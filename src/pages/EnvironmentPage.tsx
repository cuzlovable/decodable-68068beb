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

// Concise PHS explainers — only the essentials.
const ENVIRONMENT_EXPLAINER =
  "The kind of physical space where your body and decisions work best.";

const DIGESTION_EXPLAINER =
  "How your body best takes in food, information, and stimulus.";


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
  const [locationLabel, setLocationLabel] = useState<string>("");
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
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationLabel("Your current location");
          },
          () => {
            if (data?.birth_latitude && data?.birth_longitude) {
              setUserLocation({ lat: data.birth_latitude, lng: data.birth_longitude });
              setLocationLabel(data.birth_location || "Birth location");
            } else {
              setUserLocation({ lat: 40.7128, lng: -74.006 });
              setLocationLabel("New York, NY (default)");
              setLocationError("Enable location or search below for accurate results.");
            }
          }
        );
      } else {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
        setLocationLabel("New York, NY (default)");
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
              <p className="text-[11px] text-muted-foreground mt-1">
                Color {decoded.environment.color} · Tone {decoded.environment.tone}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed mt-3 mb-4">
                {ENVIRONMENT_EXPLAINER}
              </p>

              {decoded.digestion && (
                <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Determination · {decoded.digestion.full}
                    <span className="ml-1 opacity-70">
                      (C{decoded.digestion.color}·T{decoded.digestion.tone})
                    </span>
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {DIGESTION_EXPLAINER}
                  </p>
                </div>
              )}

              {/* Location override — accurate, accessible search */}
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Search near
                </p>
                <LocationAutocomplete
                  value={locationLabel}
                  onChange={(name, lat, lon) => {
                    setUserLocation({ lat, lng: lon });
                    setLocationLabel(name);
                    setLocationError(null);
                  }}
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
                  className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 overflow-hidden"
                >
                  <img
                    src={imageFor(s)}
                    alt={s.name}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-5 flex items-start gap-3">
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

export default EnvironmentPage;
