import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_matches",
  title: "List my matches",
  description:
    "List the signed-in user's matches with chemistry score, dominant connection theme, status, and the partner's Human Design basics.",
  inputSchema: {
    status: z.string().trim().min(1).optional().describe("Optional status filter, e.g. 'active'."),
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum matches to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("matches")
      .select("id, chemistry_score, dominant_theme, status, user_a, user_b, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("chemistry_score", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status);

    const { data: matches, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const partnerIds = (matches ?? []).map((m) => (m.user_a === userId ? m.user_b : m.user_a));
    const partners = new Map<string, Record<string, unknown>>();
    if (partnerIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, energy_type, authority, profile")
        .in("user_id", partnerIds);
      for (const p of profiles ?? []) partners.set(p.user_id, p);
    }

    const items = (matches ?? []).map((m) => {
      const partnerId = m.user_a === userId ? m.user_b : m.user_a;
      return {
        match_id: m.id,
        chemistry_score: m.chemistry_score,
        dominant_theme: m.dominant_theme,
        status: m.status,
        created_at: m.created_at,
        partner: partners.get(partnerId) ?? { user_id: partnerId },
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { matches: items },
    };
  },
});
