import type { Message } from "./schema";

type Json = Record<string, unknown>;

function withoutId({ id: _, ...rest }: Json): Json {
  return rest;
}

function exportComponent(component: Json): Json {
  const out = { ...component };
  if (Array.isArray(out.components)) {
    out.components = out.components.map(exportComponent);
  }
  if (out.accessory) out.accessory = exportComponent(out.accessory as Json);
  if (Array.isArray(out.options)) out.options = out.options.map(withoutId);
  if (Array.isArray(out.items)) out.items = out.items.map(withoutId);
  return out;
}

/**
 * The message as JSON for other tools. The editor numbers embeds, fields, select options and
 * gallery items to tell them apart, but Discord has no `id` on those. Components keep theirs:
 * Discord takes an `id` on every component.
 */
export function exportMessage(message: Message): Json {
  return {
    ...message,
    embeds: message.embeds?.map((embed) => ({
      ...withoutId(embed),
      fields: embed.fields?.map(withoutId),
    })),
    components: message.components?.map((c) => exportComponent(c as Json)),
  };
}
