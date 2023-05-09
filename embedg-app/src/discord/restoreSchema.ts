import { z } from "zod";
import { getUniqueId } from "../util";

export const uniqueIdSchema = z.number();

export type UniqueId = z.infer<typeof uniqueIdSchema>;

export const embedFooterTextSchema = z.optional(z.string());

export type EmbedFooterText = z.infer<typeof embedFooterTextSchema>;

export const embedFooterIconUrlSchema = z.optional(z.string());

export type EmbedFooterIconUrl = z.infer<typeof embedFooterIconUrlSchema>;

export const embedFooterSchema = z.optional(
  z.object({
    text: embedFooterTextSchema,
    icon_url: embedFooterIconUrlSchema,
  })
);

export type EmbedFooter = z.infer<typeof embedFooterSchema>;

export const embedImageUrlSchema = z.optional(z.string());

export type EmbedImageUrl = z.infer<typeof embedImageUrlSchema>;

export const embedImageSchema = z.optional(
  z.object({
    url: embedImageUrlSchema,
  })
);

export type EmbedImage = z.infer<typeof embedImageSchema>;

export const embedThumbnailUrlSchema = z.optional(z.string());

export type EmbedThumbnailUrl = z.infer<typeof embedThumbnailUrlSchema>;

export const embedThumbnailSchema = z.optional(
  z.object({
    url: embedThumbnailUrlSchema,
  })
);

export type EmbedThumbnail = z.infer<typeof embedThumbnailSchema>;

export const embedAuthorNameSchema = z.string();

export type EmbedAuthorName = z.infer<typeof embedAuthorNameSchema>;

export const embedAuthorUrlSchema = z.optional(z.string());

export type EmbedAuthorUrl = z.infer<typeof embedAuthorUrlSchema>;

export const embedAuthorIconUrlSchema = z.optional(z.string());

export type EmbedAuthorIconUrl = z.infer<typeof embedAuthorIconUrlSchema>;

export const embedAuthorSchema = z.optional(
  z.object({
    name: embedAuthorNameSchema,
    url: embedAuthorUrlSchema,
    icon_url: embedAuthorIconUrlSchema,
  })
);

export type EmbedAuthor = z.infer<typeof embedAuthorSchema>;

export const embedFieldNameSchema = z.string();

export type EmbedFieldName = z.infer<typeof embedFieldNameSchema>;

export const embedFieldValueSchema = z.string();

export type EmbedFieldValue = z.infer<typeof embedFieldValueSchema>;

export const embedFieldInlineSchma = z.optional(z.boolean());

export type EmbedFieldInline = z.infer<typeof embedFieldInlineSchma>;

export const embedFieldSchema = z.object({
  id: z.preprocess(
    (d) => d ?? undefined,
    uniqueIdSchema.default(() => getUniqueId())
  ),
  name: embedFieldNameSchema,
  value: embedFieldValueSchema,
  inline: embedFieldInlineSchma,
});

export type EmbedField = z.infer<typeof embedFieldSchema>;

export const embedtitleSchema = z.optional(z.string());

export type EmbedTitle = z.infer<typeof embedtitleSchema>;

export const embedDescriptionSchema = z.optional(z.string());

export type EmbedDescription = z.infer<typeof embedDescriptionSchema>;

export const embedUrlSchema = z.optional(z.string());

export type EmbedUrl = z.infer<typeof embedUrlSchema>;

export const embedTimestampSchema = z.optional(z.string());

export type EmbedTimestamp = z.infer<typeof embedTimestampSchema>;

export const embedColor = z.optional(z.number());

export type EmbedColor = z.infer<typeof embedColor>;

export const embedSchema = z.object({
  id: z.preprocess(
    (d) => d ?? undefined,
    uniqueIdSchema.default(() => getUniqueId())
  ),
  title: embedtitleSchema,
  description: embedDescriptionSchema,
  url: embedUrlSchema,
  timestamp: embedTimestampSchema,
  color: embedColor,
  footer: embedFooterSchema,
  author: embedAuthorSchema,
  image: embedImageSchema,
  thumbnail: embedThumbnailSchema,
  fields: z.preprocess(
    (d) => d ?? undefined,
    z.array(embedFieldSchema).default([])
  ),
});

export type MessageEmbed = z.infer<typeof embedSchema>;

export const buttonStyleSchema = z
  .literal(1)
  .or(z.literal(2))
  .or(z.literal(3))
  .or(z.literal(4))
  .or(z.literal(5));

export type MessageComponentButtonStyle = z.infer<typeof buttonStyleSchema>;

