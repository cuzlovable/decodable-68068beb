import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Compass, Home, Users, Theater, MapPin, Loader2,
  ExternalLink, Navigation, Star, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { nodalProfile, ageFrom, ordinal, HOUSE_LABELS, type NodalProfile } from "@/lib/nodes";
import { fetchNodeHouses, hasAstroApiKey } from "@/lib/astro";
import { decodeEnvironment } from "@/lib/phs";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";


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
  houseOverride,
  houseLoading,
}: {
  data: NodalProfile;
  badge: string;
  window: string;
  active: boolean;
  houseOverride?: { ordinal: string; label: string } | null;
  houseLoading?: boolean;
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
          {houseLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            (houseOverride ?? data.house)?.ordinal ?? "—"
          )}
        </p>
        <p className="text-[11px] text-foreground/70 mt-1">
          {(houseOverride ?? data.house)?.label ?? "Add your birth date"}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        The Stage &amp; Atmosphere
      </p>
      {data.phsLabel && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
          {data.phsLabel}
        </span>
      )}
    </div>
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
  birthTime,
  latitude,
  longitude,
  northNodeLongitude,
  location,
  locationLabel,
  ascSignIndex,
  envVariable,
  onLocationChange,
  onUseCurrentLocation,
  locating,
}: {
  southGate?: number | null;
  northGate?: number | null;
  birthDate?: string | null;
  birthTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  northNodeLongitude?: number | null;
  location: { lat: number; lng: number } | null;
  locationLabel?: string;
  ascSignIndex?: number | null;
  /** PHS Environment variable as `color.tone`, e.g. 5.2 */
  envVariable?: number | null;
  onLocationChange?: (name: string, lat: number, lon: number) => void;
  onUseCurrentLocation?: () => void;
  locating?: boolean;
}) => {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [houses, setHouses] = useState<{ north: number; south: number } | null>(null);
  const [housesLoading, setHousesLoading] = useState(false);

  const env = typeof envVariable === "number" ? decodeEnvironment(envVariable) : null;
  const envColor = env?.color ?? null;
  const envTone = env?.tone ?? null;

  const south = nodalProfile(southGate, birthDate, "south", ascSignIndex, {
    houseNumber: houses?.south, envColor, envTone,
  });
  const north = nodalProfile(northGate, birthDate, "north", ascSignIndex, {
    houseNumber: houses?.north, envColor, envTone,
  });
  const age = ageFrom(birthDate);
  const postTransition = age !== null && age >= 40;
  const activeNode = postTransition ? north ?? south : south ?? north;


  // External astrology API (with local Placidus fallback) for node house numbers.
  useEffect(() => {
    const ready =
      Boolean(birthDate && birthTime) &&
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      typeof northNodeLongitude === "number";
    if (!ready) return;
    let cancelled = false;
    setHousesLoading(true);
    fetchNodeHouses(
      {
        date: birthDate as string,
        time: birthTime as string,
        latitude: latitude as number,
        longitude: longitude as number,
        houseSystem: "placidus",
        northNodeLongitude: northNodeLongitude as number,
      },
      !hasAstroApiKey()
    )
      .then((data) => {
        if (!cancelled) setHouses({ north: data.northNode.house, south: data.southNode.house });
      })
      .catch(() => { if (!cancelled) setHouses(null); })
      .finally(() => { if (!cancelled) setHousesLoading(false); });
    return () => { cancelled = true; };
  }, [birthDate, birthTime, latitude, longitude, northNodeLongitude]);

  const houseInfo = (h?: number) =>
    h ? { ordinal: ordinal(h), label: HOUSE_LABELS[h] } : null;

  // Blend both nodes' themes (gate + house + environment colour keywords),
  // leading with the node that is currently active for the user's age.
  const otherNode = activeNode === north ? south : north;
  const blendedKeywords = (() => {
    const lead = activeNode?.keywords ?? [];
    const support = otherNode?.keywords ?? [];
    const out: string[] = [];
    for (let i = 0; i < Math.max(lead.length, support.length) && out.length < 4; i++) {
      if (lead[i] && !out.includes(lead[i])) out.push(lead[i]);
      if (out.length < 4 && support[i] && !out.includes(support[i])) out.push(support[i]);
    }
    return out;
  })();

  const findSpots = async () => {
    if (!location || !activeNode) return;
    setLoading(true);
    setPlaces(null);
    try {
      const { data, error } = await supabase.functions.invoke("nodal-spots", {
        body: {
          latitude: location.lat,
          longitude: location.lng,
          keywords: blendedKeywords,
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

  // Auto-search whenever a location becomes available or changes.
  const lastSearchKey = useRef<string | null>(null);
  useEffect(() => {
    if (!location || !activeNode || housesLoading) return;
    const key = `${location.lat.toFixed(3)},${location.lng.toFixed(3)}|${activeNode.gate}|${houses?.north ?? ""}${houses?.south ?? ""}`;
    if (lastSearchKey.current === key) return;
    lastSearchKey.current = key;
    findSpots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, activeNode?.gate, houses, housesLoading]);

  if (!south && !north) return null;

  return (
    <div className="space-y-4 mb-6">
      {south && (
        <NodeCard
          data={south}
          badge="Backdrop"
          window="Pre ages 38–42"
          active={!postTransition}
          houseOverride={houseInfo(houses?.south)}
          houseLoading={housesLoading}
        />
      )}
      {north && (
        <NodeCard
          data={north}
          badge="Evolution"
          window="Post ages 38–42"
          active={postTransition}
          houseOverride={houseInfo(houses?.north)}
          houseLoading={housesLoading}
        />
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
            Nodal Spots Near You
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {locationLabel ? `Near ${locationLabel}` : "Finding your current location…"}
          {activeNode
            ? ` · Gate ${activeNode.gate}${houses ? ` · ${ordinal(activeNode === north ? houses.north : houses.south)} house` : ""}`
            : ""}
        </p>

        {/* Single search control: current location by default, searchable override */}
        <div className="space-y-2 mb-4">
          <LocationAutocomplete
            value=""
            onChange={(name, lat, lon) => onLocationChange?.(name, lat, lon)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUseCurrentLocation}
              disabled={locating}
              className="flex-1 text-xs"
            >
              {locating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              )}
              Use current location
            </Button>
            <Button
              size="sm"
              onClick={findSpots}
              disabled={!location || loading}
              className="flex-1 gradient-aura text-primary-foreground hover:opacity-90 text-xs"
            >
              {loading ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Searching…</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Refresh spots</>
              )}
            </Button>
          </div>
        </div>

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
