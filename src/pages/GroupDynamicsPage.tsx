import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, UsersRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type GroupGuidance = {
  pentaRole: string;
  pentaSkills: string;
  pentaTip: string;
  waRole: string;
  waPresence: string;
  waTip: string;
};

const GUIDANCE_BY_TYPE: Record<string, GroupGuidance> = {
  Manifestor: {
    pentaRole: "Initiator & Alpha catalyst",
    pentaSkills: "You set the direction of the Penta. Your urge to start things becomes a usable skill the group rallies behind.",
    pentaTip: "Inform the 2–4 others before you move. In a small group, an uninformed Manifestor creates resistance fast.",
    waRole: "Alpha of the Wa — the one the larger group looks to for the spark.",
    waPresence: "Large groups feel your impact even when you say little. You're not here to manage the Wa — you're here to ignite it and exit.",
    waTip: "Drop the vision, let Generators and Projectors carry it. Lingering in the Wa drains you.",
  },
  "Generator": {
    pentaRole: "Sacral engine of the Penta",
    pentaSkills: "Your sustainable life-force is the Penta's actual fuel. Small groups feel productive because of you.",
    pentaTip: "Only respond to what genuinely lights you up — the Penta will absorb whatever you sacrally commit to.",
    waRole: "Builder of the Wa — the worker bee whose response shapes what the larger group can actually accomplish.",
    waPresence: "Large groups can over-amplify your sacral. You'll feel pulled in many directions.",
    waTip: "Use your strategy (respond) ruthlessly in a Wa. If it's not a gut yes, it's not yours to carry.",
  },
  "Manifesting Generator": {
    pentaRole: "Multi-skill engine of the Penta",
    pentaSkills: "You bring speed and several skills at once. The Penta uses you to shortcut steps and skip the unnecessary.",
    pentaTip: "Inform after you respond — small groups need to know which direction you just jumped in.",
    waRole: "Accelerator of the Wa — the one who shows the larger group what's actually possible at speed.",
    waPresence: "You'll out-pace most of the Wa. That's by design, not a flaw.",
    waTip: "Don't slow down to match the group's tempo. Inform, then move.",
  },
  Projector: {
    pentaRole: "Guide & recognizer inside the Penta",
    pentaSkills: "Your skill is seeing the others. In a small group your perspective on energy and efficiency is gold — but only when invited.",
    pentaTip: "Wait for the invitation from the Penta. Unsolicited guidance creates bitterness for you and resistance in them.",
    waRole: "Role-holder of the Wa — the one a larger group recognizes for wisdom about systems and people.",
    waPresence: "Large groups can be exhausting. Your aura is focused, not designed to absorb a Wa for long.",
    waTip: "Pick your Wa carefully and step out to recharge. Recognition in the right Wa is your career.",
  },
  Reflector: {
    pentaRole: "Mirror of the Penta",
    pentaSkills: "You reflect back the health of the small group with precision few can match. The Penta becomes self-aware through you.",
    pentaTip: "Notice what feels off — that's data about the Penta, not about you.",
    waRole: "Sampler of the Wa — you read the larger group's collective energy as a single field.",
    waPresence: "A healthy Wa lights you up; an unhealthy one will mark you for days.",
    waTip: "Honor your lunar cycle before committing to any Wa. Wait 28 days on big decisions.",
  },
};

const DEFAULT_GUIDANCE: GroupGuidance = {
  pentaRole: "Contributing member of the Penta",
  pentaSkills: "Once your chart is calculated, your specific small-group skill set will show up here.",
  pentaTip: "Complete onboarding to unlock your personalized Penta guidance.",
  waRole: "Participant in the Wa",
  waPresence: "Larger groups will use only the parts of your design that fit the collective field.",
  waTip: "Your Wa role will appear once your chart finishes processing.",
};

const GroupDynamicsPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (!data) { navigate("/onboarding"); return; }
      setProfile(data);
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  const type: string = profile?.energy_type || "";
  const guidance = GUIDANCE_BY_TYPE[type] || DEFAULT_GUIDANCE;

  return (
    <div className="min-h-screen gradient-celestial px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Penta & Wa Dynamics</h1>
            <p className="text-xs text-muted-foreground">How your energy lands in small & large groups</p>
          </div>
        </div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6 shadow-aura"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wider text-primary font-medium">
              From Traits → Skills → Roles
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            In your own chart you have <span className="font-semibold">traits</span>. In a Penta (3–5 people)
            those become <span className="font-semibold">skills</span>. In a Wa (a larger group) they
            become <span className="font-semibold">roles</span>. Your energy is leveraged differently at
            each scale — and the group only uses what it needs.
          </p>
          {type && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Your type: {type}
            </div>
          )}
        </motion.div>

        {/* Penta Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl gradient-aura flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Penta</h2>
              <p className="text-xs text-muted-foreground">Small group · 3–5 people</p>
            </div>
          </div>

          <Field label="Your skill in a Penta" value={guidance.pentaRole} />
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            {guidance.pentaSkills}
          </p>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[11px] uppercase tracking-wider text-primary font-medium mb-1">Tip</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{guidance.pentaTip}</p>
          </div>
        </motion.div>

        {/* Wa Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
              <UsersRound className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Wa</h2>
              <p className="text-xs text-muted-foreground">Large group · teams, rooms, communities</p>
            </div>
          </div>

          <Field label="Your role in a Wa" value={guidance.waRole} />
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            {guidance.waPresence}
          </p>
          <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-400/20">
            <p className="text-[11px] uppercase tracking-wider text-sky-500 font-medium mb-1">Tip</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{guidance.waTip}</p>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-card/50 border border-border/30 text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Penta & Wa</span> come from the BG5 / business
            application of Human Design. The Penta takes only what it needs — channels outside your
            assigned skill set aren't used while you're in the group.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default GroupDynamicsPage;
