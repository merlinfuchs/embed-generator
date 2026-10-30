import { z } from "zod";
import { parseMessageWithAction } from "./importSchema";

// The format Discohook uses for its ?data= links, so links made for it open here too.
const dataLinkSchema = z.object({
  messages: z.array(z.object({ data: z.unknown() })).min(1),
});

/**
 * Parses the ?data= param of a message link: URL-safe base64 of UTF-8 JSON. Only the first
 * message is returned because the editor holds one message at a time.
 */
export function parseDataLink(param: string) {
  const base64 = param
    // URLSearchParams turns the + of standard base64 into a space.
    .replace(/ /g, "+")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

  const { messages } = dataLinkSchema.parse(JSON.parse(json));

  return {
    message: parseMessageWithAction(messages[0].data),
    messageCount: messages.length,
  };
}
