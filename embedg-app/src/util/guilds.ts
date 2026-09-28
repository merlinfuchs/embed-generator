import { useEffect } from "react";
import { useGuildsQuery } from "../api/queries";

/**
 * Preselects the first server when none is selected, which is one the user can manage webhooks in
 * if they have any, since the list is sorted that way. Clears a selection that is no longer in the
 * user's server list.
 */
export function useDefaultGuild(
  guildId: string | null,
  setGuildId: (guildId: string | null) => void,
) {
  const { data: guilds, isPending } = useGuildsQuery();

  useEffect(() => {
    if (!guildId) {
      if (guilds?.success && guilds.data.length) {
        setGuildId(guilds.data[0].id);
      }
    } else if (!isPending) {
      if (!guilds?.success || !guilds.data.find((g) => g.id === guildId)) {
        setGuildId(null);
      }
    }
  }, [guilds, guildId, isPending]);
}
