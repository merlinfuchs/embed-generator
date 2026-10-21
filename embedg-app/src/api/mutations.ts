import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AssistantChatRequestWire,
  AssistantChatResponseWire,
  ConsumeEntitlementRequestWire,
  ConsumeEntitlementResponseWire,
  CustomBotConfigureRequestWire,
  CustomBotConfigureResponseWire,
  CustomBotDisableResponseWire,
  CustomBotUpdatePresenceRequestWire,
  CustomBotUpdatePresenceResponseWire,
  CustomCommandCreateRequestWire,
  CustomCommandCreateResponseWire,
  CustomCommandDeleteResponseWire,
  CustomCommandUpdateRequestWire,
  CustomCommandUpdateResponseWire,
  CustomCommandsDeployResponseWire,
  EmbedLinkCreateRequestWire,
  EmbedLinkCreateResponseWire,
  MessageRestoreFromChannelRequestWire,
  MessageRestoreFromWebhookRequestWire,
  MessageRestoreResponseWire,
  MessageSendResponseWire,
  MessageSendToChannelRequestWire,
  MessageSendToWebhookRequestWire,
  SavedMessageCreateRequestWire,
  SavedMessageUpdateRequestWire,
  SavedMessageCreateResponseWire,
  SavedMessageDeleteResponseWire,
  SavedMessageUpdateResponseWire,
  SavedMessagesImportRequestWire,
  SavedMessagesImportResponseWire,
  ScheduledMessageCreateRequestWire,
  ScheduledMessageCreateResponseWire,
  ScheduledMessageDeleteResponseWire,
  ScheduledMessageTestRequestWire,
  ScheduledMessageTestResponseWire,
  ScheduledMessageUpdateRequestWire,
  ScheduledMessageUpdateResponseWire,
  SharedMessageCreateRequestWire,
  SharedMessageGetResponseWire,
  UploadImageResponseWire,
} from "./wire";
import { handleApiResponse } from "./queries";
import type { APIResponse } from "./base";
import { op } from "../util/analytics";
import { COMPONENTS_V2_FLAG } from "../discord/schema";

// The shape of a sent message, never its content.
function messageProperties(data: Record<string, any> | null) {
  return {
    components_v2: ((data?.flags ?? 0) & COMPONENTS_V2_FLAG) !== 0,
    embeds: data?.embeds?.length ?? 0,
    components: data?.components?.length ?? 0,
  };
}

function trackSend<V>(
  mode: string,
  properties: (req: V) => Record<string, unknown>,
) {
  return {
    onSuccess: (res: APIResponse<unknown>, req: V) => {
      if (res.success) {
        op.track("message_sent", { mode, ...properties(req) });
      } else {
        op.track("message_send_failed", { mode, code: res.error.code });
      }
    },
    // The request failed or the response wasn't JSON, like a proxy error page.
    onError: () =>
      op.track("message_send_failed", { mode, code: "request_failed" }),
  };
}

function trackOnSuccess<V>(
  name: string,
  properties?: (vars: V) => Record<string, unknown>,
) {
  return (res: APIResponse<unknown>, vars: V) => {
    if (res.success) op.track(name, properties?.(vars));
  };
}

