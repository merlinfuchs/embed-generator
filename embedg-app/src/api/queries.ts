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
  ListEmojisResponseWire,
  GetGuildBrandingResponseWire,
  ScheduledMessageListResponseWire,
} from "./wire";
import type { APIResponse } from "./base";

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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
      return fetch(`/api/users/${userId}`).then((res) =>
        handleApiResponse(res.json()),
      );
    },
  });
}

export function useGuildsQuery() {
  return useQuery<ListGuildsResponseWire>({
    queryKey: ["guilds"],
    queryFn: () => {
      return fetch(`/api/guilds`).then((res) => handleApiResponse(res.json()));
    },
  });
}

export function useGuildChannelsQuery(guildId: string | null) {
  return useQuery<ListChannelsResponseWire>({
    queryKey: ["guild", guildId, "channels"],
    queryFn: () => {
      return fetch(`/api/guilds/${guildId}/channels`).then((res) =>
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
      return fetch(`/api/guilds/${guildId}/roles`).then((res) =>
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
      return fetch(`/api/guilds/${guildId}/emojis`).then((res) =>
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
      return fetch(`/api/guilds/${guildId}/branding`).then((res) =>
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
      return fetch(url).then((res) => handleApiResponse(res.json()));
    },
  });
}

export function useSharedMessageQuery(messageId: string | null) {
  return useQuery<SharedMessageGetResponseWire>({
    queryKey: ["shared-message", messageId],
    queryFn: () => {
      const url = `/api/shared-messages/${messageId}`;
      return fetch(url).then((res) => handleApiResponse(res.json()));
    },
    enabled: !!messageId,
  });
}

export function usePremiumGuildFeaturesQuery(guildId?: string | null) {
  return useQuery<GetPremiumPlanFeaturesResponseWire>({
    queryKey: ["premium", "features", guildId],
    queryFn: () =>
      fetch(`/api/premium/features?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function usePremiumUserEntitlementsQuery() {
  return useQuery<ListPremiumEntitlementsResponseWire>({
    queryKey: ["premium", "entitlements", "user"],
    queryFn: () =>
      fetch(`/api/premium/entitlements`).then((res) =>
        handleApiResponse(res.json()),
      ),
  });
}

export function usePremiumUserFeaturesQuery() {
  return useQuery<GetPremiumPlanFeaturesResponseWire>({
    queryKey: ["premium", "features", "user"],
    queryFn: () =>
      fetch(`/api/premium/features`).then((res) =>
        handleApiResponse(res.json()),
      ),
  });
}

export function useCustomBotQuery(guildId: string | null) {
  return useQuery<CustomBotGetResponseWire>({
    queryKey: ["custom-bot", guildId],
    queryFn: () =>
      fetch(`/api/custom-bot?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function useCustomCmmandsQuery(guildId: string | null) {
  return useQuery<CustomCommandsListResponseWire>({
    queryKey: ["custom-bot", guildId, "commands"],
    queryFn: () =>
      fetch(`/api/custom-bot/commands?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}

export function useScheduledMessagesQuery(guildId: string | null) {
  return useQuery<ScheduledMessageListResponseWire>({
    queryKey: ["scheduled-messages", guildId],
    queryFn: () =>
      fetch(`/api/scheduled-messages?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
  });
}
