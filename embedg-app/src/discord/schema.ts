import { z } from "zod";
import { getUniqueId } from "../util";

export const COMPONENTS_V2_FLAG = 1 << 15;

const VARIABLE_RE = /\{\{[^}]+\}\}/;
const ATTACHMENT_RE = /^attachment:\/\/.+/;

const HOSTNAME_RE = /\.[a-zA-Z]{2,}$/;
const urlRefinement: [(v: string) => boolean, string] = [
  (v) => {
    if (v.match(VARIABLE_RE)) return true;
    if (v.match(ATTACHMENT_RE)) return true;
    try {
      const url = new URL(v);
      return !!url.hostname.match(HOSTNAME_RE);
    } catch (_e) {
      return false;
    }
  },
  "Invalid URL",
];

const _IMAGE_PATH_RE = /\.(png|jpg|jpeg|webp|gif)$/;
const imageUrlRefinement: [(v: string) => boolean, string] = [
  (v) => {
    if (v.match(VARIABLE_RE)) return true;

    try {
      const url = new URL(v);
      return !!url.hostname.match(HOSTNAME_RE); // && !!url.pathname.match(IMAGE_PATH_RE) TODO: make better image url regex
    } catch {
      return false;
    }
  },
  "Invalid image URL",
];

export const uniqueIdSchema = z.number();

export type UniqueId = z.infer<typeof uniqueIdSchema>;

export const embedFooterTextSchema = z.optional(z.string().max(2048));

export type EmbedFooterText = z.infer<typeof embedFooterTextSchema>;

export const embedFooterIconUrlSchema = z.optional(
  z.string().refine(...imageUrlRefinement),
);

export type EmbedFooterIconUrl = z.infer<typeof embedFooterIconUrlSchema>;

export const embedFooterSchema = z.optional(
  z.object({
    text: embedFooterTextSchema,
    icon_url: embedFooterIconUrlSchema,
  }),
);

export type EmbedFooter = z.infer<typeof embedFooterSchema>;

export const embedImageUrlSchema = z.optional(
  z.string().refine(...urlRefinement),
);

export type EmbedImageUrl = z.infer<typeof embedImageUrlSchema>;

export const embedImageSchema = z.optional(
  z.object({
    url: embedImageUrlSchema,
  }),
);

export type EmbedImage = z.infer<typeof embedImageSchema>;

export const embedThumbnailUrlSchema = z.optional(
  z.string().refine(...urlRefinement),
);

export type EmbedThumbnailUrl = z.infer<typeof embedThumbnailUrlSchema>;

export const embedThumbnailSchema = z.optional(
  z.object({
    url: embedThumbnailUrlSchema,
  }),
);

export type EmbedThumbnail = z.infer<typeof embedThumbnailSchema>;

export const embedAuthorNameSchema = z.string().min(1).max(256);

export type EmbedAuthorName = z.infer<typeof embedAuthorNameSchema>;

export const embedAuthorUrlSchema = z.optional(
  z.string().refine(...urlRefinement),
);

export type EmbedAuthorUrl = z.infer<typeof embedAuthorUrlSchema>;

export const embedAuthorIconUrlSchema = z.optional(
  z.string().refine(...imageUrlRefinement),
);

export type EmbedAuthorIconUrl = z.infer<typeof embedAuthorIconUrlSchema>;

export const embedAuthorSchema = z.optional(
  z.object({
    name: embedAuthorNameSchema,
    url: embedAuthorUrlSchema,
    icon_url: embedAuthorIconUrlSchema,
  }),
);

export type EmbedAuthor = z.infer<typeof embedAuthorSchema>;

export const embedProviderNameSchema = z.string().min(1).max(256);

export type EmbedProviderName = z.infer<typeof embedProviderNameSchema>;

export const embedProviderUrlSchema = z.optional(
  z.string().refine(...urlRefinement),
);

export type EmbedProviderUrl = z.infer<typeof embedProviderUrlSchema>;

export const embedProviderSchema = z.optional(
  z.object({
    name: embedProviderNameSchema,
    url: embedProviderUrlSchema,
  }),
);

export type EmbedProvider = z.infer<typeof embedProviderSchema>;

export const embedFieldNameSchema = z.string().min(1).max(256);

export type EmbedFieldName = z.infer<typeof embedFieldNameSchema>;

export const embedFieldValueSchema = z.string().min(1).max(1024);

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