export function useAssistantChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      guildId,
      req,
    }: {
      guildId: string;
      req: AssistantChatRequestWire;
    }) => {
      return fetch(`/api/assistant/chat?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<AssistantChatResponseWire>(res.json()),
      );
    },
    onSettled: (res, _err, { guildId }) => {
      if (res) {
        op.track("assistant_prompt", {
          success: res.success,
          changed: res.success && !!res.data.data,
          code: res.success ? undefined : res.error.code,
        });
      }

      if (res?.success) {
        queryClient.setQueryData(["assistant", "usage", guildId], {
          success: true,
          data: res.data.usage,
        });
      } else {
        // Answers that failed can still have used up a prompt.
        queryClient.invalidateQueries({
          queryKey: ["assistant", "usage", guildId],
        });
      }
    },
  });
}

export function useSendMessageToChannelMutation() {
  return useMutation({
    mutationFn: (req: MessageSendToChannelRequestWire) => {
      return fetch(`/api/send-message/channel`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => handleApiResponse<MessageSendResponseWire>(res.json()));
    },
    ...trackSend("channel", (req: MessageSendToChannelRequestWire) => ({
      edit: !!req.message_id,
      new_thread: !!req.thread_name,
      attachments: req.attachments.length,
      ...messageProperties(req.data),
    })),
  });
}

export function useSendMessageToWebhookMutation() {
  return useMutation({
    mutationFn: (req: MessageSendToWebhookRequestWire) => {
      return fetch(`/api/send-message/webhook`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => handleApiResponse<MessageSendResponseWire>(res.json()));
    },
    ...trackSend("webhook", (req: MessageSendToWebhookRequestWire) => ({
      platform: req.webhook_platform,
      edit: !!req.message_id,
      in_thread: !!req.thread_id,
      attachments: req.attachments.length,
      ...messageProperties(req.data),
    })),
  });
}

export function useRestoreMessageFromWebhookMutation() {
  return useMutation({
    mutationFn: (req: MessageRestoreFromWebhookRequestWire) => {
      return fetch(`/api/restore-message/webhook`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<MessageRestoreResponseWire>(res.json()),
      );
    },
  });
}

export function useRestoreMessageFromChannelMutation() {
  return useMutation({
    mutationFn: (req: MessageRestoreFromChannelRequestWire) => {
      return fetch(`/api/restore-message/channel`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<MessageRestoreResponseWire>(res.json()),
      );
    },
  });
}

export function useCreatedSavedMessageMutation() {
  return useMutation({
    mutationFn: ({
      req,
      guildId,
    }: {
      req: SavedMessageCreateRequestWire;
      guildId: string | null;
    }) => {
      let url = `/api/saved-messages`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      return fetch(url, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessageCreateResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("message_saved", ({ guildId }) => ({
      new: true,
      guild: !!guildId,
    })),
  });
}

export function useUpdateSavedMessageMutation() {
  return useMutation({
    mutationFn: ({
      messageId,
      req,
      guildId,
    }: {
      messageId: string;
      req: SavedMessageUpdateRequestWire;
      guildId: string | null;
    }) => {
      let url = `/api/saved-messages/${messageId}`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      return fetch(url, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessageUpdateResponseWire>(res.json()),
      );
    },
    onSuccess: (res, { req, guildId }) => {
      // Renames leave the data out and aren't a save of the message.
      if (res.success && req.data !== undefined) {
        op.track("message_saved", { new: false, guild: !!guildId });
      }
    },
  });
}

export function useDeleteSavedMessageMutation() {
  return useMutation({
    mutationFn: ({
      messageId,
      guildId,
    }: {
      messageId: string;
      guildId: string | null;
    }) => {
      let url = `/api/saved-messages/${messageId}`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      return fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessageDeleteResponseWire>(res.json()),
      );
    },
  });
}

export function useImportSavedMessagesMutation() {
  return useMutation({
    mutationFn: ({
      req,
      guildId,
    }: {
      req: SavedMessagesImportRequestWire;
      guildId: string | null;
    }) => {
      let url = `/api/saved-messages`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      return fetch(url, {
        method: "PATCH",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessagesImportResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("messages_imported", ({ req, guildId }) => ({
      count: req.messages.length,
      guild: !!guildId,
    })),
  });
}

export function useSharedMessageCreateMutation() {
  return useMutation({
    mutationFn: (req: SharedMessageCreateRequestWire) => {
      return fetch("/api/shared-messages", {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SharedMessageGetResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("message_shared"),
  });
}

export function useCustomBotConfigureMutation() {
  return useMutation({
    mutationFn: ({
      guildId,
      req,
    }: {
      guildId: string;
      req: CustomBotConfigureRequestWire;
    }) => {
      return fetch(`/api/custom-bot?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomBotConfigureResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("custom_bot_configured"),
  });
}

