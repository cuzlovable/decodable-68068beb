import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "send_message",
  title: "Send a message to a match",
  description: "Send a chat message as the signed-in user in one of their matches.",
  inputSchema: {
    match_id: z.string().uuid().describe("Match id from list_matches."),
    content: z.string().trim().min(1).max(2000).describe("Message text to send."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ match_id, content }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id, sender_id: ctx.getUserId(), content })
      .select("id, match_id, content, created_at")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Message sent (${data.id}).` }],
      structuredContent: { message: data },
    };
  },
});
