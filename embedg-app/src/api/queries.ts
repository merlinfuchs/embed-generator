import { useQuery } from "react-query";
import { GuildChannelWire, GuildRoleWire, GuildWire, UserWire } from "./wire";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function useUserQuery(userID = "@me") {
  return useQuery<UserWire>(["users", userID], () => {
    return fetch(`/api/users/${userID}`).then((res) => {
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
        throw new APIError(res.status, "Failed to fetch user");
      }
    });
  });
}

export function useGuildChannelsQuery(guildID: string | null) {
  return useQuery<GuildChannelWire[]>(
    ["guild", "channels"],
    () => {
      return fetch(`/api/guilds/${guildID}/channels`).then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new APIError(res.status, "Failed to fetch user");
        }
      });
    },
    { enabled: !!guildID }
  );
}

export function useGuildRolesQuery(guildID: string | null) {
  return useQuery<GuildRoleWire[]>(
    ["guild", "roles"],
    () => {
      return fetch(`/api/guilds/${guildID}/roles`).then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new APIError(res.status, "Failed to fetch user");
        }
      });
    },
    { enabled: !!guildID }
  );
}
