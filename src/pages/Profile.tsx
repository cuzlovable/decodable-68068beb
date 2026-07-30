import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, LogOut, Activity, MapPin, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single();

      if (data && !data.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      setProfile(data);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-6 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-aura flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">AuraChem</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 overflow-hidden shadow-aura"
        >
          {/* Gradient header */}
          <div className="h-32 gradient-aura relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="w-20 h-20 rounded-full bg-card border-4 border-card flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Sparkles className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-14 pb-8 px-6 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              {profile?.display_name || "Cosmic Being"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Born {profile?.birth_date} · {profile?.birth_location}
            </p>

            {/* Energy Type badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-aura text-primary-foreground font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              {profile?.energy_type || "Awaiting Calculation"}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {profile?.energy_type
                ? `As a ${profile.energy_type}, you have a unique way of experiencing connection. Your design is being displayed for insights.`
                : "Your Human Design chart is being processed. Check back soon for your full energetic profile and compatibility insights."}
            </p>
          </div>
        </motion.div>

        {/* Bodygraph Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <Link to="/bodygraph">
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-aura transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-aura flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">My Bodygraph</h3>
                  <p className="text-xs text-muted-foreground">View chart, open centers & daily deconditioning</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Environment Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Link to="/environment">
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-aura transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-aura flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">My Environments</h3>
                  <p className="text-xs text-muted-foreground">Discover where your aura thrives</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Matches Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <Link to="/matches">
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-aura transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-aura flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">High Chemistry</h3>
                  <p className="text-xs text-muted-foreground">Friction-reduced, dynamic, harmonic signal</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Group Dynamics Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Link to="/group-dynamics">
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-aura transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-aura flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Penta & Wa Dynamics</h3>
                  <p className="text-xs text-muted-foreground">How your energy lands in small & large groups</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
