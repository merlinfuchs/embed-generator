import type { Message } from "./schema";

type AllowedMentions = NonNullable<Message["allowed_mentions"]>;
export type MentionType = AllowedMentions["parse"][number];

export const MENTION_TYPES: MentionType[] = ["users", "roles", "everyone"];

/** Leaving allowed_mentions out is Discord's default, where every mention pings. */
export function mentionPings(
  allowedMentions: AllowedMentions | undefined,
  type: MentionType,
): boolean {
  if (!allowedMentions) return true;
  if (allowedMentions.parse.includes(type)) return true;
  // Imported JSON can ping specific ids instead of a whole type.
  if (type === "users") return allowedMentions.users.length > 0;
  if (type === "roles") return allowedMentions.roles.length > 0;
  return false;
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

  const next: AllowedMentions = {
    ...current,
    parse: current.parse.filter((t) => t !== type),
  };
  if (pings) next.parse.push(type);
  // Discord rejects a type in parse that also has an id list, and without the
  // type the list would still ping those ids.
  if (type === "users") next.users = [];
  if (type === "roles") next.roles = [];

  const isDefault =
    MENTION_TYPES.every((t) => next.parse.includes(t)) && !next.replied_user;
  return isDefault ? undefined : next;
}
