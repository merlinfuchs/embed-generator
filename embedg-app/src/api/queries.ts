import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  AssistantUsageResponseWire,
  CustomBotGetResponseWire,
  GetPremiumPlanFeaturesResponseWire,
  ListChannelsResponseWire,
  CustomCommandsListResponseWire,
  ListGuildsResponseWire,
  ListPremiumEntitlementsResponseWire,
  ListPremiumPlansResponseWire,
  ListRolesResponseWire,
  SavedMessageListResponseWire,
  SavedMessageVersionGetResponseWire,
  SavedMessageVersionListResponseWire,
  SharedMessageGetResponseWire,
  UserResponseWire,
  ListEmojisResponseWire,
  GetGuildBrandingResponseWire,
  GuildWire,
  ScheduledMessageListResponseWire,
  ScheduledMessagePreviewResponseWire,
  ScheduledMessageRunsResponseWire,
  ScheduledMessageScheduleWire,
} from "./wire";
import type { APIResponse } from "./base";

/**
 * Sorts a list response in place before it is cached, so every consumer gets it in display order
 * and none of them has to copy the array to sort it. Sorting the cached array in a component
 * mutates state react-query owns.
 */
function sorted<T, R extends APIResponse<T[]>>(
  res: R,
  compare: (a: T, b: T) => number,
): R {
  if (res.success) res.data.sort(compare);
  return res;
}

const byGuildName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

// Servers where the user's roles grant Manage Webhooks come first, as the ones they can most likely
// post in. A channel overwrite can still allow it in the rest, so those stay in the list.
const byManageWebhooksThenName = (a: GuildWire, b: GuildWire) =>
  Number(b.can_manage_webhooks) - Number(a.can_manage_webhooks) ||
  byGuildName(a, b);

const byRolePosition = (a: { position: number }, b: { position: number }) =>
  b.position - a.position;

// Categories sort after a channel they tie with, which the channel tree below depends on.
const byChannelPosition = (
  a: { position: number; type: number },
  b: { position: number; type: number },
) => (a.position === b.position && a.type === 4 ? 1 : a.position - b.position);

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
      return fetch(`/api/guilds`)
        .then((res) => handleApiResponse(res.json()))
        .then((res) => sorted(res, byManageWebhooksThenName));
    },
  });
}

export function useGuildChannelsQuery(guildId: string | null) {
  return useQuery<ListChannelsResponseWire>({
    queryKey: ["guild", guildId, "channels"],
    queryFn: () => {
      return fetch(`/api/guilds/${guildId}/channels`)
        .then((res) => handleApiResponse(res.json()))
        .then((res) => sorted(res, byChannelPosition));
    },
    enabled: !!guildId,
  });
}

export function useGuildRolesQuery(guildId: string | null) {
  return useQuery<ListRolesResponseWire>({
    queryKey: ["guild", guildId, "roles"],
    queryFn: () => {
      return fetch(`/api/guilds/${guildId}/roles`)
        .then((res) => handleApiResponse(res.json()))
        .then((res) => sorted(res, byRolePosition));
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

export function useSavedMessageVersionsQuery(
  messageId: string,
  guildId: string | null,
) {
  return useQuery<SavedMessageVersionListResponseWire>({
    queryKey: ["saved-message-versions", guildId, messageId],
    queryFn: () => {
      let url = `/api/saved-messages/${messageId}/versions`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }
      return fetch(url).then((res) => handleApiResponse(res.json()));
    },
  });
}

export function useSavedMessageVersionQuery(
  messageId: string,
  versionId: string | null,
  guildId: string | null,
) {
  return useQuery<SavedMessageVersionGetResponseWire>({
    queryKey: ["saved-message-version", guildId, messageId, versionId],
    queryFn: () => {
      let url = `/api/saved-messages/${messageId}/versions/${versionId}`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }
      return fetch(url).then((res) => handleApiResponse(res.json()));
    },
    enabled: !!versionId,
    // Versions never change.
    staleTime: Infinity,
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

export function useAssistantUsageQuery(guildId: string | null) {
  return useQuery<AssistantUsageResponseWire>({
    queryKey: ["assistant", "usage", guildId],
    queryFn: () =>
      fetch(`/api/assistant/usage?guild_id=${guildId}`).then((res) =>
        handleApiResponse(res.json()),
      ),
    enabled: !!guildId,
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

export function usePremiumPlansQuery() {
  return useQuery<ListPremiumPlansResponseWire>({
    queryKey: ["premium", "plans"],
    queryFn: () =>
      fetch(`/api/premium/plans`).then((res) => handleApiResponse(res.json())),
    // They only change with the config.
    staleTime: Number.POSITIVE_INFINITY,
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
      fetch(`/api/custom-bot/commands?guild_id=${guildId}`)
        .then((res) => handleApiResponse(res.json()))
        .then((res) => sorted(res, byGuildName)),
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

// When a schedule that isn't saved yet would send, null until there is one to ask about.
export function useScheduledMessagePreviewQuery(
  guildId: string | null,
  req: ScheduledMessageScheduleWire | null,
) {
  return useQuery<ScheduledMessagePreviewResponseWire>({
    queryKey: ["scheduled-message-preview", guildId, req],
    queryFn: () =>
      fetch(`/api/scheduled-messages/preview?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: { "Content-Type": "application/json" },
      }).then((res) => handleApiResponse(res.json())),
    enabled: !!guildId && !!req,
    // Keeps the last answer on screen while the next edit is checked.
    placeholderData: keepPreviousData,
  });
}

// When the guild's scheduled messages send between two times, for the calendar.
export function useScheduledMessageRunsQuery(
  guildId: string | null,
  from: string,
  to: string,
) {
  return useQuery<ScheduledMessageRunsResponseWire>({
    queryKey: ["scheduled-message-runs", guildId, from, to],
    queryFn: () =>
      fetch(
        `/api/scheduled-messages/runs?guild_id=${guildId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ).then((res) => handleApiResponse(res.json())),
    enabled: !!guildId,
    placeholderData: keepPreviousData,
  });
}
