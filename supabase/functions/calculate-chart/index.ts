import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { birth_date, birth_time, birth_location, latitude, longitude } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are an expert Human Design analyst with deep knowledge of the Rave I'Ching and Jovian Archive system. Given the following birth data, calculate the Human Design chart properties.

Birth Date: ${birth_date}
Birth Time: ${birth_time}
Birth Location: ${birth_location} (Lat: ${latitude}, Lon: ${longitude})

You MUST return a JSON object using the tool provided. Calculate accurately based on the Sun's position at birth to determine the Personality Sun Gate, and 88 degrees of the Sun before birth for the Design Sun Gate. Use standard Human Design gate/line calculations.

Important rules:
- energy_type must be one of: "Generator", "Manifesting Generator", "Projector", "Manifestor", "Reflector"
- authority must be one of: "Emotional", "Sacral", "Splenic", "Ego Projected", "Self-Projected", "Mental/Environmental", "Lunar"
- profile must be in format like "1/3", "4/6", "2/4", etc. (valid profiles: 1/3, 1/4, 2/4, 2/5, 3/5, 3/6, 4/6, 4/1, 5/1, 5/2, 6/2, 6/3)
- defined_gates should be an array of gate numbers (1-64) that are activated in either Personality or Design
- north_node_gate and south_node_gate should be the gate numbers for the North and South nodes
- north_node_environment and south_node_environment should be one of: "Caves", "Markets", "Kitchens", "Mountains", "Valleys", "Shores"
- variables should include the 4 Variable arrows: digestion, environment, awareness, perspective (each "Left" or "Right")`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise Human Design chart calculator. Always use the tool to return structured data." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_chart",
              description: "Return the calculated Human Design chart data",
              parameters: {
                type: "object",
                properties: {
                  energy_type: { type: "string", enum: ["Generator", "Manifesting Generator", "Projector", "Manifestor", "Reflector"] },
                  authority: { type: "string", enum: ["Emotional", "Sacral", "Splenic", "Ego Projected", "Self-Projected", "Mental/Environmental", "Lunar"] },
                  profile: { type: "string", enum: ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"] },
                  defined_gates: { type: "array", items: { type: "integer", minimum: 1, maximum: 64 } },
                  north_node_gate: { type: "integer", minimum: 1, maximum: 64 },
                  south_node_gate: { type: "integer", minimum: 1, maximum: 64 },
                  north_node_environment: { type: "string", enum: ["Caves", "Markets", "Kitchens", "Mountains", "Valleys", "Shores"] },
                  south_node_environment: { type: "string", enum: ["Caves", "Markets", "Kitchens", "Mountains", "Valleys", "Shores"] },
                  variables: {
                    type: "object",
                    properties: {
                      digestion: { type: "string", enum: ["Left", "Right"] },
                      environment: { type: "string", enum: ["Left", "Right"] },
                      awareness: { type: "string", enum: ["Left", "Right"] },
                      perspective: { type: "string", enum: ["Left", "Right"] },
                    },
                    required: ["digestion", "environment", "awareness", "perspective"],
                  },
                },
                required: ["energy_type", "authority", "profile", "defined_gates", "north_node_gate", "south_node_gate", "north_node_environment", "south_node_environment", "variables"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_chart" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const chart = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(chart), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calculate-chart error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
