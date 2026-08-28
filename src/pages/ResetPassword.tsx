import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "checking" | "ready" | "invalid" | "done";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // A recovery link delivers a session (hash type=recovery). Wait for it.
  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        setStatus("ready");
      } else {
        // Give the SDK a moment to parse the recovery hash before giving up.
        setTimeout(() => {
          if (active) setStatus((s) => (s === "checking" ? "invalid" : s));
        }, 1500);
      }
    };
    check();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("done");
      toast.success("Password updated");
      setTimeout(() => navigate("/auth", { replace: true }), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-celestial flex items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full gradient-aura flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Set a new password</h1>
          <p className="text-muted-foreground">
            {status === "invalid"
              ? "This reset link is invalid or has expired."
              : status === "done"
                ? "Your password has been updated."
                : "Choose a password you'll remember."}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 space-y-5">
          {status === "checking" && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 rounded-xl gradient-aura text-primary-foreground text-base font-medium"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </form>
          )}

          {(status === "invalid" || status === "done") && (
            <Link
              to={status === "invalid" ? "/forgot-password" : "/auth"}
              className="block w-full text-center text-sm text-primary hover:underline"
            >
              {status === "invalid" ? "Request a new reset link" : "Continue to sign in"}
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
