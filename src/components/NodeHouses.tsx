import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Compass, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchNodeHouses, hasAstroApiKey, type ChartData } from "@/lib/astro";

const fmt = (deg: number) => {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
};

const NodeHouseCard = ({
  title,
  badge,
  sign,
  degreeInSign,
  house,
}: {
  title: string;
  badge: string;
  sign: string;
  degreeInSign: number;
  house: number;
}) => (
  <div className="rounded-2xl bg-muted/30 border border-border/40 p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full gradient-aura text-primary-foreground">
        {badge}
      </span>
    </div>
    <p className="font-display text-xl font-bold text-foreground leading-none">{sign}</p>
    <p className="text-[11px] text-muted-foreground mt-1">{fmt(degreeInSign)} {sign}</p>
    <p className="text-sm text-foreground/80 mt-2 flex items-center gap-1.5">
      <Compass className="w-4 h-4 text-primary" />
      House {house}
    </p>
  </div>
);

export const NodeHouses = ({
  birthDate,
  birthTime,
  latitude,
  longitude,
  northNodeLongitude,
}: {
  birthDate?: string | null;
  birthTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  northNodeLongitude?: number | null;
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(!hasAstroApiKey());

  const ready =
    Boolean(birthDate && birthTime) &&
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    typeof northNodeLongitude === "number";

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNodeHouses(
        {
          date: birthDate as string,
          time: birthTime as string,
          latitude: latitude as number,
          longitude: longitude as number,
          houseSystem: "placidus",
          northNodeLongitude: northNodeLongitude as number,
        },
        mockMode
      );
      setChartData(data);
    } catch (err: any) {
      setError(err?.message ?? "Could not calculate house placements.");
    } finally {
      setLoading(false);
    }
  }, [ready, birthDate, birthTime, latitude, longitude, northNodeLongitude, mockMode]);

  useEffect(() => { load(); }, [load]);

  if (!ready) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 shadow-aura"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-base font-semibold text-foreground">
          Nodal House Placements
        </h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Placidus houses from your birth date, time and coordinates
        {chartData ? ` · ${chartData.source === "api" ? "live API" : "local calculation"}` : ""}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <Switch id="mock-mode" checked={mockMode} onCheckedChange={setMockMode} />
        <Label htmlFor="mock-mode" className="text-[11px] text-muted-foreground">
          Offline mode {hasAstroApiKey() ? "" : "(no API key configured)"}
        </Label>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!loading && !error && chartData && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NodeHouseCard
              title="North Node"
              badge="Evolution"
              sign={chartData.northNode.sign}
              degreeInSign={chartData.northNode.degreeInSign}
              house={chartData.northNode.house}
            />
            <NodeHouseCard
              title="South Node"
              badge="Backdrop"
              sign={chartData.southNode.sign}
              degreeInSign={chartData.southNode.degreeInSign}
              house={chartData.southNode.house}
            />
          </div>

          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-5 mb-2">
            House cusps
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {chartData.cusps.map((c, i) => {
              const signIndex = Math.floor(c / 30) % 12;
              const signs = ["Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"];
              return (
                <div key={i} className="rounded-lg bg-muted/25 border border-border/30 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">House {i + 1}</p>
                  <p className="text-[11px] text-foreground/80">
                    {fmt(c - signIndex * 30)} {signs[signIndex]}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};
