import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyChartTool from "./tools/get-my-chart";
import listMatchesTool from "./tools/list-matches";
import listMessagesTool from "./tools/list-messages";
import sendMessageTool from "./tools/send-message";
import listUnleashChecksTool from "./tools/list-unleash-checks";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "auramatch-connect",
  title: "AuraMatch Connect",
  version: "0.1.0",
  instructions:
    "Tools for AuraMatch, a Human Design dating app. Use `get_my_chart` for the signed-in user's Human Design blueprint, `list_matches` for their matches and chemistry themes, `list_messages` / `send_message` for a match conversation, and `list_unleash_checks` for authority-based timing checks. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyChartTool, listMatchesTool, listMessagesTool, sendMessageTool, listUnleashChecksTool],
});
