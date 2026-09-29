import type { ZodError } from "zod";
import type { APIResponse } from "../api/base";
import type {
  AssistantChatMessageWire,
  AssistantChatRequestWire,
  AssistantChatResponseDataWire,
  AssistantFieldWire,
} from "../api/wire";
import { parseMessageWithAction } from "../discord/importSchema";
import { type Message, messageSchema } from "../discord/schema";

// The limits of the API.
const maxMessages = 20;
const maxMessageLength = 4000;

export interface AssistantResult {
  message: string;
  // A request the user can send to make the change the message suggests.
  buildPrompt: string;
  // What the assistant asks the user to fill in.
  fields: AssistantFieldWire[];
  // How often the assistant fixed its own message.
  repairs: number;
  // Problems left with the assistant's message, for the user to fix.
  issues: string[];
}

/**
 * Asks the assistant to change the message and applies the message it answers
 * with. The server has it fix what the plan doesn't allow, and what's left
 * against the editor's schema, like text that's too long, is up to the user.
 */
export async function runAssistantPrompt({
  messages,
  getMessage,
  applyMessage,
  send,
}: {
  // The chat so far, ending with the user's new message.
  messages: AssistantChatMessageWire[];
  getMessage: () => Message;
  applyMessage: (message: Message) => void;
  send: (
    req: AssistantChatRequestWire,
  ) => Promise<APIResponse<AssistantChatResponseDataWire>>;
}): Promise<AssistantResult> {
  const current = getMessage();
  const res = await send({
    message: serializeMessage(current),
    messages: toRequestMessages(messages),
  });
  if (!res.success) {
    throw new Error(res.error.message);
  }

  const issues = [...res.data.issues];
  if (res.data.data) {
    const parsed = parseAnswer(res.data.data);
    if (parsed.message) {
      // Problems the user's message had before are theirs.
      const before = new Set(findIssues(current));
      applyMessage(parsed.message);
      issues.push(...findIssues(getMessage()).filter((i) => !before.has(i)));
    }
    issues.push(...parsed.issues);
  }

  return {
    message: res.data.message,
    buildPrompt: res.data.build_prompt,
    fields: res.data.fields,
    repairs: res.data.repairs,
    issues: [...new Set(issues)],
  };
}

/**
 * The message as the assistant gets it: without the ids the editor gives
 * embeds, fields and components, which it would only copy around and are
 * given again when its answer is read.
 */
export function serializeMessage(message: Message): string {
  return JSON.stringify(message, (key, value) =>
    key === "id" && typeof value === "number" ? undefined : value,
  );
}

/** Reads the message the assistant answered with. */
function parseAnswer(data: string): {
  message: Message | null;
  issues: string[];
} {
  // The server only sends objects, which the lenient schema rarely rejects.
  try {
    return { message: parseMessageWithAction(JSON.parse(data)), issues: [] };
  } catch (err) {
    return { message: null, issues: describeZodError(err as ZodError) };
  }
}

/** The problems with a message that keep it from being sent. */
function findIssues(message: Message): string[] {
  const res = messageSchema.safeParse(message);
  return res.success ? [] : describeZodError(res.error);
}

function describeZodError(error: ZodError) {
  return error.issues.map((issue) =>
    issue.path.length
      ? `${issue.path.join(".")}: ${issue.message}`
      : issue.message,
  );
}

/**
 * Writes the values the user filled in for the assistant's fields as a
 * message, leaving out empty ones.
 */
export function composeFieldAnswers(
  fields: AssistantFieldWire[],
  values: string[],
) {
  return fields
    .map((f, i) => [f.label, values[i]?.trim()])
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");
}

function toRequestMessages(messages: AssistantChatMessageWire[]) {
  return messages
    .slice(-maxMessages)
    .map((m) => ({ ...m, content: m.content.slice(0, maxMessageLength) }));
}
