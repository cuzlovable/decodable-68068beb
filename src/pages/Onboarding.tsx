import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, MapPin, Clock, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STEPS = ["birth_date", "birth_time", "birth_location"] as const;

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    birth_date: "",
    birth_time: "",
    birth_location: "",
    birth_latitude: 0,
    birth_longitude: 0,
  });

  // Auth + stage routing is handled centrally by RequireStage.


  const handleNext = () => {
    if (step === 0 && !form.birth_date) {
      toast.error("Please enter your birth date");
      return;
    }
    if (step === 1 && !form.birth_time) {
      toast.error("Please enter your birth time — it's crucial for accuracy!");
      return;
    }
    if (step === 2 && !form.birth_location) {
      toast.error("Please select your birth location from the dropdown");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      toast.info("Calculating your Human Design chart...");

      // Call the chart calculation edge function
      const { data: chart, error: chartError } = await supabase.functions.invoke("calculate-chart", {
        body: {
          birth_date: form.birth_date,
          birth_time: form.birth_time,
          birth_location: form.birth_location,
          latitude: form.birth_latitude,
          longitude: form.birth_longitude,
        },
      });

      if (chartError) {
        console.error("Chart calculation error:", chartError);
        throw new Error("Failed to calculate your chart. Please try again.");
      }

      if (chart?.error) {
        throw new Error(chart.error);
      }

      // Save birth data + calculated chart to profile
      const { error } = await supabase
        .from("profiles")
        .update({
          birth_date: form.birth_date,
          birth_time: form.birth_time,
          birth_location: form.birth_location,
          birth_latitude: form.birth_latitude,
          birth_longitude: form.birth_longitude,
          energy_type: chart.energy_type,
          authority: chart.authority,
          profile: chart.profile,
          strategy: chart.strategy,
          not_self_theme: chart.not_self_theme,
          signature: chart.signature,
          definition: chart.definition,
          incarnation_cross: chart.incarnation_cross,
          defined_gates: chart.defined_gates,
          defined_centers: chart.defined_centers,
          variables: chart.variables,
          chart_raw: chart.raw,
          onboarding_completed: true,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast.success(`Welcome, ${chart.profile} ${chart.authority} ${chart.energy_type}! ✨`);
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = [
    {
      icon: CalendarDays,
      title: "When were you born?",
      subtitle: "Your birth date reveals your Energy Type and Profile.",
      field: (
        <Input
          type="date"
          value={form.birth_date}
          onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          className="rounded-xl py-6 text-center text-lg bg-background/50"
        />
      ),
    },
    {
      icon: Clock,
      title: "What time were you born?",
      subtitle: "Exact birth time is crucial for accurate Variables and Authority.",
      field: (
        <Input
          type="time"
          value={form.birth_time}
          onChange={(e) => setForm({ ...form, birth_time: e.target.value })}
          className="rounded-xl py-6 text-center text-lg bg-background/50"
        />
      ),
    },
    {
      icon: MapPin,
      title: "Where were you born?",
      subtitle: "Your birth location determines your Nodal Environments.",
      field: (
        <LocationAutocomplete
          value={form.birth_location}
          onChange={(location, lat, lon) =>
            setForm({ ...form, birth_location: location, birth_latitude: lat, birth_longitude: lon })
          }
          className="rounded-xl py-6 text-center text-lg bg-background/50"
        />
      ),
    },
  ];

  const current = stepConfig[step];

  return (
    <div className="min-h-screen gradient-celestial flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/8 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-secondary/10 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? "w-10 gradient-aura" : "w-6 bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-full gradient-aura flex items-center justify-center mx-auto mb-6">
              <current.icon className="w-7 h-7 text-primary-foreground" />
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              {current.title}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">{current.subtitle}</p>

            <div className="mb-8">{current.field}</div>

            <div className="flex items-center justify-center gap-3">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="rounded-full px-6 py-5 border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={loading}
                className="rounded-full gradient-aura text-primary-foreground px-8 py-5 shadow-aura hover:opacity-90 transition-opacity"
              >
                {step === STEPS.length - 1 ? (
                  loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating Chart...
                    </>
                  ) : (
                    "Reveal My Design"
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