export function useCustomBotDisableMutation() {
  return useMutation({
    mutationFn: ({ guildId }: { guildId: string }) => {
      return fetch(`/api/custom-bot?guild_id=${guildId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomBotDisableResponseWire>(res.json()),
      );
    },
  });
}

export function useCustomBotUpdatePresenceMutation() {
  return useMutation({
    mutationFn: ({
      guildId,
      req,
    }: {
      guildId: string;
      req: CustomBotUpdatePresenceRequestWire;
    }) => {
      return fetch(`/api/custom-bot/presence?guild_id=${guildId}`, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomBotUpdatePresenceResponseWire>(res.json()),
      );
    },
  });
}

export function useCustomCommandCreateMutation() {
  return useMutation({
    mutationFn: ({
      guildId,
      req,
    }: {
      guildId: string;
      req: CustomCommandCreateRequestWire;
    }) => {
      return fetch(`/api/custom-bot/commands?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomCommandCreateResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("custom_command_created", ({ req }) => ({
      parameters: req.parameters.length,
    })),
  });
}

export function useCustomCommandUpdateMutation() {
  return useMutation({
    mutationFn: ({
      commandId,
      guildId,
      req,
    }: {
      commandId: string;
      guildId: string;
      req: CustomCommandUpdateRequestWire;
    }) => {
      return fetch(
        `/api/custom-bot/commands/${commandId}?guild_id=${guildId}`,
        {
          method: "PUT",
          body: JSON.stringify(req),
          headers: {
            "Content-Type": "application/json",
          },
        },
      ).then((res) =>
        handleApiResponse<CustomCommandUpdateResponseWire>(res.json()),
      );
    },
  });
}

export function useCustomCommandsDeployMutation() {
  return useMutation({
    mutationFn: ({ guildId }: { guildId: string }) => {
      return fetch(`/api/custom-bot/commands/deploy?guild_id=${guildId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomCommandsDeployResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("custom_commands_deployed"),
  });
}

export function useCustomCommandDeleteMutation() {
  return useMutation({
    mutationFn: ({
      commandId,
      guildId,
    }: {
      commandId: string;
      guildId: string;
    }) => {
      return fetch(
        `/api/custom-bot/commands/${commandId}?guild_id=${guildId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      ).then((res) =>
        handleApiResponse<CustomCommandDeleteResponseWire>(res.json()),
      );
    },
  });
}

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: ({ guildId, file }: { guildId: string | null; file: File }) => {
      let url = `/api/images`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      const body = new FormData();
      body.append("file", file);

      return fetch(url, {
        method: "POST",
        body,
      }).then((res) => handleApiResponse<UploadImageResponseWire>(res.json()));
    },
    onSuccess: trackOnSuccess("image_uploaded"),
  });
}

export function useScheduledMessageCreateMutation() {
  return useMutation({
    mutationFn: ({
      guildId,
      req,
    }: {
      guildId: string;
      req: ScheduledMessageCreateRequestWire;
    }) => {
      return fetch(`/api/scheduled-messages?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ScheduledMessageCreateResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("scheduled_message_created", ({ req }) => ({
      repeating: !!req.cron_expression,
      run_times: req.run_times?.length ?? 0,
      enabled: req.enabled,
    })),
  });
}

export function useScheduledMessageUpdateMutation() {
  return useMutation({
    mutationFn: ({
      messageId,
      guildId,
      req,
    }: {
      messageId: string;
      guildId: string;
      req: ScheduledMessageUpdateRequestWire;
    }) => {
      return fetch(`/api/scheduled-messages/${messageId}?guild_id=${guildId}`, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ScheduledMessageUpdateResponseWire>(res.json()),
      );
    },
  });
}

export function useScheduledMessageTestMutation() {
  return useMutation({
    mutationFn: ({
      guildId,
      req,
    }: {
      guildId: string;
      req: ScheduledMessageTestRequestWire;
    }) => {
      return fetch(`/api/scheduled-messages/test?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ScheduledMessageTestResponseWire>(res.json()),
      );
    },
  });
}

export function useScheduledMessageDeleteMutation() {
  return useMutation({
    mutationFn: ({
      messageId,
      guildId,
    }: {
      messageId: string;
      guildId: string;
    }) => {
      return fetch(`/api/scheduled-messages/${messageId}?guild_id=${guildId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ScheduledMessageDeleteResponseWire>(res.json()),
      );
    },
  });
}

export function useEmbedLinkCreateMutation() {
  return useMutation({
    mutationFn: (req: EmbedLinkCreateRequestWire) => {
      return fetch(`/api/embed-links`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<EmbedLinkCreateResponseWire>(res.json()),
      );
    },
    onSuccess: trackOnSuccess("embed_link_created", (req) => ({
      component_embed: !!req.component_embed,
    })),
  });
}

export function usePremiumEntitlementConsumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entitlementId,
      req,
    }: {
      entitlementId: string;
      req: ConsumeEntitlementRequestWire;
    }) => {
      return fetch(`/api/premium/entitlements/${entitlementId}/consume`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ConsumeEntitlementResponseWire>(res.json()),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium"] });
    },
  });
}
