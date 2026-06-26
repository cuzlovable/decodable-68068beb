import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Bodygraph from "@/components/Bodygraph";
import OpenCenterAlerts from "@/components/OpenCenterAlerts";
import DeconditioningChecklist from "@/components/DeconditioningChecklist";
import MindGateRinse from "@/components/MindGateRinse";
import { getOpenCenters } from "@/lib/humandesign";

// Fallback used only if the profile somehow has no calculated chart yet.
const DEMO_DEFINED_GATES = [64, 47, 17, 62, 31, 7, 1, 8, 15, 5, 14, 2, 34, 57, 20];

const BodygraphPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (data && !data.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      setProfile(data);
      setLoading(false);
    };
    load();
  }, [navigate]);

  // Use the real chart from the profile; only fall back to demo if missing.
  const definedGates: number[] =
    (profile?.defined_gates && profile.defined_gates.length > 0)
      ? profile.defined_gates
      : DEMO_DEFINED_GATES;
  const raw = profile?.chart_raw as any | undefined;
  const personalityGates: number[] | undefined = raw?.gate_and_line?.personality
    ? Object.values(raw.gate_and_line.personality).map((v: any) => v?.[0]).filter((g: any) => typeof g === "number")
    : undefined;
  const designGates: number[] | undefined = raw?.gate_and_line?.design
    ? Object.values(raw.gate_and_line.design).map((v: any) => v?.[0]).filter((g: any) => typeof g === "number")
    : undefined;
  const designPlanets = raw?.gate_and_line?.design
    ? Object.entries(raw.gate_and_line.design).map(([planet, gl]: [string, any]) => ({ planet, gate: gl[0], line: gl[1] }))
    : undefined;
  const personalityPlanets = raw?.gate_and_line?.personality
    ? Object.entries(raw.gate_and_line.personality).map(([planet, gl]: [string, any]) => ({ planet, gate: gl[0], line: gl[1] }))
    : undefined;
  const variables = (profile?.variables as any) || undefined;
  const openCenters = getOpenCenters(definedGates);

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-4 py-6 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full gradient-aura flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-semibold text-foreground">My Design</span>
          </div>
          <div className="w-16" />
        </div>

        {/* Bodygraph Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6 shadow-aura"
        >
          <div className="text-center mb-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              {profile?.display_name || "Your"} Bodygraph
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {openCenters.length} open center{openCenters.length !== 1 ? "s" : ""} detected
            </p>
          </div>

          <Bodygraph
            definedGates={definedGates}
            designGates={designGates}
            personalityGates={personalityGates}
            designPlanets={designPlanets as any}
            personalityPlanets={personalityPlanets as any}
            variables={variables}
          />

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[hsl(0,0%,15%)]" />
              Design · Body
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[hsl(0,70%,50%)]" />
              Personality · Mind
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-muted-foreground border-dashed" />
              Open
            </div>
          </div>
        </motion.div>

        {/* Mind Gate Rinse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6"
        >
          <MindGateRinse definedGates={definedGates} />
        </motion.div>

        {/* Open Center Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6"
        >
          <OpenCenterAlerts openCenters={openCenters} />
        </motion.div>

        {/* Deconditioning Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
        >
          <DeconditioningChecklist openCenters={openCenters} />
        </motion.div>
      </div>
    </div>
  );
};

export default BodygraphPage;
