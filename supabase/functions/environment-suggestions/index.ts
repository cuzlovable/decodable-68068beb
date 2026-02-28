import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Human Design Environment descriptions for Gemini context
const ENVIRONMENT_CONTEXT: Record<string, string> = {
  Kitchens:
    "High-activity spaces centered around food, warmth, and communal gathering. Culinary workshops, busy cafés, farmers markets, food trucks, communal kitchens.",
  Markets:
    "Bustling exchange environments—bazaars, flea markets, shopping districts, trade shows, co-working hubs with high foot traffic.",
  Caves:
    "Enclosed, private, protective spaces. Libraries, private studios, underground venues, cozy reading nooks, home offices with minimal windows.",
  Valleys:
    "Low-elevation, open, fertile landscapes. Parks in valley areas, riverside paths, botanical gardens, meadows, lowland hiking trails.",
  Mountains:
    "Elevated, expansive vantage points. Rooftop bars, hilltop parks, mountain trails, observation decks, high-floor workspaces.",
  Shores:
    "Transitional zones between water and land. Beaches, lakefront paths, riverside promenades, harbor cafés, coastal cliffs.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      environment,
      latitude,
      longitude,
      birthDate,
      southNodeGate,
      northNodeGate,
      southNodeEnvironment,
      northNodeEnvironment,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!environment || !latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "environment, latitude, and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chiron Return detection (age 48-52)
    let chironContext = "";
    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      const age = now.getFullYear() - birth.getFullYear();
      if (age >= 48 && age <= 52) {
        chironContext = `
CHIRON RETURN ALERT: This user is ${age} years old, in their Chiron Return window (48-52). 
This is a major life purpose transition. Prioritize locations that support deep transformation.
South Node Gate: ${southNodeGate || "unknown"} (what they're moving away from)
North Node Gate: ${northNodeGate || "unknown"} (what they're moving toward)
South Node Environment: ${southNodeEnvironment || "unknown"}
North Node Environment: ${northNodeEnvironment || "unknown"}
Emphasize North Node Environment locations for this user's life purpose shift.`;
      }
    }

    const envDescription = ENVIRONMENT_CONTEXT[environment] || environment;

    const systemPrompt = `You are an expert Human Design Environment advisor. Your job is to suggest real, specific types of locations near the user's GPS coordinates that align with their Design Variable Environment.

The user's Environment is "${environment}": ${envDescription}

${chironContext}

Rules:
- Suggest 5-7 specific types of locations that match their environment
- For each location, provide: name/type, why it aligns with their environment, and a practical tip
- Consider the user's approximate area (lat: ${latitude}, lng: ${longitude}) for regional relevance
- Be specific and actionable, not generic
- If in Chiron Return, weave in North Node transition themes

Respond using the suggest_locations tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Find locations matching my "${environment}" environment near coordinates (${latitude}, ${longitude}). ${chironContext ? "I am in my Chiron Return — emphasize transformation." : ""}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_locations",
              description: "Return environment-aligned location suggestions",
              parameters: {
                type: "object",
                properties: {
                  chironReturn: {
                    type: "boolean",
                    description: "Whether the user is in their Chiron Return window",
                  },
                  chironMessage: {
                    type: "string",
                    description: "A personalized Chiron Return message if applicable, otherwise empty",
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Location type or name" },
                        category: {
                          type: "string",
                          enum: ["food", "nature", "wellness", "social", "creative", "work", "spiritual"],
                        },
                        reason: { type: "string", description: "Why this aligns with their environment" },
                        tip: { type: "string", description: "Practical tip for visiting" },
                        nodalAlignment: {
                          type: "string",
                          description: "How this relates to their nodal transition, if in Chiron Return",
                        },
                      },
                      required: ["name", "category", "reason", "tip"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["chironReturn", "chironMessage", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_locations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("environment-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
