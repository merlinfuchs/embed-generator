import { z } from "zod";
import { getUniqueId } from "../util";

export const uniqueIdSchema = z.preprocess(
  (d) => {
    if (d === null || typeof d !== "number") {
      return undefined;
    }
    return d;
  },
  z.number().default(() => getUniqueId())
);

export type UniqueId = z.infer<typeof uniqueIdSchema>;

export const embedFooterTextSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedFooterText = z.infer<typeof embedFooterTextSchema>;

export const embedFooterIconUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedFooterIconUrl = z.infer<typeof embedFooterIconUrlSchema>;

export const embedFooterSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(
    z.object({
      text: embedFooterTextSchema,
      icon_url: embedFooterIconUrlSchema,
    })
  )
);

export type EmbedFooter = z.infer<typeof embedFooterSchema>;

export const embedImageUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedImageUrl = z.infer<typeof embedImageUrlSchema>;

export const embedImageSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(
    z.object({
      url: embedImageUrlSchema,
    })
  )
);

export type EmbedImage = z.infer<typeof embedImageSchema>;

export const embedThumbnailUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedThumbnailUrl = z.infer<typeof embedThumbnailUrlSchema>;

export const embedThumbnailSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(
    z.object({
      url: embedThumbnailUrlSchema,
    })
  )
);

export type EmbedThumbnail = z.infer<typeof embedThumbnailSchema>;

export const embedAuthorNameSchema = z.preprocess(
  (d) => d ?? undefined,
  z.string().default("")
);

export type EmbedAuthorName = z.infer<typeof embedAuthorNameSchema>;

export const embedAuthorUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedAuthorUrl = z.infer<typeof embedAuthorUrlSchema>;

export const embedAuthorIconUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedAuthorIconUrl = z.infer<typeof embedAuthorIconUrlSchema>;

export const embedAuthorSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(
    z.object({
      name: embedAuthorNameSchema,
      url: embedAuthorUrlSchema,
      icon_url: embedAuthorIconUrlSchema,
    })
  )
);

export type EmbedAuthor = z.infer<typeof embedAuthorSchema>;

export const embedProviderNameSchema = z.preprocess(
  (d) => d ?? undefined,
  z.string().default("")
);

export type EmbedProviderName = z.infer<typeof embedProviderNameSchema>;

export const embedProviderUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedProviderUrl = z.infer<typeof embedProviderUrlSchema>;

export const embedProviderSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(
    z.object({
      name: embedProviderNameSchema,
      url: embedProviderUrlSchema,
    })
  )
);

export type EmbedProvider = z.infer<typeof embedProviderSchema>;

export const embedFieldNameSchema = z.preprocess(
  (d) => d ?? undefined,
  z.string().default("")
);

export type EmbedFieldName = z.infer<typeof embedFieldNameSchema>;

export const embedFieldValueSchema = z.preprocess(
  (d) => d ?? undefined,
  z.string().default("")
);

export type EmbedFieldValue = z.infer<typeof embedFieldValueSchema>;

export const embedFieldInlineSchma = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.boolean())
);

export type EmbedFieldInline = z.infer<typeof embedFieldInlineSchma>;

export const embedFieldSchema = z.object({
  id: uniqueIdSchema,
  name: embedFieldNameSchema,
  value: embedFieldValueSchema,
  inline: embedFieldInlineSchma,
});

export type EmbedField = z.infer<typeof embedFieldSchema>;

export const embedtitleSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedTitle = z.infer<typeof embedtitleSchema>;

export const embedDescriptionSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedDescription = z.infer<typeof embedDescriptionSchema>;

export const embedUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedUrl = z.infer<typeof embedUrlSchema>;

export const embedTimestampSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type EmbedTimestamp = z.infer<typeof embedTimestampSchema>;

export const embedColor = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.number())
);

export type EmbedColor = z.infer<typeof embedColor>;

export const embedSchema = z.object({
  id: uniqueIdSchema,
  title: embedtitleSchema,
  description: embedDescriptionSchema,
  url: embedUrlSchema,
  timestamp: embedTimestampSchema,
  color: embedColor,
  footer: embedFooterSchema,
  author: embedAuthorSchema,
  provider: embedProviderSchema,
  image: embedImageSchema,
  thumbnail: embedThumbnailSchema,
  fields: z.preprocess(
    (d) => d ?? undefined,
    z.array(embedFieldSchema).default([])
  ),
});

export type MessageEmbed = z.infer<typeof embedSchema>;

export const emojiSchema = z.object({
  id: z.optional(z.string()),
  name: z.preprocess((d) => d ?? undefined, z.string().default("")),
  animated: z.preprocess((d) => d ?? undefined, z.boolean().default(false)),
});

export const unfurledMediaItemSchema = z.object({
  url: z.preprocess((d) => d ?? undefined, z.string().default("")),
});

export type UnfurledMediaItem = z.infer<typeof unfurledMediaItemSchema>;