export const embedTitleSchema = z.optional(z.string().max(256));

export type EmbedTitle = z.infer<typeof embedTitleSchema>;

export const embedDescriptionSchema = z.optional(z.string().max(4096));

export type EmbedDescription = z.infer<typeof embedDescriptionSchema>;

export const embedUrlSchema = z.optional(z.string().refine(...urlRefinement));

export type EmbedUrl = z.infer<typeof embedUrlSchema>;

export const embedTimestampSchema = z.optional(z.string());

export type EmbedTimestamp = z.infer<typeof embedTimestampSchema>;

export const embedColor = z.optional(z.number().max(16777215));

export type EmbedColor = z.infer<typeof embedColor>;

export const embedSchema = z
  .object({
    id: uniqueIdSchema.default(() => getUniqueId()),
    title: embedTitleSchema,
    description: embedDescriptionSchema,
    url: embedUrlSchema,
    timestamp: embedTimestampSchema,
    color: embedColor,
    footer: embedFooterSchema,
    author: embedAuthorSchema,
    provider: embedProviderSchema,
    image: embedImageSchema,
    thumbnail: embedThumbnailSchema,
    fields: z.array(embedFieldSchema).max(25).default([]),
  })
  .superRefine((data, ctx) => {
    if (
      !data.description &&
      !data.title &&
      !data.author &&
      !data.provider &&
      !data.footer &&
      !data.fields.length &&
      !data.image &&
      !data.thumbnail
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Description is required when no other fields are set",
      });
    }
  });

export type MessageEmbed = z.infer<typeof embedSchema>;

/** How much text Discord allows across all embeds of a message. */
export const EMBEDS_TEXT_LIMIT = 6000;

/** The text of an embed that counts towards `EMBEDS_TEXT_LIMIT`. */
export function embedTextLength(
  embed: Pick<MessageEmbed, "title" | "description" | "footer" | "author">,
  fields: { name: string; value: string }[],
): number {
  return (
    (embed.title?.length ?? 0) +
    (embed.description?.length ?? 0) +
    (embed.footer?.text?.length ?? 0) +
    (embed.author?.name.length ?? 0) +
    fields.reduce((sum, f) => sum + f.name.length + f.value.length, 0)
  );
}

export const emojiSchema = z
  .object({
    id: z.optional(z.string()),
    name: z.string(),
    animated: z.boolean(),
  })
  .refine(
    (val) => val.id || val.name,
    "Emoji must have either an id or a name",
  );

export type Emoji = z.infer<typeof emojiSchema>;

export const unfurledMediaItemSchema = z.object({
  url: z.string().refine(...urlRefinement),
});

export type UnfurledMediaItem = z.infer<typeof unfurledMediaItemSchema>;

export const componentButtonStyleSchema = z
  .literal(1)
  .or(z.literal(2))
  .or(z.literal(3))
  .or(z.literal(4))
  .or(z.literal(5));

export type MessageComponentButtonStyle = z.infer<
  typeof componentButtonStyleSchema
>;

export const componentButtonLabelSchema = z.string().max(80);

export const componentButtonSchema = z
  .object({
    id: uniqueIdSchema.default(() => getUniqueId()),
    type: z.literal(2),
    style: z.literal(1).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)),
    label: componentButtonLabelSchema,
    emoji: z.optional(z.nullable(emojiSchema)),
    disabled: z.optional(z.boolean()),
    action_set_id: z.string().default(() => getUniqueId().toString()),
  })
  .or(
    z.object({
      id: uniqueIdSchema.default(() => getUniqueId()),
      type: z.literal(2),
      style: z.literal(5),
      label: componentButtonLabelSchema,
      emoji: z.optional(z.nullable(emojiSchema)),
      url: z.string().refine(...urlRefinement),
      disabled: z.optional(z.boolean()),
      action_set_id: z.string().default(() => getUniqueId().toString()),
    }),
  )
  .superRefine((data, ctx) => {
    if (!data.emoji && !data.label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: "Label is required when no emoji is set",
      });
    }
  });

export type MessageComponentButton = z.infer<typeof componentButtonSchema>;

export const componentSelectMenuOptionSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  label: z.string().min(1).max(100),
  description: z.optional(z.string().min(1).max(100)),
  emoji: z.optional(z.nullable(emojiSchema)),
  action_set_id: z.string().default(() => getUniqueId().toString()),
});

export type MessageComponentSelectMenuOption = z.infer<
  typeof componentSelectMenuOptionSchema