export const buttonSchema = z.object({
  id: z.preprocess(
    (d) => d ?? undefined,
    uniqueIdSchema.default(() => getUniqueId())
  ),
  type: z.literal(2),
  style: buttonStyleSchema,
  label: z.string(),
  url: z.optional(z.string()),
  action_set_id: z.preprocess(
    (d) => d ?? undefined,
    z.string().default(() => getUniqueId().toString())
  ),
});

export type MessageComponentButton = z.infer<typeof buttonSchema>;

export const selectMenuOptionSchema = z.object({
  id: z.preprocess(
    (d) => d ?? undefined,
    uniqueIdSchema.default(() => getUniqueId())
  ),
  label: z.string(),
  action_set_id: z.preprocess(
    (d) => d ?? undefined,
    z.string().default(() => getUniqueId().toString())
  ),
});

export type MessageComponentSelectMenuOption = z.infer<
  typeof selectMenuOptionSchema
>;

export const selectMenuSchema = z.object({
  id: z.preprocess(
    (d) => d ?? undefined,
    uniqueIdSchema.default(() => getUniqueId())
  ),
  type: z.literal(3),
  placeholder: z.optional(z.string()),
  options: z.array(selectMenuOptionSchema),
});

export type MessageComponentSelectMenu = z.infer<typeof selectMenuSchema>;

export const actionRowSchema = z.object({
  id: z.preprocess(
    (d) => d ?? undefined,
    uniqueIdSchema.default(() => getUniqueId())
  ),
  type: z.literal(1),
  components: z.array(buttonSchema.or(selectMenuSchema)),
});

export type MessageComponentActionRow = z.infer<typeof actionRowSchema>;

export const messageAction = z
  .object({
    type: z.literal(1), // text response
    id: uniqueIdSchema.default(() => getUniqueId()),
    text: z.string(),
  })
  .or(
    z.object({
      type: z.literal(2).or(z.literal(3)).or(z.literal(4)), // toggle, add, remove role
      id: uniqueIdSchema.default(() => getUniqueId()),
      target_id: z.string(),
    })
  );

export type MessageAction = z.infer<typeof messageAction>;

export const messageActionSet = z.object({
  actions: z.array(messageAction),
});

export type MessageActionSet = z.infer<typeof messageActionSet>;

export const messageContentSchema = z.string();

export type MessageContent = z.infer<typeof messageContentSchema>;

export const webhookUsernameSchema = z.optional(z.string());

export type WebhookUsername = z.infer<typeof webhookUsernameSchema>;

export const webhookAvatarUrlSchema = z.optional(z.string());

export type WebhookAvatarUrl = z.infer<typeof webhookAvatarUrlSchema>;

export const messageTtsSchema = z.boolean();

export type MessageTts = z.infer<typeof messageTtsSchema>;

export const messageAllowedMentionsSchema = z.optional(
  z.object({
    parse: z.array(
      z.literal("users").or(z.literal("roles")).or(z.literal("everyone"))
    ),
    roles: z.array(z.string()),
    users: z.array(z.string()),
    replied_user: z.boolean(),
  })
);

export const messageThreadName = z.optional(z.string());

export const messageSchema = z.object({
  content: z.preprocess(
    (d) => d ?? undefined,
    messageContentSchema.default("")
  ),
  username: webhookUsernameSchema,
  avatar_url: webhookAvatarUrlSchema,
  tts: z.preprocess((d) => d ?? undefined, messageTtsSchema.default(false)),
  embeds: z.preprocess((d) => d ?? undefined, z.array(embedSchema).default([])),
  allowed_mentions: messageAllowedMentionsSchema,
  components: z.preprocess(
    (d) => d ?? undefined,
    z.array(actionRowSchema).default([])
  ),
  thread_name: messageThreadName,
  actions: z.preprocess(
    (d) => d ?? undefined,
    z.record(z.string(), messageActionSet).default({})
  ),
});

export type Message = z.infer<typeof messageSchema>;

export function parseMessageWithAction(raw: any) {
  const parsedData = messageSchema.parse(raw);

  // create messing action sets
  for (const row of parsedData.components) {
    for (const comp of row.components) {
      if (comp.type === 2) {
        if (!parsedData.actions[comp.action_set_id]) {
          parsedData.actions[comp.action_set_id] = {
            actions: [],
          };
        }
      } else {
        for (const option of comp.options) {
          if (!parsedData.actions[option.action_set_id]) {
            parsedData.actions[option.action_set_id] = {
              actions: [],
            };
          }
        }
      }
    }
  }

  return parsedData;
}
