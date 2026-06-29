import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, UsersRound, Sparkles, Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Canonical gate sets (per Ra Uru Hu / Penta-Wa research).
// Penta = small group (3–5). These gates carry the "skills" the small group needs.
const PENTA_GATES = [5, 15, 2, 14, 29, 46, 7, 31, 1, 8, 13, 33];
// Wa = larger group. These gates carry the "roles" a larger group recognizes.
const WA_GATES = [45, 21, 25, 51, 59, 6, 2, 14, 3, 60, 27, 50];

// Short skill labels for individual Penta gates.
const PENTA_GATE_NAMES: Record<number, string> = {
  5: "Rhythm", 15: "Flow", 2: "Direction", 14: "Resources", 29: "Commitment",
  46: "Body love", 7: "Leadership", 31: "Influence", 1: "Self-expression",
  8: "Contribution", 13: "Listener", 33: "Memory",
};
// Short role labels for individual Wa gates.
const WA_GATE_NAMES: Record<number, string> = {
  45: "The Gatherer", 21: "The Controller", 25: "Innocence", 51: "Shock",
  59: "Intimacy", 6: "Friction", 2: "Direction", 14: "Resources",
  3: "Order", 60: "Acceptance", 27: "Caring", 50: "Values",
};

type GroupGuidance = {
  pentaLine: string;
  pentaTip: string;
  waLine: string;
  waTip: string;
};

// One short sentence per slot. Plain, no jargon.
const GUIDANCE_BY_TYPE: Record<string, GroupGuidance> = {
  Manifestor: {
    pentaLine: "You spark the small group.",
    pentaTip: "Inform the 2–4 others before you move.",
    waLine: "You ignite the crowd, then exit.",
    waTip: "Drop the vision and let others carry it.",
  },
  Generator: {
    pentaLine: "You're the engine of the small group.",
    pentaTip: "Only commit to what's a gut yes.",
    waLine: "You build what the crowd commits to.",
    waTip: "If it's not a yes, it's not yours.",
  },
  "Manifesting Generator": {
    pentaLine: "You bring speed + range to the small group.",
    pentaTip: "Respond, then inform — fast.",
    waLine: "You show the crowd what's possible at speed.",
    waTip: "Don't slow down — inform and move.",
  },
  Projector: {
    pentaLine: "You guide the small group when invited.",
    pentaTip: "Wait for the invitation.",
    waLine: "The crowd recognizes your wisdom.",
    waTip: "Pick your group and step out to recharge.",
  },
  Reflector: {
    pentaLine: "You mirror the small group's health.",
    pentaTip: "What feels off is data about them, not you.",
    waLine: "You read the crowd as one field.",
    waTip: "Wait a lunar cycle before committing.",
  },
};

const DEFAULT_GUIDANCE: GroupGuidance = {
  pentaLine: "Finish onboarding to unlock your Penta line.",
  pentaTip: "Your personalized small-group tip will appear here.",
  waLine: "Finish onboarding to unlock your Wa line.",
  waTip: "Your personalized large-group tip will appear here.",
};

type Member = { id: string; name: string; gates: number[] };

function parseGates(input: string): number[] {
  return Array.from(
    new Set(
      input
        .split(/[,\s]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 64)
    )
  );
}