>;

export const componentSelectMenuSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(3),
  placeholder: z.optional(z.string().max(150)),
  disabled: z.optional(z.boolean()),
  options: z.array(componentSelectMenuOptionSchema).min(1).max(25),
});

export type MessageComponentSelectMenu = z.infer<
  typeof componentSelectMenuSchema
>;

export const componentActionRowSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(1),
  components: z
    .array(z.union([componentButtonSchema, componentSelectMenuSchema]))
    .min(1)
    .max(5),
});

export type MessageComponentActionRow = z.infer<
  typeof componentActionRowSchema
>;

export const componentTextDisplaySchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(10),
  content: z.string().min(1),
});

export type MessageComponentTextDisplay = z.infer<
  typeof componentTextDisplaySchema
>;

export const componentThumbnailSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(11),
  media: unfurledMediaItemSchema,
  description: z.optional(z.string().max(1024)),
  spoiler: z.optional(z.boolean()),
});

export type MessageComponentThumbnail = z.infer<
  typeof componentThumbnailSchema
>;

export const componentAccessorySchema = z.union([
  componentThumbnailSchema,
  componentButtonSchema,
]);

export type MessageComponentAccessory = z.infer<
  typeof componentAccessorySchema
>;

export const componentSectionSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(9),
  components: z.array(componentTextDisplaySchema).min(1).max(3),
  accessory: componentAccessorySchema,
});

export type MessageComponentSection = z.infer<typeof componentSectionSchema>;

export const componentMediaGalleryItemSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  media: unfurledMediaItemSchema,
  description: z.optional(z.string().max(1024)),
  spoiler: z.optional(z.boolean()),
});

export type MessageComponentMediaGalleryItem = z.infer<
  typeof componentMediaGalleryItemSchema
>;

export const componentMediaGallerySchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(12),
  items: z.array(componentMediaGalleryItemSchema).min(1).max(10),
});

export type MessageComponentMediaGallery = z.infer<
  typeof componentMediaGallerySchema
>;

export const componentFileSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(13),
  file: unfurledMediaItemSchema,
  spoiler: z.optional(z.boolean()),
});

export type MessageComponentFile = z.infer<typeof componentFileSchema>;

export const componentSeparatorSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(14),
  divider: z.boolean().default(true),
  spacing: z.union([z.literal(1), z.literal(2)]).default(1),
});

export type MessageComponentSeparator = z.infer<
  typeof componentSeparatorSchema
>;

export const componentContainerSubComponentSchema = z.union([
  componentActionRowSchema,
  componentTextDisplaySchema,
  componentSectionSchema,
  componentMediaGallerySchema,
  componentSeparatorSchema,
  componentFileSchema,
]);

export type MessageComponentContainerSubComponent = z.infer<
  typeof componentContainerSubComponentSchema
>;

export const componentContainerSchema = z.object({
  id: uniqueIdSchema.default(() => getUniqueId()),
  type: z.literal(17),
  components: z.array(componentContainerSubComponentSchema).min(1).max(10),
  accent_color: embedColor,
  spoiler: z.optional(z.boolean()),
});

export type MessageComponentContainer = z.infer<
  typeof componentContainerSchema
>;

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

export type MessageComponent = z.infer<typeof componentSchema>;

export const messageActionSchema = z
  .object({
    type: z.literal(1).or(z.literal(6)).or(z.literal(8)), // text response
    id: uniqueIdSchema.default(() => getUniqueId()),
    text: z.string().min(1).max(2000),
    public: z.boolean().default(false),
    allow_role_mentions: z.boolean().default(false),
  })
  .or(
    z.object({
      type: z.literal(5).or(z.literal(7)).or(z.literal(9)), // saved messages responses
      id: uniqueIdSchema.default(() => getUniqueId()),
      target_id: z.string().min(1),
      public: z.boolean().default(false),
      allow_role_mentions: z.boolean().default(false),
    }),
  )
  .or(
    z.object({
      type: z.literal(2).or(z.literal(3)).or(z.literal(4)), // toggle, add, remove role
      id: uniqueIdSchema.default(() => getUniqueId()),
      target_id: z.string().min(1),
      public: z.boolean().default(false),
      allow_role_mentions: z.boolean().default(false),
      disable_default_response: z.boolean().default(false),
    }),
  )
  .or(
    z.object({
      type: z.literal(10), // permission check with default response
      id: uniqueIdSchema.default(() => getUniqueId()),
      permissions: z.string().default("0"),
      role_ids: z.array(z.string()),
      disable_default_response: z.literal(false),
    }),
  )
  .or(
    z.object({
      type: z.literal(10), // permission check with custom response
      id: uniqueIdSchema.default(() => getUniqueId()),
      permissions: z.string().default("0"),
      role_ids: z.array(z.string()),
      disable_default_response: z.literal(true),
      text: z.string().min(1).max(2000),
    }),
  );

