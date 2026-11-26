import { z } from "zod";

/** The fields of the embed link tool, as its JSON code shows them. */
export interface EmbedLinkFields {
  url: string;
  title: string;
  description: string;
  color: number | undefined;
  image_url: string;
  large_image: boolean;
  provider: { name: string; url: string };
  author: { name: string; url: string };
  /** The custom component, a container, or null when it's turned off. */
  component: unknown;
}

const text = z.preprocess((d) => d ?? undefined, z.string().default(""));

const nameAndUrl = z.preprocess(
  (d) => d ?? undefined,
  z.object({ name: text, url: text }).default({ name: "", url: "" }),
);

/**
 * Lenient like the message import: missing fields become empty, so a link
 * can be pasted back with only the parts that matter.
 */
const embedLinkSchema = z.object({
  url: text,
  title: text,
  description: text,
  color: z.preprocess(
    (d) =>
      typeof d === "string" ? Number.parseInt(d.replace("#", ""), 16) : d,
    z.optional(z.nullable(z.number().int().min(0).max(0xffffff))),
  ),
  image_url: text,
  large_image: z.preprocess((d) => d ?? undefined, z.boolean().default(true)),
  provider: nameAndUrl,
  author: nameAndUrl,
  component: z.preprocess((d) => d ?? null, z.unknown()),
});

export function embedLinkToJson(fields: EmbedLinkFields): string {
  return JSON.stringify({ ...fields, color: fields.color ?? null }, null, 2);
}

/** Throws when the JSON is invalid or doesn't describe an embed link. */
export function parseEmbedLinkJson(raw: string): EmbedLinkFields {
  const data = embedLinkSchema.parse(JSON.parse(raw));
  return {
    ...data,
    color: data.color ?? undefined,
    component: data.component ?? null,
  };
}
