import {
  COMPONENTS_V2_FLAG,
  type Message,
  messageSchema,
} from "../discord/schema";
import type { MessageAttachment } from "../state/attachments";

/** Whether any component, however deep, is one only the bot can handle. */
export function hasInteractiveComponents(components: unknown): boolean {
  if (!Array.isArray(components)) return false;

  return components.some((component) => {
    if (!component || typeof component !== "object") return false;
    const c = component as Record<string, unknown>;

    if (c.type === 3) return true;
    if (c.type === 2 && c.style !== 5) return true;

    return (
      hasInteractiveComponents(c.components) ||
      hasInteractiveComponents(c.accessory ? [c.accessory] : [])
    );
  });
}

export interface SendCheck {
  mode: "webhook" | "channel";
  fluxer?: boolean;
  edit: boolean;
}

/**
 * Why a message can't go out as it is, the same checks the send menu runs on
 * the message in the editor, for the ones in other tabs.
 */
export function messageSendIssue(
  message: Message,
  attachments: MessageAttachment[],
  { mode, fluxer, edit }: SendCheck,
): string | null {
  if (!messageSchema.safeParse(message).success) {
    return "has errors to fix before it can be sent";
  }

  const componentsV2 = ((message.flags ?? 0) & COMPONENTS_V2_FLAG) !== 0;
  const pollSent = !!message.poll && !componentsV2;

  if (!edit && !fluxer && pollSent && attachments.length > 0) {
    return "has both a poll and attachments, which Discord doesn't allow";
  }

  if (mode === "webhook") {
    if (fluxer && (componentsV2 || message.components.length > 0)) {
      return "has components, which Fluxer doesn't support";
    }
    if (fluxer && message.poll) {
      return "has a poll, which Fluxer doesn't support";
    }
    if (!fluxer && hasInteractiveComponents(message.components)) {
      return "has buttons with actions or select menus, which only the bot can send";
    }
  }

  return null;
}
