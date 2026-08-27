import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Bodygraph from "@/components/Bodygraph";

/**
 * Design Reveal — reads the ALREADY persisted chart. It never recalculates
 * and never writes profile/chart records.
 */
const DesignReveal = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  const facts = [
    { label: "Energy Type", value: profile?.energy_type },
    { label: "Strategy", value: profile?.strategy },
    { label: "Inner Authority", value: profile?.authority },
    { label: "Profile", value: profile?.profile },
    { label: "Definition", value: profile?.definition },
    { label: "Signature", value: profile?.signature },
    { label: "Not-Self Theme", value: profile?.not_self_theme },
    { label: "Incarnation Cross", value: profile?.incarnation_cross },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen gradient-celestial px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-14 h-14 rounded-full gradient-aura flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Your Design, revealed</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.energy_type
              ? `${[profile.profile, profile.authority, profile.energy_type].filter(Boolean).join(" · ")}`
              : "Your chart is still processing."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 shadow-aura mb-6"
        >
          <div className="grid grid-cols-2 gap-4">
            {facts.map((f) => (
              <div key={f.label}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {profile?.defined_gates?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 shadow-aura mb-8"
          >
            <Bodygraph definedGates={profile.defined_gates} />
          </motion.div>
        )}

        <div className="flex justify-center pb-6">
          <Button
            onClick={() => navigate("/profile-setup")}
            className="rounded-full gradient-aura text-primary-foreground px-8 py-5 shadow-aura hover:opacity-90"
          >
            Continue to your profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesignReveal;
