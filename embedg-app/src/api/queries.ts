import { useQuery } from "react-query";
import {
  ListChannelsResponseWire,
  ListGuildsResponseWire,
  ListRolesResponseWire,
  SavedMessageListResponseWire,
  UserResponseWire,
} from "./wire";
import { APIResponse } from "./base";
import { useToasts } from "../util/toasts";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const silentErrorCodes = new Set(["invalid_session"]);

export function handleApiResponse<T extends APIResponse<any>>(
  resp: Promise<T>
): Promise<T> {
  return resp.then((res) => {
    if (!res.success) {
      if (!silentErrorCodes.has(res.error.code)) {
        useToasts.getState().create({
          type: "error",
          message: res.error.message,
        });
      }
    }
    return res;
  });
}

export function useUserQuery(userId = "@me") {
  return useQuery<UserResponseWire>(["users", userId], () => {
    return fetch(`/api/users/${userId}`).then((res) =>
      handleApiResponse(res.json())
    );
  });
}

export function useGuildsQuery() {
  return useQuery<ListGuildsResponseWire>(["guilds"], () => {
    return fetch(`/api/guilds`).then((res) => handleApiResponse(res.json()));
  });
}

export function useGuildChannelsQuery(guildId: string | null) {
  return useQuery<ListChannelsResponseWire>(
    ["guild", guildId, "channels"],
    () => {
      return fetch(`/api/guilds/${guildId}/channels`).then((res) =>
        handleApiResponse(res.json())
      );
    },
    { enabled: !!guildId }
  );
}

export function useGuildRolesQuery(guildId: string | null) {
  return useQuery<ListRolesResponseWire>(
    ["guild", guildId, "roles"],
    () => {
      return fetch(`/api/guilds/${guildId}/roles`).then((res) =>
        handleApiResponse(res.json())
      );
    },
    { enabled: !!guildId }
  );
}

export function useSavedMessagesQuery(guildId: string | null) {
  return useQuery<SavedMessageListResponseWire>(
    ["saved-messages", guildId],
    () => {
      let url = `/api/saved-messages`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }
      return fetch(url).then((res) => handleApiResponse(res.json()));
    }
  );
}
