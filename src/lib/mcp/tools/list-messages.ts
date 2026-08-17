import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_messages",
  title: "List messages in a match",
  description: "Read the conversation for one of the signed-in user's matches, oldest message first.",
  inputSchema: {
    match_id: z.string().uuid().describe("Match id from list_matches."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum messages to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ match_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("match_id", match_id)
      .order("created_at", { ascending: true })
      .limit(limit ?? 50);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const items = (data ?? []).map((m) => ({
      ...m,
      from_me: m.sender_id === ctx.getUserId(),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { messages: items },
    };
  },
});
