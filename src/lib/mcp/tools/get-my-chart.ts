import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_chart",
  title: "Get my Human Design chart",
  description:
    "Return the signed-in user's Human Design profile: energy type, strategy, authority, profile, definition, incarnation cross, defined centers and gates, PHS variables, and nodal environments.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "display_name, energy_type, strategy, authority, profile, definition, signature, not_self_theme, incarnation_cross, defined_centers, defined_gates, variables, south_node_gate, north_node_gate, south_node_environment, north_node_environment, birth_location, onboarding_completed",
      )
      .eq("user_id", ctx.getUserId())
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No chart yet — complete onboarding in the app first." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { chart: data },
    };
  },
});