function GroupSimulator({
  kind,
  accent,
  userName,
  userGates,
}: {
  kind: "penta" | "wa";
  accent: "primary" | "sky";
  userName: string;
  userGates: number[];
}) {
  const canonical = kind === "penta" ? PENTA_GATES : WA_GATES;
  const canonicalSet = useMemo(() => new Set(canonical), [canonical]);
  const labelMap = kind === "penta" ? PENTA_GATE_NAMES : WA_GATE_NAMES;

  const maxMembers = kind === "penta" ? 4 : 30; // self + 4 others = Penta; Wa = larger
  const minTotal = kind === "penta" ? 3 : 6;

  // Auto-seed "you" — name from profile, gates filtered to the canonical set so the
  // user immediately sees which Penta/Wa skills/roles they personally carry.
  const youMember: Member = useMemo(
    () => ({
      id: "you",
      name: userName || "You",
      gates: userGates.filter((g) => canonicalSet.has(g)),
    }),
    [userName, userGates, canonicalSet]
  );

  const [others, setOthers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [gateInput, setGateInput] = useState("");

  const addMember = () => {
    const gates = parseGates(gateInput).filter((g) => canonicalSet.has(g));
    if (!name.trim() || gates.length === 0) return;
    if (others.length >= maxMembers) return;
    setOthers((m) => [...m, { id: crypto.randomUUID(), name: name.trim(), gates }]);
    setName("");
    setGateInput("");
  };

  const removeMember = (id: string) => setOthers((m) => m.filter((x) => x.id !== id));

  const composite = useMemo(() => {
    const groupGates = new Set<number>();
    [youMember, ...others].forEach((m) => m.gates.forEach((g) => groupGates.add(g)));
    const covered = canonical.filter((g) => groupGates.has(g));
    const missing = canonical.filter((g) => !groupGates.has(g));
    return {
      totalPeople: 1 + others.length,
      covered,
      missing,
    };
  }, [youMember, others, canonical]);

  const tooSmall = kind === "penta" && composite.totalPeople < 3;
  const tooLarge = kind === "penta" && composite.totalPeople > 5;
  const accentClasses =
    accent === "primary"
      ? { ring: "border-primary/30", chip: "bg-primary/10 text-primary", btn: "gradient-aura text-primary-foreground" }
      : { ring: "border-sky-400/30", chip: "bg-sky-500/10 text-sky-500", btn: "bg-gradient-to-br from-sky-400 to-indigo-500 text-primary-foreground" };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-foreground/70" />
        <h3 className="font-display text-sm font-semibold text-foreground">
          {kind === "penta" ? "Build your Penta" : "Build your Wa"}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Add the others' defined gates to see which {kind === "penta" ? "skills" : "roles"} your
        group covers together.
      </p>

      {/* Add member */}
      <div className="space-y-2 mb-4">
        <Input
          placeholder="Member name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
        />
        <Input
          placeholder="Their defined gates (e.g. 5, 15, 7, 31)"
          value={gateInput}
          onChange={(e) => setGateInput(e.target.value)}
          className="rounded-xl font-mono text-xs"
        />
        <Button
          onClick={addMember}
          disabled={!name.trim() || parseGates(gateInput).filter(g => canonicalSet.has(g)).length === 0 || others.length >= maxMembers}
          className={`w-full rounded-xl ${accentClasses.btn}`}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add to {kind === "penta" ? "Penta" : "Wa"}
        </Button>
      </div>

      {/* Members list — "you" always first, auto-populated */}
      <div className="space-y-2 mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Group ({composite.totalPeople} including you)
        </p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-xs font-semibold text-foreground flex-1">
            {youMember.name} <span className="text-muted-foreground font-normal">(you)</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {youMember.gates.length}/{canonical.length} {kind === "penta" ? "skills" : "roles"}
          </span>
        </div>
        {others.map((m) => (
          <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-xs font-semibold text-foreground flex-1 truncate">{m.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {m.gates.length}/{canonical.length}
            </span>
            <button
              onClick={() => removeMember(m.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${m.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Composite results */}
      <div className={`p-4 rounded-2xl border ${accentClasses.ring} bg-background/40 space-y-4`}>
        {tooSmall && (
          <p className="text-xs text-amber-600">
            A Penta needs at least 3 people. Add {3 - composite.totalPeople} more.
          </p>
        )}
        {tooLarge && (
          <p className="text-xs text-amber-600">
            That's larger than a Penta (max 5). Switch to the Wa tab.
          </p>
        )}

        {composite.covered.length === canonical.length && !tooSmall && !tooLarge ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✨</div>
            <p className="font-display text-base font-semibold text-foreground mb-1">
              Your {kind === "penta" ? "Penta" : "Wa"} is complete
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All {canonical.length} {kind === "penta" ? "skills" : "roles"} are covered by
              the group. The field is whole.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Covered {kind === "penta" ? "skills" : "roles"} ({composite.covered.length}/{canonical.length})
            </p>
            {composite.covered.length === 0 ? (
              <p className="text-xs text-foreground/60">No one in the group carries these gates yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {composite.covered.map((g) => {
                  const mine = youMember.gates.includes(g);
                  return (
                    <span
                      key={g}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                        mine ? accentClasses.chip : "bg-muted/40 text-foreground/70"
                      }`}
                      title={labelMap[g]}
                    >
                      {g} {labelMap[g]}
                      {mine && " ✦"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          ✦ = a {kind === "penta" ? "Penta skill" : "Wa role"} you personally carry. Each gate is a viable
          trait on its own; in the group it gets activated as a {kind === "penta" ? "skill" : "role"}.
        </p>
      </div>
    </div>
  );
}

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
  const userName: string = profile?.display_name || "You";
  const userGates: number[] = Array.isArray(profile?.defined_gates) ? profile.defined_gates : [];

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
            <h1 className="font-display text-xl font-bold text-foreground">Penta & Wa</h1>
            <p className="text-xs text-muted-foreground">Your energy in small & large groups</p>
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
              Traits → Skills → Roles
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Each gate is a <span className="font-semibold">trait</span>.
            In a <span className="font-semibold">Penta</span> (3–5) it shows as a skill.
            In a <span className="font-semibold">Wa</span> (6+) it shows as a role.
          </p>
          {type && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Your type: {type}
            </div>
          )}
        </motion.div>

        <Tabs defaultValue="penta" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 rounded-2xl">
            <TabsTrigger value="penta" className="rounded-xl">
              <Users className="w-4 h-4 mr-1.5" /> Penta
            </TabsTrigger>
            <TabsTrigger value="wa" className="rounded-xl">
              <UsersRound className="w-4 h-4 mr-1.5" /> Wa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="penta">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
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

              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{guidance.pentaLine}</p>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-2">
                <p className="text-[11px] uppercase tracking-wider text-primary font-medium mb-1">Tip</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{guidance.pentaTip}</p>
              </div>

              <GroupSimulator kind="penta" accent="primary" userName={userName} userGates={userGates} />
            </motion.div>
          </TabsContent>

          <TabsContent value="wa">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                  <UsersRound className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">Wa</h2>
                  <p className="text-xs text-muted-foreground">Large group · teams & communities</p>
                </div>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{guidance.waLine}</p>
              <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-400/20 mb-2">
                <p className="text-[11px] uppercase tracking-wider text-sky-500 font-medium mb-1">Tip</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{guidance.waTip}</p>
              </div>

              <GroupSimulator kind="wa" accent="sky" userName={userName} userGates={userGates} />
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-2xl bg-card/50 border border-border/30 text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            The group only activates the gates it needs. Gates outside the Penta/Wa set are still
            your traits — they just don't get used by the group.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GroupDynamicsPage;
