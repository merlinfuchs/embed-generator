import { type Message, mentionTypeSchema } from "./schema";

type AllowedMentions = NonNullable<Message["allowed_mentions"]>;
export type MentionType = AllowedMentions["parse"][number];

export const MENTION_TYPES = mentionTypeSchema.options;

/** Leaving allowed_mentions out is Discord's default, where every mention pings. */
export function mentionPings(
  allowedMentions: AllowedMentions | undefined,
  type: MentionType,
): boolean {
  if (!allowedMentions) return true;
  if (allowedMentions.parse.includes(type)) return true;
  // Imported JSON can ping specific ids instead of a whole type.
  return type !== "everyone" && allowedMentions[type].length > 0;
}

export function setMentionPings(
  allowedMentions: AllowedMentions | undefined,
  type: MentionType,
  pings: boolean,
): AllowedMentions | undefined {
  const current: AllowedMentions = allowedMentions ?? {
    parse: [...MENTION_TYPES],
    users: [],
    roles: [],
    replied_user: false,
  };

  const others = current.parse.filter((t) => t !== type);
  const next: AllowedMentions = {
    ...current,
    parse: pings ? [...others, type] : others,
  };
  // Discord rejects a type in parse that also has an id list, and without the
  // type the list would still ping those ids.
  if (type !== "everyone") next[type] = [];

  const isDefault =
    MENTION_TYPES.every((t) => next.parse.includes(t)) && !next.replied_user;
  return isDefault ? undefined : next;
}
