import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, UsersRound, Sparkles, Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  CENTERS,
  UNIQUE_CHANNELS,
  getDefinedCenters,
  type CenterId,
} from "@/lib/humandesign";

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
  Generator: {
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

// Demo "your" gates — would come from your calculated chart in production
const YOUR_DEMO_GATES = [64, 47, 17, 62, 31, 7, 1, 8, 15, 5, 14, 2, 34, 57, 20];

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

function GroupSimulator({ kind, accent }: { kind: "penta" | "wa"; accent: "primary" | "sky" }) {
  const maxMembers = kind === "penta" ? 4 : 30; // Penta = self + 4 others, Wa = larger
  const minTotal = kind === "penta" ? 3 : 6;
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [gateInput, setGateInput] = useState("");

  const addMember = () => {
    const gates = parseGates(gateInput);
    if (!name.trim() || gates.length === 0) return;
    if (members.length >= maxMembers) return;
    setMembers((m) => [...m, { id: crypto.randomUUID(), name: name.trim(), gates }]);
    setName("");
    setGateInput("");
  };

  const removeMember = (id: string) => setMembers((m) => m.filter((x) => x.id !== id));

  // Composite calculation: you + all members
  const composite = useMemo(() => {
    const all = new Set<number>(YOUR_DEMO_GATES);
    members.forEach((m) => m.gates.forEach((g) => all.add(g)));
    const allGates = Array.from(all);

    // New channels = active in group but not in your solo chart
    const yourSet = new Set(YOUR_DEMO_GATES);
    const allSet = all;
    const groupChannels = UNIQUE_CHANNELS.filter(
      (ch) => allSet.has(ch.gates[0]) && allSet.has(ch.gates[1])
    );
    const newChannels = groupChannels.filter(
      (ch) => !(yourSet.has(ch.gates[0]) && yourSet.has(ch.gates[1]))
    );

    const definedCenters = getDefinedCenters(allGates);
    const yourDefined = getDefinedCenters(YOUR_DEMO_GATES);
    const newDefined: CenterId[] = (Object.keys(CENTERS) as CenterId[]).filter(
      (c) => definedCenters.has(c) && !yourDefined.has(c)
    );

    return {
      totalPeople: members.length + 1,
      totalGates: allGates.length,
      groupChannels,
      newChannels,
      definedCenters: Array.from(definedCenters),
      newDefined,
    };
  }, [members]);

  const valid = composite.totalPeople >= minTotal;
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
        Add the other members' defined gates to see which new channels form between you and which
        centers the group lights up together.
        {kind === "penta" ? " (Penta = 3–5 people total)" : " (Wa = 6+ people)"}
      </p>

      {/* Add member form */}
      <div className="space-y-2 mb-4">
        <Input
          placeholder="Member name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
        />
        <Input
          placeholder="Their defined gates (e.g. 34, 57, 10, 20)"
          value={gateInput}
          onChange={(e) => setGateInput(e.target.value)}
          className="rounded-xl font-mono text-xs"
        />
        <Button
          onClick={addMember}
          disabled={!name.trim() || parseGates(gateInput).length === 0 || members.length >= maxMembers}
          className={`w-full rounded-xl ${accentClasses.btn}`}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add to {kind === "penta" ? "Penta" : "Wa"}
        </Button>
      </div>

      {/* Members list */}
      {members.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Group ({composite.totalPeople} including you)
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-xs font-semibold text-foreground flex-1">You</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {YOUR_DEMO_GATES.length} gates
            </span>
          </div>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-xs font-semibold text-foreground flex-1 truncate">{m.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{m.gates.length} gates</span>
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
      )}

      {/* Composite results */}
      {members.length > 0 && (
        <div className={`p-4 rounded-2xl border ${accentClasses.ring} bg-background/40 space-y-4`}>
          {tooSmall && (
            <p className="text-xs text-amber-600">
              A Penta needs at least 3 people. Add {3 - composite.totalPeople} more.
            </p>
          )}
          {tooLarge && (
            <p className="text-xs text-amber-600">
              That's larger than a Penta (max 5). Consider switching to the Wa tab.
            </p>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Channels formed in the group
            </p>
            {composite.groupChannels.length === 0 ? (
              <p className="text-xs text-foreground/60">No channels form yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {composite.groupChannels.map((ch) => {
                  const isNew = composite.newChannels.some((n) => n.id === ch.id);
                  return (
                    <span
                      key={ch.id}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                        isNew ? accentClasses.chip : "bg-muted/40 text-foreground/70"
                      }`}
                      title={ch.theme}
                    >
                      {ch.gates[0]}–{ch.gates[1]} {ch.name}
                      {isNew && " ✦"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Centers defined together ({composite.definedCenters.length}/9)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {composite.definedCenters.map((c) => {
                const isNew = composite.newDefined.includes(c);
                return (
                  <span
                    key={c}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      isNew ? accentClasses.chip : "bg-muted/40 text-foreground/70"
                    }`}
                  >
                    {CENTERS[c].label}
                    {isNew && " ✦"}
                  </span>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            ✦ = newly formed by the group. The {kind === "penta" ? "Penta" : "Wa"} uses these to
            shape its collective skill set — even gates you don't carry can light up through others.
          </p>
        </div>
      )}
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
            become <span className="font-semibold">roles</span>.
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

              <Field label="Your skill in a Penta" value={guidance.pentaRole} />
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{guidance.pentaSkills}</p>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[11px] uppercase tracking-wider text-primary font-medium mb-1">Tip</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{guidance.pentaTip}</p>
              </div>

              <GroupSimulator kind="penta" accent="primary" />
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
                  <p className="text-xs text-muted-foreground">Large group · teams, rooms, communities</p>
                </div>
              </div>

              <Field label="Your role in a Wa" value={guidance.waRole} />
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{guidance.waPresence}</p>
              <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-400/20">
                <p className="text-[11px] uppercase tracking-wider text-sky-500 font-medium mb-1">Tip</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{guidance.waTip}</p>
              </div>

              <GroupSimulator kind="wa" accent="sky" />
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
            The group takes only what it needs — channels outside your assigned skill set aren't
            used while you're inside the {`Penta or Wa`}.
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
