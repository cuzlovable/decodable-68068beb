import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Compass, Home, Users, Theater, MapPin, Loader2,
  ExternalLink, Navigation, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { nodalProfile, ageFrom, type NodalProfile } from "@/lib/nodes";

type Place = {
  id: string;
  name: string;
  type: string;
  address: string;
  rating: number | null;
  tag: string;
  distance: number | null;
  alignment: string;
  mapsUrl: string;
  directionsUrl: string;
};

const NodeCard = ({
  data,
  badge,
  window: windowLabel,
  active,
}: {
  data: NodalProfile;
  badge: string;
  window: string;
  active: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-3xl bg-card/80 backdrop-blur-sm border p-5 shadow-aura ${
      active ? "border-primary/50" : "border-border/50"
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full gradient-aura text-primary-foreground font-medium">
        {badge}
      </span>
      <span className="text-[10px] text-muted-foreground">{windowLabel}</span>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="rounded-2xl bg-muted/30 border border-border/40 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Gate</p>
        <p className="font-display text-xl font-bold text-foreground leading-none">
          Gate {data.gate}
        </p>
        <p className="text-[11px] text-foreground/70 mt-1">{data.gateName}</p>
      </div>
      <div className="rounded-2xl bg-muted/30 border border-border/40 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">House</p>
        <p className="font-display text-xl font-bold text-foreground leading-none flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-primary" />
          {data.house ? `${data.house.ordinal}` : "—"}
        </p>
        <p className="text-[11px] text-foreground/70 mt-1">
          {data.house ? data.house.label : "Add your birth date"}
        </p>
      </div>
    </div>

    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
      The Stage &amp; Atmosphere
    </p>
    <ul className="space-y-2">
      <li className="flex items-start gap-2 text-xs text-foreground/80">
        <Theater className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
        <span><strong className="font-medium">Core theme · </strong>{data.coreTheme}</span>
      </li>
      <li className="flex items-start gap-2 text-xs text-foreground/80">
        <Home className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
        <span><strong className="font-medium">Physical setting · </strong>{data.setting}</span>
      </li>
      <li className="flex items-start gap-2 text-xs text-foreground/80">
        <Users className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
        <span><strong className="font-medium">Audience · </strong>{data.audience}</span>
      </li>
    </ul>
  </motion.div>
);

export const NodalEnvironments = ({
  southGate,
  northGate,
  birthDate,
  location,
  locationLabel,
  ascSignIndex,
}: {
  southGate?: number | null;
  northGate?: number | null;
  birthDate?: string | null;
  location: { lat: number; lng: number } | null;
  locationLabel?: string;
  ascSignIndex?: number | null;
}) => {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);

  const south = nodalProfile(southGate, birthDate, "south", ascSignIndex);
  const north = nodalProfile(northGate, birthDate, "north", ascSignIndex);
  const age = ageFrom(birthDate);
  const postTransition = age !== null && age >= 40;
  const activeNode = postTransition ? north ?? south : south ?? north;


  const findSpots = async () => {
    if (!location || !activeNode) return;
    setLoading(true);
    setPlaces(null);
    try {
      const { data, error } = await supabase.functions.invoke("nodal-spots", {
        body: {
          latitude: location.lat,
          longitude: location.lng,
          keywords: activeNode.keywords,
          gate: activeNode.gate,
          gateName: activeNode.gateName,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlaces(data.places ?? []);
    } catch (err: any) {
      toast({
        title: "Couldn't load nearby spots",
        description: err.message ?? "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!south && !north) return null;

  return (
    <div className="space-y-4 mb-6">
      {south && (
        <NodeCard data={south} badge="Backdrop" window="Pre ages 38–42" active={!postTransition} />
      )}
      {north && (
        <NodeCard data={north} badge="Evolution" window="Post ages 38–42" active={postTransition} />
      )}

      {/* Nearby spots */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 shadow-aura"
      >
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">
            Nearby Spots Matching Your Nodal Vibe
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {locationLabel ? `Near ${locationLabel}` : "Based on your current location"}
          {activeNode ? ` · tuned to Gate ${activeNode.gate}` : ""}
        </p>

        {activeNode && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {activeNode.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <Button
          onClick={findSpots}
          disabled={!location || loading}
          className="w-full gradient-aura text-primary-foreground hover:opacity-90"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching nearby…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Find nodal spots near me</>
          )}
        </Button>

        {places && places.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            No matching venues found nearby. Try a different search location.
          </p>
        )}

        {places && places.length > 0 && (
          <div className="space-y-3 mt-4">
            {places.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border/50 bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display text-sm font-semibold text-foreground">{p.name}</h4>
                    <p className="text-[11px] text-muted-foreground capitalize">{p.type}</p>
                  </div>
                  {p.rating && (
                    <span className="flex items-center gap-1 text-[11px] text-foreground/70 shrink-0">
                      <Star className="w-3 h-3 fill-current text-amber-400" />
                      {p.rating}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {p.distance !== null ? `${p.distance} miles away · ` : ""}
                  {p.address}
                </p>
                <p className="text-[11px] text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 mt-2">
                  ✦ {p.alignment}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in Maps
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="flex-1">
                    <a href={p.directionsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="w-3.5 h-3.5 mr-1.5" /> Directions
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
