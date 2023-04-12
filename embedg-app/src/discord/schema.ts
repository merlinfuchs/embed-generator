import { z } from "zod";
import { getUniqueId } from "../util";

export const uniqueIdSchema = z.number();

export type UniqueId = z.infer<typeof uniqueIdSchema>;

export const embedFooterTextSchema = z.string().max(2048);

export type EmbedFooterText = z.infer<typeof embedFooterTextSchema>;

export const embedFooterIconUrlSchema = z.optional(z.string().url());

export type EmbedFooterIconUrl = z.infer<typeof embedFooterIconUrlSchema>;

export const embedFooterSchema = z.optional(
  z.object({
    text: embedFooterTextSchema,
    icon_url: embedFooterIconUrlSchema,
  })
);

export type EmbedFooter = z.infer<typeof embedFooterSchema>;

export const embedImageUrlSchema = z.string().url();

export type EmbedImageUrl = z.infer<typeof embedImageUrlSchema>;

export const embedImageSchema = z.optional(
  z.object({
    url: embedImageUrlSchema,
  })
);

export type EmbedImage = z.infer<typeof embedImageSchema>;

export const embedThumbnailUrlSchema = z.string().url();

export type EmbedThumbnailUrl = z.infer<typeof embedThumbnailUrlSchema>;

export const embedThumbnailSchema = z.optional(
  z.object({
    url: embedThumbnailUrlSchema,
  })
);

export type EmbedThumbnail = z.infer<typeof embedThumbnailSchema>;

export const embedAuthorNameSchema = z.optional(z.string());

export type EmbedAuthorName = z.infer<typeof embedAuthorNameSchema>;

export const embedAuthorUrlSchema = z.optional(z.string().url());

export type EmbedAuthorUrl = z.infer<typeof embedAuthorUrlSchema>;

export const embedAuthorIconUrlSChema = z.optional(z.string().url());

export type EmbedAuthorIconUrl = z.infer<typeof embedAuthorIconUrlSChema>;

export const embedAuthorSchema = z.optional(
  z.object({
    name: embedAuthorNameSchema,
    url: embedAuthorUrlSchema,
    icon_url: embedAuthorIconUrlSChema,
  })
);

export type EmbedAuthor = z.infer<typeof embedAuthorSchema>;

export const embedFieldNameSchema = z.string().max(256);

export type EmbedFieldName = z.infer<typeof embedFieldNameSchema>;

export const embedFieldValueSchema = z.string().max(1024);

export type EmbedFieldValue = z.infer<typeof embedFieldValueSchema>;

export const embedFieldInlineSchma = z.optional(z.boolean());

export type EmbedFieldInline = z.infer<typeof embedFieldInlineSchma>;

export const embedFieldSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  name: embedFieldNameSchema,
  value: embedFieldValueSchema,
  inline: embedFieldInlineSchma,
});

export type EmbedField = z.infer<typeof embedFieldSchema>;

export const embedtitleSchema = z.optional(z.string().max(256));

export type EmbedTitle = z.infer<typeof embedtitleSchema>;

export const embedDescriptionSchema = z.optional(z.string().max(4096));

export type EmbedDescription = z.infer<typeof embedDescriptionSchema>;

export const embedUrlSchema = z.optional(z.string().url());

export type EmbedUrl = z.infer<typeof embedUrlSchema>;

export const embedTimestamp = z.optional(z.string());

export type EmbedTimestamp = z.infer<typeof embedTimestamp>;

export const embedColor = z.optional(z.number());

export type EmbedColor = z.infer<typeof embedColor>;

export const embedSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  title: embedtitleSchema,
  description: embedDescriptionSchema,
  url: embedUrlSchema,
  timestamp: embedTimestamp,
  color: embedColor,
  footer: embedFooterSchema,
  author: embedAuthorSchema,
  image: embedImageSchema,
  thumbnail: embedThumbnailSchema,
  fields: z.array(embedFieldSchema).default([]),
});

export type MessageEmbed = z.infer<typeof embedSchema>;

export const buttonSchema = z.object({
  type: z.literal(2).or(z.literal(3)),
  style: z.literal(1).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)),
  label: z.optional(z.string()),
});

export type MessageComponentButton = z.infer<typeof buttonSchema>;

export const actionRowSchema = z.object({
  type: z.literal(1),
  components: z.array(buttonSchema).min(1).max(5),
});

export type MessageComponentActionRow = z.infer<typeof actionRowSchema>;

export const messageContentSchema = z.string().max(2000);

export type MessageContent = z.infer<typeof messageContentSchema>;

export const webhookUsernameSchema = z.optional(z.string().max(80));

export type WebhookUsername = z.infer<typeof webhookUsernameSchema>;

export const webhookAvatarUrlSchema = z.optional(z.string().url());

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

export const messageThreadName = z.optional(z.string().max(100));

export const messageSchema = z.object({
  content: messageContentSchema.default(""),
  username: webhookUsernameSchema,
  avatar_url: webhookAvatarUrlSchema,
  tts: messageTtsSchema.default(false),
  embeds: z.array(embedSchema).default([]),
  allowed_mentions: messageAllowedMentionsSchema,
  components: z.array(actionRowSchema).default([]),
  thread_name: messageThreadName,
});

export type Message = z.infer<typeof messageSchema>;