export type Emoji = z.infer<typeof emojiSchema>;

export const buttonStyleSchema = z
  .literal(1)
  .or(z.literal(2))
  .or(z.literal(3))
  .or(z.literal(4))
  .or(z.literal(5));

export type MessageComponentButtonStyle = z.infer<typeof buttonStyleSchema>;

export const componentButtonSchema = z
  .object({
    id: uniqueIdSchema,
    type: z.literal(2),
    style: z.literal(1).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)),
    label: z.preprocess((d) => d ?? undefined, z.string().default("")),
    emoji: z.optional(z.nullable(emojiSchema)),
    disabled: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
    action_set_id: z.preprocess(
      (d) => d ?? undefined,
      z.string().default(() => getUniqueId().toString())
    ),
  })
  .or(
    z.object({
      id: uniqueIdSchema,
      type: z.literal(2),
      style: z.literal(5),
      label: z.preprocess((d) => d ?? undefined, z.string().default("")),
      emoji: z.optional(z.nullable(emojiSchema)),
      url: z.preprocess((d) => d ?? undefined, z.string().default("")),
      disabled: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
      action_set_id: z.string().default(() => getUniqueId().toString()),
    })
  );

export type MessageComponentButton = z.infer<typeof componentButtonSchema>;

export const componentSelectMenuOptionSchema = z.object({
  id: uniqueIdSchema,
  label: z.preprocess((d) => d ?? undefined, z.string().default("")),
  description: z.preprocess((d) => d || undefined, z.optional(z.string())),
  emoji: z.preprocess((d) => d ?? undefined, z.optional(emojiSchema)),
  action_set_id: z.preprocess(
    (d) => d ?? undefined,
    z.string().default(() => getUniqueId().toString())
  ),
});

export type MessageComponentSelectMenuOption = z.infer<
  typeof componentSelectMenuOptionSchema
>;

export const componentSelectMenuSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(3),
  placeholder: z.preprocess((d) => d ?? undefined, z.optional(z.string())),
  disabled: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
  options: z.preprocess(
    (d) => d ?? undefined,
    z.array(componentSelectMenuOptionSchema).default([])
  ),
});

export type MessageComponentSelectMenu = z.infer<
  typeof componentSelectMenuSchema
>;

export const componentActionRowSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(1),
  components: z.preprocess(
    (d) => d ?? undefined,
    z.array(componentButtonSchema.or(componentSelectMenuSchema)).default([])
  ),
});

export type MessageComponentActionRow = z.infer<
  typeof componentActionRowSchema
>;

export const componentTextDisplaySchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(10),
  content: z.preprocess((d) => d ?? undefined, z.string().default("")),
});

export type ComponentTextDisplay = z.infer<typeof componentTextDisplaySchema>;

export const componentThumbnailSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(11),
  media: unfurledMediaItemSchema,
  description: z.preprocess((d) => d ?? undefined, z.optional(z.string())),
  spoiler: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
});

export type ComponentThumbnail = z.infer<typeof componentThumbnailSchema>;

export const componentSectionSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(9),
  components: z.preprocess(
    (d) => d ?? undefined,
    z.array(componentTextDisplaySchema).default([])
  ),
  accessory: z.preprocess(
    (d) => d ?? undefined,
    z.union([componentThumbnailSchema, componentButtonSchema]).default({
      type: 11,
      media: {
        url: "",
      },
    })
  ),
});

export type ComponentSection = z.infer<typeof componentSectionSchema>;

export const componentMediaGalleryItemSchema = z.object({
  id: uniqueIdSchema,
  media: unfurledMediaItemSchema,
  description: z.preprocess((d) => d ?? undefined, z.optional(z.string())),
  spoiler: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
});

export const componentMediaGallerySchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(12),
  items: z.preprocess(
    (d) => d ?? undefined,
    z.array(componentMediaGalleryItemSchema).default([])
  ),
});

export type ComponentMediaGallery = z.infer<typeof componentMediaGallerySchema>;

export const componentFileSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(13),
  file: unfurledMediaItemSchema,
  spoiler: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
});

export type ComponentFile = z.infer<typeof componentFileSchema>;

export const componentSeparatorSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(14),
  divider: z.preprocess((d) => d ?? undefined, z.boolean().default(true)),
  spacing: z.preprocess(
    (d) => d ?? undefined,
    z.union([z.literal(1), z.literal(2)]).default(1)
  ),
});

export type ComponentSeparator = z.infer<typeof componentSeparatorSchema>;

export const componentContainerSchema = z.object({
  id: uniqueIdSchema,
  type: z.literal(17),
  components: z
    .array(
      z.union([
        componentActionRowSchema,
        componentTextDisplaySchema,
        componentSectionSchema,
        componentMediaGallerySchema,
        componentSeparatorSchema,
        componentFileSchema,
      ])
    )
    .min(1)
    .max(10),
  accent_color: z.preprocess((d) => d ?? undefined, z.optional(z.number())),
  spoiler: z.preprocess((d) => d ?? undefined, z.optional(z.boolean())),
});

