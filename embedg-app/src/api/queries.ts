import { useQuery } from "react-query";
import {
  GuildChannelWire,
  GuildRoleWire,
  GuildWire,
  SavedMessageWire,
  UserWire,
} from "./wire";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function useUserQuery(userId = "@me") {
  return useQuery<UserWire>(["users", userId], () => {
    return fetch(`/api/users/${userId}`).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new APIError(res.status, "Failed to fetch user");
      }
    });
  });
}

export function useGuildsQuery() {
  return useQuery<GuildWire[]>(["guilds"], () => {
    return fetch(`/api/guilds`).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new APIError(res.status, "Failed to fetch guilds");
      }
    });
  });
}

export function useGuildChannelsQuery(guildId: string | null) {
  return useQuery<GuildChannelWire[]>(
    ["guild", guildId, "channels"],
    () => {
      return fetch(`/api/guilds/${guildId}/channels`).then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new APIError(res.status, "Failed to fetch guild channels");
        }
      });
    },
    { enabled: !!guildId }
  );
}

export function useGuildRolesQuery(guildId: string | null) {
  return useQuery<GuildRoleWire[]>(
    ["guild", guildId, "roles"],
    () => {
      return fetch(`/api/guilds/${guildId}/roles`).then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new APIError(res.status, "Failed to fetch guild roles");
        }
      });
    },
    { enabled: !!guildId }
  );
}

export function useSavedMessagesQuery(guildId: string | null) {
  return useQuery<SavedMessageWire[]>(["saved-messages", guildId], () => {
    let url = `/api/saved-messages`;
    if (guildId) {
      url += `?guild_id=${guildId}`;
    }
    return fetch(url).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new APIError(
          res.status,
          "Failed to fetch saved messages for guild"
        );
      }
    });
  });
}
