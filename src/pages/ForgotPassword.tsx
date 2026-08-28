import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter the email you signed up with");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-secondary/15 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full gradient-aura flex items-center justify-center mx-auto mb-4">
            {sent ? (
              <MailCheck className="w-7 h-7 text-primary-foreground" />
            ) : (
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {sent ? "Check your inbox" : "Reset your password"}
          </h1>
          <p className="text-muted-foreground">
            {sent
              ? "We sent a reset link if an account exists for that email."
              : "We'll email you a link to set a new password."}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 space-y-5">
          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 rounded-xl gradient-aura text-primary-foreground text-base font-medium"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send reset link
              </Button>
            </form>
          )}

          <Link to="/auth" className="block w-full text-center text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
