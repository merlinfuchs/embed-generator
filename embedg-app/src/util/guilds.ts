import type { GuildWire } from "../api/wire";

/**
 * The server to preselect: the first one the user can manage webhooks in, so they don't land on one
 * where every channel is locked. Falls back to the first server, since a channel overwrite can
 * still let them post somewhere.
 */
export function defaultGuild(guilds: GuildWire[]): GuildWire | undefined {
  return guilds.find((g) => g.can_manage_webhooks) ?? guilds[0];
}

/** Shown on servers the pickers dim. */
export const missingManageWebhooksHint =
  "You don't have the Manage Webhooks permission in this server";
