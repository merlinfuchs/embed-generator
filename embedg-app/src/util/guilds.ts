import clsx from "clsx";
import { useEffect } from "react";
import { useGuildsQuery } from "../api/queries";
import type { GuildWire } from "../api/wire";

/**
 * The server to preselect: the first one where the user's roles grant Manage Webhooks, rather than
 * one they can't post in themselves. Whether the bot can post there only shows once its channels
 * load. Falls back to the first server, since a channel overwrite can still let the user post.
 */
export function defaultGuild(guilds: GuildWire[]): GuildWire | undefined {
  return guilds.find((g) => g.can_manage_webhooks) ?? guilds[0];
}

/**
 * Preselects a server when none is selected, and clears a selection that is no longer in the
 * user's server list.
 */
export function useDefaultGuild(
  guildId: string | null,
  setGuildId: (guildId: string | null) => void,
) {
  const { data: guilds, isPending } = useGuildsQuery();

  useEffect(() => {
    if (!guildId) {
      if (guilds?.success) {
        const id = defaultGuild(guilds.data)?.id;
        if (id) {
          setGuildId(id);
        }
      }
    } else if (!isPending) {
      if (!guilds?.success || !guilds.data.find((g) => g.id === guildId)) {
        setGuildId(null);
      }
    }
  }, [guilds, guildId, isPending]);
}

/** Props for a server in a picker: dimmed, with the reason on hover, if the user likely can't post. */
export function guildOptionProps(guild: GuildWire, className: string) {
  if (guild.can_manage_webhooks) {
    return { className };
  }
  return {
    className: clsx(className, "opacity-60"),
    title:
      "Your roles in this server don't grant Manage Webhooks. A channel might still allow it.",
  };
}
