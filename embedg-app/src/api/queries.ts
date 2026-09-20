import { useQuery } from "@tanstack/react-query";
import type {
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
  GetGuildBrandingResponseWire,
  ScheduledMessageListResponseWire,
} from "./wire";
import type { APIResponse } from "./base";
import { fetchApi } from "./client";

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const _silentErrorCodes = new Set(["invalid_session"]);

export function handleApiResponse<T extends APIResponse<any>>(
  resp: Promise<T>,
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
  return useQuery<UserResponseWire>({
    queryKey: ["users", userId],
    queryFn: () => {
      return fetchApi(`/api/users/${userId}`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
  });
}

export function useGuildsQuery() {
  return useQuery<ListGuildsResponseWire>({
    queryKey: ["guilds"],
    queryFn: () => {
      return fetchApi(`/api/guilds`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
  });
}

export function useGuildChannelsQuery(guildId: string | null) {
  return useQuery<ListChannelsResponseWire>({
    queryKey: ["guild", guildId, "channels"],
    queryFn: () => {
      return fetchApi(`/api/guilds/${guildId}/channels`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
    enabled: !!guildId,
  });
}

export function useGuildRolesQuery(guildId: string | null) {
  return useQuery<ListRolesResponseWire>({
    queryKey: ["guild", guildId, "roles"],
    queryFn: () => {
      return fetchApi(`/api/guilds/${guildId}/roles`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
    enabled: !!guildId,
  });
}

export function useGuildEmojisQuery(guildId: string | null) {
  return useQuery<ListEmojisResponseWire>({
    queryKey: ["guild", guildId, "emojis"],
    queryFn: () => {
      return fetchApi(`/api/guilds/${guildId}/emojis`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
    enabled: !!guildId,
  });
}

export function useGuildBrandingQuery(guildId: string | null) {
  return useQuery<GetGuildBrandingResponseWire>({
    queryKey: ["guild", guildId, "branding"],
    queryFn: () => {
      return fetchApi(`/api/guilds/${guildId}/branding`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
    enabled: !!guildId,
  });
}

export function useSavedMessagesQuery(guildId: string | null) {
  return useQuery<SavedMessageListResponseWire>({
    queryKey: ["saved-messages", guildId],
    queryFn: () => {
      let url = `/api/saved-messages`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }
      return fetchApi(url).then((res) => handleApiResponse(res.json()));
    },
  });
}

export function useSharedMessageQuery(messageId: string | null) {
  return useQuery<SharedMessageGetResponseWire>({
    queryKey: ["shared-message", messageId],
    queryFn: () => {
      const url = `/api/shared-messages/${messageId}`;
      return fetchApi(url).then((res) => handleApiResponse(res.json()));
    },
    enabled: !!messageId,
  });
}

export function usePremiumGuildFeaturesQuery(guildId?: string | null) {
  return useQuery<GetPremiumPlanFeaturesResponseWire>({
    queryKey: ["premium", "features", guildId],
    queryFn: () =>
      fetchApi(`/api/premium/features?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function usePremiumGuildEntitlementsQuery(guildId?: string | null) {
  return useQuery<ListPremiumEntitlementsResponseWire>({
    queryKey: ["premium", "entitlements", guildId],
    queryFn: () =>
      fetchApi(`/api/premium/entitlements?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function usePremiumUserEntitlementsQuery() {
  return useQuery<ListPremiumEntitlementsResponseWire>({
    queryKey: ["premium", "entitlements", "user"],
    queryFn: () =>
      fetchApi(`/api/premium/entitlements`).then((res) =>
        handleApiResponse(res.json()),
      ),
  });
}

export function usePremiumUserFeaturesQuery() {
  return useQuery<GetPremiumPlanFeaturesResponseWire>({
    queryKey: ["premium", "features", "user"],
    queryFn: () =>
      fetchApi(`/api/premium/features`).then((res) =>
        handleApiResponse(res.json()),
      ),
  });
}

export function useCustomBotQuery(guildId: string | null) {
  return useQuery<CustomBotGetResponseWire>({
    queryKey: ["custom-bot", guildId],
    queryFn: () =>
      fetchApi(`/api/custom-bot?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function useCustomCmmandsQuery(guildId: string | null) {
  return useQuery<CustomCommandsListResponseWire>({
    queryKey: ["custom-bot", guildId, "commands"],
    queryFn: () =>
      fetchApi(`/api/custom-bot/commands?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function useCustomCmmandQuery(
  guildId: string | null,
  commandId: string | null,
) {
  return useQuery<CustomCommandGetResponseWire>({
    queryKey: ["custom-bot", guildId, "commands", commandId],
    queryFn: () =>
      fetchApi(
        `/api/custom-bot/commands/${commandId}?guild_id=${guildId}`,
      ).then((res) => handleApiResponse(res.json())),
    enabled: !!guildId && !!commandId,
  });
}

export function useScheduledMessagesQuery(guildId: string | null) {
  return useQuery<ScheduledMessageListResponseWire>({
    queryKey: ["scheduled-messages", guildId],
    queryFn: () =>
      fetchApi(`/api/scheduled-messages?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}
