import z from "zod";

export const componentButtonValidator = z.object({ type: z.literal(2) }).and(
  z.union([
    z.object({
      style: z.literal(1).or(z.literal(2).or(z.literal(3).or(z.literal(4)))),
      custom_id: z.string().max(100).min(1),
      label: z.string().max(80).min(1),
    }),
    z.object({
      style: z.literal(5),
      url: z.string().url(),
      label: z.string().max(80).min(1),
    }),
  ])
);

export type ComponentButton = z.infer<typeof componentButtonValidator>;

export const componentSelectMenuOptionValidator = z.object({
  label: z.string().max(100).min(1),
  value: z.string().max(100).min(1),
  description: z.string().max(100).optional(),
});

export type ComponentSelectMenuOption = z.infer<
  typeof componentSelectMenuOptionValidator
>;

export const componentSelectMenuValidator = z.object({
  type: z.literal(3),
  custom_id: z.string().max(100).min(1),
  placeholder: z.string().max(150).optional(),
  options: z
    .array(
      z
        .object({ id: z.number().optional() })
        .and(componentSelectMenuOptionValidator)
    )
    .max(25)
    .min(1),
});

export type ComponentSelectMenu = z.infer<typeof componentSelectMenuValidator>;

export const embedFooterValidator = z.object({
  text: z.string().min(1).max(2048),
  icon_url: z.string().url().optional(),
});

export const componentActionRowValidator = z.object({
  type: z.literal(1),
  components: z
    .array(
      z
        .object({ id: z.number().optional() })
        .and(z.union([componentButtonValidator, componentSelectMenuValidator])) // TODO: discriminateUnion?
    )
    .min(1)
    .max(5),
});

export type ComponentActionRow = z.infer<typeof componentActionRowValidator>;

export type EmbedFooter = z.infer<typeof embedFooterValidator>;

export const embedImageValidator = z.object({
  url: z.string().url(),
});

export type EmbedImage = z.infer<typeof embedImageValidator>;

export const embedThumbnailValidator = z.object({
  url: z.string().url(),
});

export type EmbedThumbnail = z.infer<typeof embedThumbnailValidator>;

export const embedAuthorValidator = z.object({
  name: z.string().max(256).min(1),
  url: z.string().url().optional(),
  icon_url: z.string().url().optional(),
});

export type EmbedAuthor = z.infer<typeof embedAuthorValidator>;

export const embedFieldValidator = z.object({
  name: z.string().min(1).max(256),
  value: z.string().min(1).max(1024),
  inline: z.boolean().optional(),
});

export type EmbedField = z.infer<typeof embedFieldValidator>;

export const embedValidator = z.object({
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  url: z.string().url().optional(),
  timestamp: z.string().optional(),
  color: z.number().optional(),
  footer: embedFooterValidator.optional(),
  image: embedImageValidator.optional(),
  thumbnail: embedThumbnailValidator.optional(),
  author: embedAuthorValidator.optional(),
  fields: z
    .array(z.object({ id: z.number().optional() }).and(embedFieldValidator))
    .max(25),
});

export type Embed = z.infer<typeof embedValidator>;

export const messageValidator = z.object({
  username: z.string().max(25).optional(),
  avatar_url: z.string().url().optional(),
  content: z.string().max(2000).optional(),
  embeds: z
    .array(z.object({ id: z.number().optional() }).and(embedValidator))
    .max(10),
  components: z
    .array(
      z.object({ id: z.number().optional() }).and(componentActionRowValidator)
    )
    .max(5),
});

export type Message = z.infer<typeof messageValidator>;

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string" && issue.minimum === 1) {
      return { message: "Can't be empty" };
    }
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
