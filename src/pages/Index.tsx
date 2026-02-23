import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Compass, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen gradient-celestial overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full gradient-aura flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">AuraMatch</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/auth">
            <Button variant="outline" className="rounded-full border-primary/30 hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24">
        <div className="flex flex-col items-center text-center">
          {/* Floating orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
            <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-secondary/15 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-1/4 left-1/3 w-56 h-56 rounded-full bg-aura-lavender/10 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Human Design
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 text-foreground">
              Find love written
              <br />
              <span className="text-gradient-aura">in the stars</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              AuraMatch uses your unique Human Design chart to reveal
              deep energetic compatibility — beyond surface-level attraction.
            </p>

            <Link to="/auth">
              <Button
                size="lg"
                className="rounded-full gradient-aura text-primary-foreground px-8 py-6 text-lg shadow-aura hover:opacity-90 transition-opacity"
              >
                Discover Your Aura
              </Button>
            </Link>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 relative z-10 w-full max-w-4xl"
          >
            {[
              {
                icon: Star,
                title: "Energy Type",
                desc: "Discover if you're a Generator, Projector, Manifestor, Manifesting Generator, or Reflector.",
              },
              {
                icon: Heart,
                title: "Chemistry Mapping",
                desc: "See electromagnetic connections, dominance themes, and compatibility at a glance.",
              },
              {
                icon: Compass,
                title: "Nodal Environments",
                desc: "Find the places where your energy thrives — mapped to real locations near you.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 text-left hover:shadow-aura transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl gradient-aura flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-muted-foreground">
        © 2026 AuraMatch · Designed by the cosmos
      </footer>
    </div>
  );
};

export default Index;
