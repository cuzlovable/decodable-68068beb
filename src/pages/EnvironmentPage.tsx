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
import { NodalEnvironments } from "@/components/NodalEnvironments";
import { gateSignIndex, gateLongitude } from "@/lib/nodes";



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

  // Node gates come from the DESIGN (red) side of the bodygraph.
  const designNodes = useMemo(() => {
    const design = (profile?.chart_raw as any)?.gate_and_line?.design;
    const pick = (aliases: string[]): [number, number] | null => {
      if (!design) return null;
      for (const [planet, gl] of Object.entries(design as Record<string, any>)) {
        const key = planet.toLowerCase().replace(/[\s._-]/g, "");
        if (aliases.includes(key) && Array.isArray(gl) && typeof gl[0] === "number") {
          return [gl[0] as number, (gl[1] as number) ?? 1];
        }
      }
      return null;
    };
    const s = pick(["southnode", "snode", "s", "ketu", "descendingnode"]);
    const n = pick(["northnode", "nnode", "n", "rahu", "ascendingnode"]);
    return {
      south: s?.[0] ?? profile?.south_node_gate ?? null,
      north: n?.[0] ?? profile?.north_node_gate ?? null,
      northLine: n?.[1] ?? null,
    };
  }, [profile]);

  // Ecliptic longitude of the North Node, used for house placement.
  const northNodeLongitude = useMemo(
    () => (designNodes.north ? gateLongitude(designNodes.north, designNodes.northLine) : null),
    [designNodes]
  );


  // Whole-sign houses need the Ascendant; use it when the chart provides one.
  const ascSignIndex = useMemo(() => {
    const raw = profile?.chart_raw as any;
    const src = raw?.gate_and_line?.personality ?? {};
    for (const [planet, gl] of Object.entries(src as Record<string, any>)) {
      const key = planet.toLowerCase().replace(/[\s._-]/g, "");
      if ((key === "ascendant" || key === "asc" || key === "rising") && Array.isArray(gl)) {
        return gateSignIndex(gl[0]);
      }
    }
    return null;
  }, [profile]);


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

        {/* Nodal environments + nearby spots */}
        <NodalEnvironments
          southGate={designNodes.south}
          northGate={designNodes.north}
          birthDate={profile?.birth_date}
          birthTime={profile?.birth_time}
          latitude={profile?.birth_latitude}
          longitude={profile?.birth_longitude}
          northNodeLongitude={northNodeLongitude}
          location={userLocation}
          locationLabel={locationLabel}
          ascSignIndex={ascSignIndex}
          envVariable={
            ((profile?.variables as any)?.environment ??
              (profile?.variables as any)?.design_environment) ?? null
          }
        />



      </div>
    </div>

  );
};

export default EnvironmentPage;
