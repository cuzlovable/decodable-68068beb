import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { MIND_GATE_TIPS, MIND_GATES, GATE_TO_CENTER } from "@/lib/humandesign";

interface MindGateRinseProps {
  /** Defined gates from the chart */
  definedGates: number[];
}

const MindGateRinse = ({ definedGates }: MindGateRinseProps) => {
  const definedSet = new Set(definedGates);
  // Open mind gates = Head/Ajna gates NOT in defined set
  const openMindGates = MIND_GATES.filter((g) => !definedSet.has(g));

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="font-display text-lg font-semibold text-foreground">Mind Gate Rinse</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Your open Head &amp; Ajna gates pick up other people's mental pressure.
        Use these rinses to release what isn't yours.
      </p>

      {openMindGates.length === 0 ? (
        <div className="rounded-xl bg-card/60 border border-border/50 p-4 text-sm text-muted-foreground">
          All Head &amp; Ajna gates are defined — your mind has its own fixed way of processing.
        </div>
      ) : (
        <div className="space-y-2.5">
          {openMindGates.map((g, i) => {
            const info = MIND_GATE_TIPS[g];
            const center = GATE_TO_CENTER[g] === "head" ? "Head" : "Ajna";
            return (
              <motion.div
                key={g}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl bg-card/60 border border-border/50 p-3.5 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full gradient-aura flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">{g}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      Gate {g} · {info.name}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {center}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{info.tip}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-semibold text-foreground">General open-center deconditioning</p>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed list-disc pl-4">
          <li>Spend 15+ minutes alone daily (6ft+ from others) to clear absorbed energy.</li>
          <li>Sleep alone when you can — your aura needs space to release the day's amplification.</li>
          <li>Cold water on the chest, face, and wrists resets the magnetic monopole.</li>
          <li>Ask: "Whose voice is this?" before acting on a thought, urge, or fear.</li>
          <li>Trust your authority — the open mind is for wisdom, not decisions.</li>
        </ul>
      </div>
    </div>
  );
};

export default MindGateRinse;
