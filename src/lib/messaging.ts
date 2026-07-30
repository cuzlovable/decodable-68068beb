// ============================================================
// Type-Specific Messaging Nudges
// ============================================================

export type EnergyType = "Generator" | "Manifesting Generator" | "Projector" | "Manifestor" | "Reflector";

export type AuthorityType =
  | "Emotional"
  | "Sacral"
  | "Splenic"
  | "Ego Manifested"
  | "Ego Projected"
  | "Self-Projected"
  | "Mental"
  | "Lunar";

/**
 * Get a messaging nudge based on the sender's type messaging a specific receiver type.
 */
export function getMessagingNudge(senderType: EnergyType | null, receiverType: EnergyType | null): string | null {
  if (!senderType || !receiverType) return null;

  const key = `${senderType}->${receiverType}`;

  const nudges: Record<string, string> = {
    // Anyone → Projector
    "Generator->Projector": "Remember to ask them a specific question to invite their guidance.",
    "Manifesting Generator->Projector": "Slow down — ask a specific question to invite their insight.",
    "Manifestor->Projector": "Invite their perspective before informing them of your plans.",
    "Reflector->Projector": "Share what you've been reflecting on — then ask for their read.",
    "Projector->Projector": "Mutual recognition moment — wait for the invitation before offering guidance.",

    // Anyone → Generator / MG
    "Projector->Generator": "Ask them yes/no questions — their sacral responds to direct inquiry.",
    "Projector->Manifesting Generator": "Ask direct questions — but give them space to pivot and correct course.",
    "Manifestor->Generator": "Inform them of your intention, then ask if it lights them up.",
    "Manifestor->Manifesting Generator": "Share your vision — ask if their gut responds with energy.",
    "Generator->Generator": "Share what excites you — mutual sacral buzz is your bonding language.",
    "Generator->Manifesting Generator": "Match their pace — ask what's lighting them up right now.",
    "Manifesting Generator->Generator": "Slow your multi-track mind — check in with a clear yes/no question.",
    "Manifesting Generator->Manifesting Generator":
      "You both move fast — pause to check if you're responding, not reacting.",
    "Reflector->Generator": "Ask about their daily satisfactions — it opens their sacral.",
    "Reflector->Manifesting Generator": "Mirror back what you see in them — then ask a direct question.",

    // Anyone → Manifestor
    "Generator->Manifestor": "Don't take it personally if they inform rather than ask. That's their design.",
    "Manifesting Generator->Manifestor": "Let them initiate — your role is to respond, not lead here.",
    "Projector->Manifestor": "Wait for them to share their vision before offering your guidance.",
    "Manifestor->Manifestor": "Inform each other before acting — mutual respect for independence.",
    "Reflector->Manifestor": "Reflect their impact back to them — they rarely get honest mirrors.",

    // Anyone → Reflector
    "Generator->Reflector": "Give them space and time — don't expect immediate answers.",
    "Manifesting Generator->Reflector": "Slow way down. They need a full lunar cycle to truly know.",
    "Projector->Reflector": "Be patient — they mirror the health of the environment, including you.",
    "Manifestor->Reflector": "Share your intentions gently — they absorb everything deeply.",
    "Reflector->Reflector": "Honor each other's need for space and time. No rushing.",
  };

  return nudges[key] || getGenericNudge(receiverType);
}

function getGenericNudge(receiverType: EnergyType): string {
  switch (receiverType) {
    case "Projector":
      return "Ask a specific question to invite their guidance.";
    case "Generator":
      return "Ask yes/no questions — their sacral knows before their mind.";
    case "Manifesting Generator":
      return "Give space for their multi-passionate nature. Ask direct questions.";
    case "Manifestor":
      return "Let them inform you of their intentions. Don't try to control.";
    case "Reflector":
      return "Be patient and gentle — they need time to process.";
    default:
      return "Be present and authentic in your communication.";
  }
}

/**
 * Get the Unleash Check configuration based on user's authority.
 */
export interface UnleashCheckConfig {
  authority: AuthorityType;
  delayHours: number;
  inputType: "boolean" | "text" | "reflection";
  prompt: string;
  instruction: string;
}

export function getUnleashCheckConfig(authority: string | null): UnleashCheckConfig {
  const auth = (authority || "Sacral") as AuthorityType;

  switch (auth) {
    case "Emotional":
      return {
        authority: auth,
        delayHours: 24,
        inputType: "boolean",
        prompt: "Did you unleash your true self?",
        instruction: "Wait before answering. Your emotional wave needs time to settle for clarity. Come back tomorrow.",
      };
    case "Sacral":
      return {
        authority: auth,
        delayHours: 0,
        inputType: "boolean",
        prompt: "Did you unleash your true self?",
        instruction: "Answer instantly — yes or no. Don't think about it. Your sacral knows.",
      };
    case "Splenic":
      return {
        authority: auth,
        delayHours: 0,
        inputType: "boolean",
        prompt: "Did you unleash your true self?",
        instruction: "Answer based on the first seconds of the meeting. What did your body tell you in that instant?",
      };
    case "Ego Manifested":
      return {
        authority: auth,
        delayHours: 0,
        inputType: "reflection",
        prompt: "Did this interaction honor your willpower?",
        instruction: "Reflect on whether you made promises you can keep. Did your ego feel empowered or diminished?",
      };
    case "Ego Projected":
      return {
        authority: auth,
        delayHours: 0,
        inputType: "reflection",
        prompt: "Did you feel truly seen in this interaction?",
        instruction:
          "Write about whether the other person recognized your value. Did you feel invited to share your gifts?",
      };
    case "Self-Projected":
      return {
        authority: auth,
        delayHours: 0,
        inputType: "text",
        prompt: "Speak your truth about this meeting.",
        instruction:
          "Talk it out — literally say what you feel out loud, then write it down. Your voice reveals your truth.",
      };
    case "Mental":
      return {
        authority: auth,
        delayHours: 0,
        inputType: "text",
        prompt: "What did your sounding board reveal?",
        instruction:
          "Discuss this meeting with a trusted friend first. Then write down what you heard yourself say about it.",
      };
    case "Lunar":
      return {
        authority: auth,
        delayHours: 672, // ~28 days
        inputType: "reflection",
        prompt: "After a full lunar cycle, how do you feel about this connection?",
        instruction:
          "You need a full 28-day lunar cycle to truly know. Set a reminder and come back when the moon returns.",
      };
    default:
      return {
        authority: "Sacral",
        delayHours: 0,
        inputType: "boolean",
        prompt: "Did you unleash your true self?",
        instruction: "Answer from your gut — yes or no.",
      };
  }
}
