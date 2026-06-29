import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getMessagingNudge, EnergyType } from "@/lib/messaging";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("Match");
  const [partnerType, setPartnerType] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      // Check if demo match
      if (matchId?.startsWith("demo-")) {
        setIsDemo(true);
        // Load user's profile for nudge generation
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("energy_type")
          .eq("user_id", session.user.id)
          .single();

        // Demo partner info
        const demoPartners: Record<string, { name: string; type: EnergyType; profile: string; opener: string }> = {
          "demo-match-1": {
            name: "Luna", type: "Projector", profile: "4/6",
            opener: "Okay, your energy reads so steady — I had to say hi. What's been quietly lighting you up lately?",
          },
          "demo-match-2": {
            name: "Orion", type: "Generator", profile: "1/3",
            opener: "Your profile made me smile. What's a small thing that's actually made your week feel good?",
          },
          "demo-match-3": {
            name: "Celeste", type: "Manifesting Generator", profile: "3/5",
            opener: "You look like someone juggling five exciting things at once — which one's winning right now?",
          },
          "demo-match-4": {
            name: "Atlas", type: "Manifestor", profile: "5/1",
            opener: "Straight up — your vibe caught me. What are you building or chasing these days?",
          },
        };
        const partner = demoPartners[matchId || ""] || demoPartners["demo-match-1"];
        setPartnerName(partner.name);
        setPartnerType(partner.type);
        setPartnerProfile(partner.profile);

        const n = getMessagingNudge(
          (myProfile?.energy_type as EnergyType) || "Generator",
          partner.type
        );
        setNudge(n);

        // Demo messages
        setMessages([
          {
            id: "demo-msg-1",
            sender_id: "other",
            content: partner.opener,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
        return;
      }

      // Real match: load partner + messages
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match) { navigate("/matches"); return; }

      const partnerId = match.user_a === session.user.id ? match.user_b : match.user_a;

      const [{ data: myProfile }, { data: theirProfile }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("energy_type").eq("user_id", session.user.id).single(),
        supabase.from("profiles").select("display_name, energy_type, profile, authority").eq("user_id", partnerId).single(),
        supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true }),
      ]);

      setPartnerName(theirProfile?.display_name || "Match");
      setPartnerType(theirProfile?.energy_type || null);
      setPartnerProfile(theirProfile?.profile || null);
      setMessages(msgs || []);

      const n = getMessagingNudge(
        (myProfile?.energy_type as EnergyType) || null,
        (theirProfile?.energy_type as EnergyType) || null
      );
      setNudge(n);

      // Realtime subscription
      const channel = supabase
        .channel(`messages-${matchId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    load();
  }, [matchId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    if (isDemo) {
      // Demo mode: local only
      setMessages((prev) => [
        ...prev,
        {
          id: `demo-${Date.now()}`,
          sender_id: userId || "me",
          content: input.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setInput("");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      content: input.trim(),
    });
    if (!error) setInput("");
    setSending(false);
  };

  return (
    <div className="min-h-screen gradient-celestial flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/matches">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-9 h-9 rounded-full gradient-aura flex items-center justify-center shrink-0">
            <span className="font-display text-sm font-bold text-primary-foreground">
              {partnerName[0]}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground truncate">
              {partnerName}
            </h2>
            <p className="text-[11px] text-primary font-medium">
              {partnerProfile} {partnerType}
            </p>
          </div>
          <Link to={`/unleash/${matchId}`} className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Unleash Check
            </Button>
          </Link>
        </div>
      </div>

      {/* Nudge Banner */}
      <AnimatePresence>
        {nudge && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/10">
              <div className="max-w-lg mx-auto flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed">{nudge}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.map((msg) => {
            const isMine = msg.sender_id === userId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "gradient-aura text-primary-foreground rounded-br-md"
                      : "bg-card border border-border/50 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-background border-border/50"
            maxLength={1000}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="rounded-xl gradient-aura text-primary-foreground shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
