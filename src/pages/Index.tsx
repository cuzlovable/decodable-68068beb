import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play } from "lucide-react";
import galaxyBg from "@/assets/galaxy-bg.mp4.asset.json";

const Index = () => {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(Boolean(reducedMotion));

  useEffect(() => {
    if (reducedMotion) setPaused(true);
  }, [reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else void video.play().catch(() => setPaused(true));
  }, [paused]);

  return (
    <div className="cosmic-opening relative isolate flex min-h-svh flex-col overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={galaxyBg.url}
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <header className="relative z-10 flex w-full items-center justify-between px-6 py-6 sm:px-10">
        <span className="cosmic-copy font-display text-2xl font-medium">AuraChem</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Play cosmic motion" : "Pause cosmic motion"}
          title={paused ? "Play cosmic motion" : "Pause cosmic motion"}
          className="cosmic-motion-control rounded-full"
        >
          {paused ? <Play /> : <Pause />}
        </Button>
      </header>

      <main className="relative z-10 flex flex-1 items-end justify-center px-6 pb-16 pt-36 sm:pb-20">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.4 }}
          className="cosmic-copy w-full max-w-xl text-center"
        >
          <p className="mb-4 text-xs uppercase tracking-normal opacity-80">One moment. Your beginning.</p>
          <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
            Synchronicity, decoded.
          </h1>
          <p className="mx-auto mb-7 mt-5 max-w-sm text-base leading-relaxed opacity-90">
            In a universe of infinite possibilities,<br className="hidden sm:block" /> it begins with the moment you were born.
          </p>
          <Button asChild variant="ghost" size="lg" className="cosmic-entry h-auto min-h-12 whitespace-normal rounded-none px-2 py-3 text-base">
            <Link to="/onboarding">
              Enter your birth details <ArrowRight className="ml-3" />
            </Link>
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