export type MessageAction = z.infer<typeof messageActionSchema>;

export const messageActionSetSchema = z.object({
  actions: z.array(messageActionSchema), // .max(5), //.min(1),
});

export type MessageActionSet = z.infer<typeof messageActionSetSchema>;

export const messageContentSchema = z.string().max(2000);

export type MessageContent = z.infer<typeof messageContentSchema>;

export const webhookUsernameSchema = z.optional(
  z
    .string()
    .max(80)
    .refine(
      (val) =>
        !val.toLowerCase().includes("clyde") &&
        !val.toLowerCase().includes("discord"),
      "Username can't contain 'clyde' or 'discord'",
    )
    .refine(
      (val) => val.toLowerCase() !== "everyone" && val.toLowerCase() !== "here",
      "Username can't be 'everyone'  or 'here'",
    ),
);

export type WebhookUsername = z.infer<typeof webhookUsernameSchema>;

export const webhookAvatarUrlSchema = z.optional(
  z.string().refine(...imageUrlRefinement),
);

export type WebhookAvatarUrl = z.infer<typeof webhookAvatarUrlSchema>;

export const messageTtsSchema = z.boolean();

export type MessageTts = z.infer<typeof messageTtsSchema>;

export const mentionTypeSchema = z.enum(["users", "roles", "everyone"]);

export const messageAllowedMentionsSchema = z.optional(
  z.object({
    parse: z.array(mentionTypeSchema),
    roles: z.array(z.string()),
    users: z.array(z.string()),
    replied_user: z.boolean(),
  }),
);

export const messageThreadName = z.optional(z.string().max(100));

/** How much text Discord allows across all text displays of a message. */
const TEXT_DISPLAYS_TEXT_LIMIT = 4000;

/** Every text display in the components, with the path to it. */
function textDisplays(
  components: MessageComponent[],
  path: (string | number)[],
): { content: string; path: (string | number)[] }[] {
  return components.flatMap((component, i) => {
    if (component.type === 10) {
      return [{ content: component.content, path: [...path, i] }];
    }
    if ("components" in component) {
      return textDisplays(component.components, [...path, i, "components"]);
    }
    return [];
  });
}

export const messageSchema = z
  .object({
    content: messageContentSchema.default(""),
    username: webhookUsernameSchema,
    avatar_url: webhookAvatarUrlSchema,
    tts: messageTtsSchema.default(false),
    embeds: z.array(embedSchema).max(10).default([]),
    allowed_mentions: messageAllowedMentionsSchema,
    components: z.array(componentSchema).max(5).default([]),
    thread_name: messageThreadName,
    actions: z.record(z.string(), messageActionSetSchema).default({}),
    flags: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    const flags = data.flags ?? 0;
    if (flags & COMPONENTS_V2_FLAG) {
      if (data.components.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["components"],
          message: "Components are required when components v2 is enabled",
        });
      }

      const displays = textDisplays(data.components, ["components"]);
      const length = displays.reduce((sum, d) => sum + d.content.length, 0);
      if (length > TEXT_DISPLAYS_TEXT_LIMIT) {
        // On every text display, as any of them can be shortened to fix it.
        for (const display of displays) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...display.path, "content"],
            message: `All text displays together can't have more than ${TEXT_DISPLAYS_TEXT_LIMIT} characters (currently ${length})`,
          });
        }
      }
    } else {
      // this currently doesn't take attachments into account
      if (!data.content && !data.embeds.length && !data.components.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Content is required when no other fields are set",
        });
      }

      const length = data.embeds.reduce(
        (sum, embed) => sum + embedTextLength(embed, embed.fields),
        0,
      );
      if (length > EMBEDS_TEXT_LIMIT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["embeds"],
          message: `All embeds together can't have more than ${EMBEDS_TEXT_LIMIT} characters (currently ${length})`,
        });
      }
    }
  });

export type Message = z.infer<typeof messageSchema>;
