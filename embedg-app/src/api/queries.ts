import { useQuery } from "react-query";
import {
  CustomBotGetResponseWire,
  GetPremiumPlanFeaturesResponseWire,
  ListChannelsResponseWire,
  CustomCommandsListResponseWire,
  ListGuildsResponseWire,
  ListPremiumEntitlementsResponseWire,
  ListRolesResponseWire,
  SavedMessageListResponseWire,
  SharedMessageGetResponseWire,
  UserResponseWire,
  CustomCommandGetResponseWire,
  ListEmojisResponseWire,
} from "./wire";
import { APIResponse } from "./base";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const silentErrorCodes = new Set(["invalid_session"]);

export function handleApiResponse<T extends APIResponse<any>>(
  resp: Promise<T>
): Promise<T> {
  return resp; /*.then((res) => {
    if (!res.success) {
      if (!silentErrorCodes.has(res.error.code)) {
        useToasts.getState().create({
          type: "error",
          message: res.error.message,
        });
      }
    }
    return res;
  });*/
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

export function useGuildEmojisQuery(guildId: string | null) {
  return useQuery<ListEmojisResponseWire>(
    ["guild", guildId, "emojis"],
    () => {
      return fetch(`/api/guilds/${guildId}/emojis`).then((res) =>
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

export function useSharedMessageQuery(messageId: string | null) {
  return useQuery<SharedMessageGetResponseWire>(
    ["shared-message", messageId],
    () => {
      let url = `/api/shared-messages/${messageId}`;
      return fetch(url).then((res) => handleApiResponse(res.json()));
    },
    { enabled: !!messageId }
  );
}

export function usePremiumGuildFeaturesQuery(guildId?: string | null) {
  return useQuery<GetPremiumPlanFeaturesResponseWire>(
    ["premium", "features", guildId],
    () =>
      fetch(`/api/premium/features?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json())
      ),
    { enabled: !!guildId }
  );
}

export function usePremiumGuildEntitlementsQuery(guildId?: string | null) {
  return useQuery<ListPremiumEntitlementsResponseWire>(
    ["premium", "entitlements", guildId],
    () =>
      fetch(`/api/premium/entitlements?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json())
      ),
    { enabled: !!guildId }
  );
}

export function usePremiumUserFeaturesQuery() {
  return useQuery<GetPremiumPlanFeaturesResponseWire>(
    ["premium", "features", "user"],
    () =>
      fetch(`/api/premium/features`).then((res) =>
        handleApiResponse(res.json())
      )
  );
}

export function useCustomBotQuery(guildId: string | null) {
  return useQuery<CustomBotGetResponseWire>(
    ["custom-bot", guildId],
    () =>
      fetch(`/api/custom-bot?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json())
      ),
    { enabled: !!guildId }
  );
}

export function useCustomCmmandsQuery(guildId: string | null) {
  return useQuery<CustomCommandsListResponseWire>(
    ["custom-bot", guildId, "commands"],
    () =>
      fetch(`/api/custom-bot/commands?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json())
      ),
    { enabled: !!guildId }
  );
}

export function useCustomCmmandQuery(
  guildId: string | null,
  commandId: string | null
) {
  return useQuery<CustomCommandGetResponseWire>(
    ["custom-bot", guildId, "commands", commandId],
    () =>
      fetch(`/api/custom-bot/commands/${commandId}?guild_id=${guildId}`).then(
        (res) => handleApiResponse(res.json())
      ),
    { enabled: !!guildId && !!commandId }
  );
}
