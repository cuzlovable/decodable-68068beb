import { Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail } from "lucide-react";
import AuraScene from "@/components/AuraScene";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* 3D Background */}
      <Suspense fallback={<div className="absolute inset-0 gradient-celestial" />}>
        <AuraScene />
      </Suspense>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/40 via-background/20 to-background/70 pointer-events-none" />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-full gradient-aura flex items-center justify-center shadow-aura">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">AuraMatch</span>
          </motion.div>
        </nav>

        {/* Hero — centered sign-up overlay */}
        <main className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="p-8 md:p-10 rounded-3xl bg-card/70 backdrop-blur-xl border border-border/40 shadow-aura text-center">
              <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3 text-gradient-aura">
                Synchronicity, decoded.
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs mx-auto">
                Your unique energetic blueprint reveals compatibility — beyond surface-level attraction.
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link to="/auth" className="block">
                  <Button
                    size="lg"
                    className="w-full rounded-xl gradient-aura text-primary-foreground py-6 text-base font-medium shadow-aura hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </Link>

                <Link to="/auth" className="block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl py-6 text-base font-medium border-border/60 hover:bg-muted/50 transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Continue with Email
                  </Button>
                </Link>
              </div>

              <p className="text-[11px] text-muted-foreground/70 mt-6 leading-relaxed">
                By continuing, you agree to our Terms&nbsp;of&nbsp;Service and Privacy&nbsp;Policy
              </p>
            </div>

            {/* Aura type labels floating below */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="flex justify-center gap-4 mt-10 flex-wrap"
            >
              {[
                { label: "Generator", color: "bg-aura-peach/20 text-aura-peach" },
                { label: "Manifesting Generator", color: "bg-aura-peach/30 text-aura-peach" },
                { label: "Manifestor", color: "bg-aura-sky/20 text-aura-sky" },
                { label: "Projector", color: "bg-aura-glow/30 text-foreground" },
                { label: "Reflector", color: "bg-aura-lavender/20 text-aura-lavender" },
              ].map((type) => (
                <span
                  key={type.label}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm ${type.color}`}
                >
                  {type.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-muted-foreground/60">
          © 2026 AuraMate · Designed by the cosmos
        </footer>
      </div>
    </div>
  );
};

export default Index;