export type ComponentContainer = z.infer<typeof componentContainerSchema>;

export const componentSchema = z.union([
  componentActionRowSchema,
  componentButtonSchema,
  componentSelectMenuSchema,
  componentSectionSchema,
  componentTextDisplaySchema,
  componentThumbnailSchema,
  componentMediaGallerySchema,
  componentFileSchema,
  componentSeparatorSchema,
  componentContainerSchema,
]);

export const messageActionSchema = z
  .object({
    type: z.literal(1).or(z.literal(6)).or(z.literal(8)), // text response
    id: uniqueIdSchema,
    text: z.preprocess((d) => d ?? undefined, z.string().default("")),
    public: z.preprocess((d) => d ?? undefined, z.boolean().default(false)),
    allow_role_mentions: z.preprocess(
      (d) => d ?? undefined,
      z.boolean().default(false)
    ),
  })
  .or(
    z.object({
      type: z.literal(5).or(z.literal(7)).or(z.literal(9)), // saved messages responses, // toggle, add, remove role
      id: uniqueIdSchema,
      target_id: z.string(),
      public: z.preprocess((d) => d ?? undefined, z.boolean().default(false)),
      allow_role_mentions: z.preprocess(
        (d) => d ?? undefined,
        z.boolean().default(false)
      ),
    })
  )
  .or(
    z.object({
      type: z.literal(2).or(z.literal(3)).or(z.literal(4)), // toggle, add, remove role
      id: uniqueIdSchema.default(() => getUniqueId()),
      target_id: z.string(),
      public: z.preprocess((d) => d ?? undefined, z.boolean().default(false)),
      allow_role_mentions: z.preprocess(
        (d) => d ?? undefined,
        z.boolean().default(false)
      ),
      disable_default_response: z.preprocess(
        (d) => d ?? undefined,
        z.boolean().default(false)
      ),
    })
  )
  .or(
    z.object({
      type: z.literal(10), // permission check
      id: uniqueIdSchema.default(() => getUniqueId()),
      permissions: z.preprocess((d) => d ?? undefined, z.string().default("0")),
      role_ids: z.preprocess(
        (d) => d ?? undefined,
        z.array(z.string()).default([])
      ),
      disable_default_response: z.preprocess(
        (d) => d ?? undefined,
        z.boolean().default(false)
      ),
      text: z.preprocess((d) => d ?? undefined, z.string().default("")),
    })
  );

export type MessageAction = z.infer<typeof messageActionSchema>;

export const messageActionSetSchema = z.object({
  actions: z.array(messageActionSchema),
});

export type MessageActionSet = z.infer<typeof messageActionSetSchema>;

export const messageContentSchema = z.preprocess(
  (d) => d ?? undefined,
  z.string().default("")
);

export type MessageContent = z.infer<typeof messageContentSchema>;

export const webhookUsernameSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type WebhookUsername = z.infer<typeof webhookUsernameSchema>;

export const webhookAvatarUrlSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(z.string())
);

export type WebhookAvatarUrl = z.infer<typeof webhookAvatarUrlSchema>;

export const messageTtsSchema = z.preprocess(
  (d) => d ?? undefined,
  z.boolean().default(false)
);

export type MessageTts = z.infer<typeof messageTtsSchema>;

export const messageAllowedMentionsSchema = z.preprocess(
  (d) => d ?? undefined,
  z.optional(
    z.object({
      parse: z.array(
        z.literal("users").or(z.literal("roles")).or(z.literal("everyone"))
      ),
      roles: z.array(z.string()),
      users: z.array(z.string()),
      replied_user: z.boolean(),
    })
  )
);

export const messageThreadName = z.optional(z.string());

export const messageSchema = z.object({
  content: z.preprocess(
    (d) => d ?? undefined,
    messageContentSchema.default("")
  ),
  username: webhookUsernameSchema,
  avatar_url: webhookAvatarUrlSchema,
  tts: messageTtsSchema,
  embeds: z.preprocess((d) => d ?? undefined, z.array(embedSchema).default([])),
  allowed_mentions: messageAllowedMentionsSchema,
  components: z.preprocess(
    (d) => d ?? undefined,
    z.array(componentSchema).default([])
  ),
  thread_name: messageThreadName,
  actions: z.preprocess(
    (d) => d ?? undefined,
    z.record(z.string(), messageActionSetSchema).default({})
  ),
  flags: z.preprocess((d) => d ?? 0, z.number()),
});

export type Message = z.infer<typeof messageSchema>;

export function parseMessageWithAction(raw: any) {
  const parsedData = messageSchema.parse(raw);

  // create messing action sets
  for (const row of parsedData.components) {
    if (row.type !== 1) {
      continue;
    }

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
