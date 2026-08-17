import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MatchModalProps {
  open: boolean;
  name: string;
  matchId: string | null;
  onClose: () => void;
}

export const MatchModal = ({ open, name, matchId, onClose }: MatchModalProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-background/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.9, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm p-8 rounded-3xl bg-card border border-border/50 text-center shadow-aura"
        >
          <div className="w-16 h-16 rounded-full gradient-aura flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">It's a Match!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You and {name} liked each other. The chemistry is mutual.
          </p>
          <div className="space-y-2">
            {matchId && (
              <Link to={`/chat/${matchId}`}>
                <Button className="w-full py-6 rounded-xl gradient-aura text-primary-foreground">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send a message
                </Button>
              </Link>
            )}
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
              Keep exploring
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default MatchModal;
