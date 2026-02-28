import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { type CenterId, CENTERS } from "@/lib/humandesign";

interface OpenCenterAlertsProps {
  openCenters: CenterId[];
}

const OpenCenterAlerts = ({ openCenters }: OpenCenterAlertsProps) => {
  if (openCenters.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-aura-peach" />
        Today's "Don't" Reminders
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Open centers absorb and amplify energy from others. Here's what to watch for:
      </p>
      <AnimatePresence>
        {openCenters.map((centerId, i) => {
          const center = CENTERS[centerId];
          const isMind = centerId === "head" || centerId === "ajna";
          return (
            <motion.div
              key={centerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border backdrop-blur-sm ${
                isMind
                  ? "bg-aura-lavender/10 border-aura-lavender/30"
                  : "bg-aura-sky/10 border-aura-sky/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isMind
                      ? "bg-aura-lavender/20 text-aura-lavender"
                      : "bg-aura-sky/20 text-aura-sky"
                  }`}
                >
                  {center.label.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    Open {center.label}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {center.dontStatement}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default OpenCenterAlerts;
