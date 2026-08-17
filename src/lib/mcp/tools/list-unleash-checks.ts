import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_unleash_checks",
  title: "List my Unleash Checks",
  description:
    "List the signed-in user's authority-based Unleash Checks, including when each becomes available, the response, and any reflection.",
  inputSchema: {
    match_id: z.string().uuid().optional().describe("Optional match id to filter by."),
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum checks to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ match_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("unleash_checks")
      .select("id, match_id, authority, available_at, answered_at, response, reflection, unleashed, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (match_id) query = query.eq("match_id", match_id);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { checks: data ?? [] },
    };
  },
});
