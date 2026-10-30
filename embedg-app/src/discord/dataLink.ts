import { z } from "zod";
import { parseMessageWithAction } from "./importSchema";

// The format Discohook uses for its ?data= links, so links made for it open here too.
const discohookSchema = z.object({
  messages: z.array(z.object({ data: z.unknown() })).min(1),
});

/**
 * Parses the ?data= param of a message link: URL-safe base64 of UTF-8 JSON. The JSON is a message
 * the way the JSON editor shows it, or Discohook's list of messages. Of those only the first is
 * returned because the editor holds one message at a time.
 */
export function parseDataLink(param: string) {
  // URLSearchParams turns the + of standard base64 into a space.
  const base64 = param.replace(/[ -]/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

  const data = z.record(z.unknown()).parse(JSON.parse(json));

  // A message never has a messages field, so this can't mistake one for the other.
  if ("messages" in data) {
    const { messages } = discohookSchema.parse(data);
    return {
      message: parseMessageWithAction(messages[0].data),
      messageCount: messages.length,
    };
  }

  return { message: parseMessageWithAction(data), messageCount: 1 };
}
