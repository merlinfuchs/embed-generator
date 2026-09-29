import type { ZodError } from "zod";
import type { APIResponse } from "../api/base";
import type {
  AssistantChatMessageWire,
  AssistantChatRequestWire,
  AssistantChatResponseDataWire,
  AssistantFieldWire,
  GetPremiumPlanFeaturesResponseDataWire,
} from "../api/wire";
import { parseMessageWithAction } from "../discord/importSchema";
import {
  COMPONENTS_V2_FLAG,
  type Message,
  type MessageComponent,
  messageSchema,
} from "../discord/schema";

// The limits of the API.
const maxMessages = 20;
const maxMessageLength = 4000;
const maxIssues = 50;

export type Features = Pick<
  GetPremiumPlanFeaturesResponseDataWire,
  "components_v2" | "component_types" | "max_actions_per_component"
>;

class AssistantError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

export interface AssistantResult {
  message: string;
  // A request the user can send to make the change the message suggests.
  buildPrompt: string;
  // What the assistant asks the user to fill in.
  fields: AssistantFieldWire[];
  // How many rounds of problems the assistant fixed in its own message.
  repairs: number;
  // Problems the assistant couldn't fix, or why it couldn't.
  issues: string[];
}

/**
 * Asks the assistant to change the message and applies the message it answers
 * with. Problems its message caused are sent back to be fixed in repairs, which
 * don't count as prompts, until the API allows no more.
 */
export async function runAssistantPrompt({
  messages,
  features,
  getMessage,
  applyMessage,
  send,
}: {
  // The chat so far, ending with the user's new message.
  messages: AssistantChatMessageWire[];
  features: Features | null;
  getMessage: () => Message;
  applyMessage: (message: Message) => void;
  send: (
    req: AssistantChatRequestWire,
  ) => Promise<APIResponse<AssistantChatResponseDataWire>>;
}): Promise<AssistantResult> {
  const request = async (
    message: Message,
    req: Partial<AssistantChatRequestWire>,
  ) => {
    const res = await send({
      message: serializeMessage(message),
      messages: toRequestMessages(messages),
      repair_prompt_id: "",
      issues: [],
      ...req,
    });
    if (!res.success) {
      throw new AssistantError(res.error.message, res.error.code);
    }
    return res.data;
  };

  // Problems the user's message had before are theirs to fix.
  const before = new Set(findIssues(getMessage(), features));

  let res = await request(getMessage(), {});
  const {
    prompt_id: promptId,
    message,
    build_prompt: buildPrompt,
    fields,
  } = res;
  const result = (repairs: number, issues: string[]): AssistantResult => ({
    message,
    buildPrompt,
    fields,
    repairs,
    issues,
  });
  const repairMessages = toRequestMessages([
    ...messages,
    { role: "assistant", content: message },
  ]);
  // The message as applied, to tell whether the user changed it since.
  let applied: string | undefined;

  for (let repairs = 0; ; repairs++) {
    const current = getMessage();
    if (applied && JSON.stringify(current) !== applied) {
      // The user undid or changed the message, so it isn't fixed anymore.
      return result(repairs, []);
    }

    let issues = [...res.issues];
    let next = current;
    if (res.data) {
      const parsed = parseAnswer(res.data);
      if (parsed.message) {
        applyMessage(parsed.message);
        // Read back, as the editor may have normalized it.
        next = getMessage();
        applied = JSON.stringify(next);
      }
      issues.push(...parsed.issues);
    }
    // Also after a repair that didn't change the message, as what it didn't
    // fix is still there.
    if (applied) {
      issues.push(...findIssues(next, features).filter((i) => !before.has(i)));
    }
    issues = [...new Set(issues)];

    if (issues.length === 0) return result(repairs, []);

    try {
      res = await request(next, {
        messages: repairMessages,
        repair_prompt_id: promptId,
        issues: issues.slice(0, maxIssues),
      });
    } catch (err) {
      if (err instanceof AssistantError && err.code === "repair_limit") {
        return result(repairs, issues);
      }
      return result(repairs, [...issues, (err as Error).message]);
    }
  }
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
  let raw: unknown;
  try {
    raw = JSON.parse(data);
  } catch {
    return { message: null, issues: ["new_message isn't valid JSON."] };
  }

  try {
    return { message: parseMessageWithAction(raw), issues: [] };
  } catch (err) {
    return { message: null, issues: describeZodError(err as ZodError) };
  }
}

/**
 * The problems with a message that keep it from being sent, as the editor
 * shows them, and what the plan doesn't include.
 */
export function findIssues(
  message: Message,
  features: Features | null,
): string[] {
  const res = messageSchema.safeParse(message);
  let issues = res.success ? [] : describeZodError(res.error);

  // Sections the assistant left without an accessory get an empty thumbnail
  // when they are read, and "Invalid URL" doesn't tell it what to do.
  walkComponents(message.components, ["components"], (component, path) => {
    if (
      component.type === 9 &&
      component.accessory.type === 11 &&
      !component.accessory.media.url
    ) {
      const url = `${path}.accessory.media.url`;
      issues = issues.filter((i) => !i.startsWith(`${url}:`));
      issues.push(
        `${path}: A section needs an accessory, a button or a thumbnail with an image URL. Use text displays without a section instead.`,
      );
    }
  });

  if (!features) return issues;

  if ((message.flags ?? 0) & COMPONENTS_V2_FLAG && !features.components_v2) {
    issues.push("flags: The plan doesn't include components v2.");
  }

  const allowed = new Set(features.component_types);
  const actionSetIds = new Map<string, string>();
  walkComponents(message.components, ["components"], (component, path) => {
    if (!allowed.has(component.type)) {
      issues.push(
        `${path}: The plan doesn't include components of type ${component.type}.`,
      );
    }

    const sets: [string, string][] = [];
    if (component.type === 2 && component.style !== 5) {
      sets.push([component.action_set_id, path]);
    }
    if (component.type === 3) {
      component.options.forEach((option, i) => {
        sets.push([option.action_set_id, `${path}.options.${i}`]);
      });
    }
    for (const [id, at] of sets) {
      const other = actionSetIds.get(id);
      if (other) {
        issues.push(
          `${at}: action_set_id "${id}" is also used by ${other}. Give this one its own action_set_id and action set.`,
        );
      }
      actionSetIds.set(id, at);
    }
  });

  for (const [id, set] of Object.entries(message.actions)) {
    if (set.actions.length > features.max_actions_per_component) {
      issues.push(
        `actions.${id}: The plan allows ${features.max_actions_per_component} actions per button or option, not ${set.actions.length}.`,
      );
    }
  }

  return issues;
}

function walkComponents(
  components: MessageComponent[],
  path: string[],
  visit: (component: MessageComponent, path: string) => void,
) {
  components.forEach((component, i) => {
    const at = [...path, String(i)];
    visit(component, at.join("."));
    if (component.type === 9) {
      visit(component.accessory, [...at, "accessory"].join("."));
    }
    if ("components" in component) {
      walkComponents(component.components, [...at, "components"], visit);
    }
  });
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
