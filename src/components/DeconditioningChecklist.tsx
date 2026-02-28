import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Timer, Droplets, Wind, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CenterId, getDeconditioningItems } from "@/lib/humandesign";

interface DeconditioningChecklistProps {
  openCenters: CenterId[];
}

const ICONS: Record<string, typeof Timer> = {
  sacral: Timer,
  solar: Wind,
  g: Droplets,
};

const DeconditioningChecklist = ({ openCenters }: DeconditioningChecklistProps) => {
  const items = getDeconditioningItems(openCenters);
  const storageKey = `decon-${new Date().toISOString().split("T")[0]}`;

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...checked]));
  }, [checked, storageKey]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => setChecked(new Set());
  const progress = items.length > 0 ? Math.round((checked.size / items.length) * 100) : 0;

  return (
    <div>
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Daily Rinse
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{progress}%</span>
          <Button variant="ghost" size="icon" onClick={reset} className="h-7 w-7">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-border mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-aura"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {items.map((item, i) => {
          const isDone = checked.has(item.id);
          const Icon = ICONS[item.center] || Timer;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggle(item.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                isDone
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card/60 border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isDone
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        isDone ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.duration && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DeconditioningChecklist;
