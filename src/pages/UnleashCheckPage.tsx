import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, Clock, Sparkles, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getUnleashCheckConfig, UnleashCheckConfig } from "@/lib/messaging";

const UnleashCheckPage = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<UnleashCheckConfig | null>(null);
  const [answered, setAnswered] = useState(false);
  const [response, setResponse] = useState<boolean | null>(null);
  const [reflection, setReflection] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("authority")
        .eq("user_id", session.user.id)
        .single();

      const cfg = getUnleashCheckConfig(profile?.authority || null);
      setConfig(cfg);

      // Check existing unleash check for this match
      if (!matchId?.startsWith("demo-")) {
        const { data: existing } = await supabase
          .from("unleash_checks")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("match_id", matchId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          const check = existing[0];
          if (check.answered_at) {
            setAnswered(true);
            setResponse(check.unleashed);
            setReflection(check.reflection || "");
          } else if (cfg.delayHours > 0) {
            const availableAt = new Date(check.available_at);
            if (availableAt > new Date()) {
              setIsLocked(true);
              updateTimeRemaining(availableAt);
            }
          }
        }
      }

      // For emotional authority, check if within delay window
      if (cfg.delayHours > 0 && !answered) {
        setIsLocked(true);
        const availableAt = new Date(Date.now() + cfg.delayHours * 3600000);
        updateTimeRemaining(availableAt);
      }

      setLoading(false);
    };

    const updateTimeRemaining = (target: Date) => {
      const update = () => {
        const diff = target.getTime() - Date.now();
        if (diff <= 0) {
          setIsLocked(false);
          setTimeRemaining(null);
          return;
        }
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        setTimeRemaining(`${hours}h ${mins}m`);
      };
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    };

    load();
  }, [matchId, navigate, answered]);

  const handleSubmit = async (unleashed?: boolean, text?: string) => {
    if (submitting) return;
    setSubmitting(true);

    const finalResponse = unleashed ?? response;
    const finalReflection = text || reflection;

    if (!matchId?.startsWith("demo-")) {
      await supabase.from("unleash_checks").insert({
        user_id: userId,
        match_id: matchId,
        authority: config?.authority || "Sacral",
        unleashed: finalResponse,
        reflection: finalReflection || null,
        response: finalResponse ? "yes" : finalReflection ? "reflection" : "no",
        available_at: new Date().toISOString(),
        answered_at: new Date().toISOString(),
      });
    }

    setResponse(finalResponse);
    setReflection(finalReflection);
    setAnswered(true);
    setSubmitting(false);
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/chat/${matchId}`}>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">The Unleash Check</h1>
            <p className="text-xs text-muted-foreground">Post-interaction feedback</p>
          </div>
        </div>

        {/* Authority Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-aura text-primary-foreground font-medium text-sm">
            <Sparkles className="w-4 h-4" />
            {config.authority} Authority
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-8 shadow-aura"
        >
          {answered ? (
            /* ── Answered State ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-aura flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {response ? "You Unleashed! ✨" : "Not Yet Aligned"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {response
                  ? "Your authentic self showed up. That's the design working correctly."
                  : "Conditioning may have been at play. Honor that awareness — it's the first step."}
              </p>
              {reflection && (
                <div className="mt-4 p-4 rounded-xl bg-muted/50 text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your Reflection</p>
                  <p className="text-sm text-foreground leading-relaxed">{reflection}</p>
                </div>
              )}
            </div>
          ) : isLocked ? (
            /* ── Locked (Waiting) State ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                {config.prompt}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {config.instruction}
              </p>
              {timeRemaining && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Available in {timeRemaining}
                </div>
              )}
            </div>
          ) : (
            /* ── Active Input State ── */
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {config.prompt}
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                {config.instruction}
              </p>

              {config.inputType === "boolean" && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    className="w-32 h-14 rounded-2xl gradient-aura text-primary-foreground text-lg font-display font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Yes
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    variant="outline"
                    className="w-32 h-14 rounded-2xl text-lg font-display font-semibold border-border"
                  >
                    <X className="w-5 h-5 mr-2" />
                    No
                  </Button>
                </div>
              )}

              {config.inputType === "text" && (
                <div className="space-y-4">
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write what came up for you..."
                    className="min-h-[120px] rounded-xl bg-background border-border/50 resize-none"
                    maxLength={2000}
                  />
                  <Button
                    onClick={() => handleSubmit(null, reflection)}
                    disabled={!reflection.trim() || submitting}
                    className="w-full rounded-xl gradient-aura text-primary-foreground"
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    Submit Reflection
                  </Button>
                </div>
              )}

              {config.inputType === "reflection" && (
                <div className="space-y-4">
                  <div className="flex gap-4 justify-center mb-4">
                    <Button
                      onClick={() => setResponse(true)}
                      variant={response === true ? "default" : "outline"}
                      className={`w-28 h-12 rounded-2xl font-display font-semibold ${
                        response === true ? "gradient-aura text-primary-foreground" : "border-border"
                      }`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Yes
                    </Button>
                    <Button
                      onClick={() => setResponse(false)}
                      variant={response === false ? "default" : "outline"}
                      className={`w-28 h-12 rounded-2xl font-display font-semibold ${
                        response === false ? "bg-muted text-foreground" : "border-border"
                      }`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      No
                    </Button>
                  </div>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Reflect on the experience..."
                    className="min-h-[120px] rounded-xl bg-background border-border/50 resize-none"
                    maxLength={2000}
                  />
                  <Button
                    onClick={() => handleSubmit(response, reflection)}
                    disabled={response === null || submitting}
                    className="w-full rounded-xl gradient-aura text-primary-foreground"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete Unleash Check
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Authority explanation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-2xl bg-card/50 border border-border/30 text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Authority-Gated Feedback.</span>{" "}
            Your {config.authority} Authority determines how and when you process
            decisions. This check respects your unique decision-making timeline.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default UnleashCheckPage;
