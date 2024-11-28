import { useMutation, useQueryClient } from "react-query";
import {
  AssistantGenerateMessageRequestWire,
  AssistantGenerateMessageResponseWire,
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
  SavedMessageCreateResponseWire,
  SavedMessageDeleteResponseWire,
  SavedMessageUpdateResponseWire,
  SavedMessagesImportRequestWire,
  SavedMessagesImportResponseWire,
  ScheduledMessageCreateRequestWire,
  ScheduledMessageCreateResponseWire,
  ScheduledMessageDeleteResponseWire,
  ScheduledMessageUpdateRequestWire,
  ScheduledMessageUpdateResponseWire,
  SharedMessageCreateRequestWire,
  SharedMessageGetResponseWire,
  UploadImageResponseWire,
} from "./wire";
import { handleApiResponse } from "./queries";
import { fetchApi } from "./client";

export function useAssistantGenerateMessageMutation() {
  return useMutation(
    ({
      guildId,
      req,
    }: {
      req: AssistantGenerateMessageRequestWire;
      guildId: string;
    }) => {
      return fetchApi(`/api/assistant/message?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<AssistantGenerateMessageResponseWire>(res.json())
      );
    }
  );
}

export function useSendMessageToChannelMutation() {
  return useMutation((req: MessageSendToChannelRequestWire) => {
    return fetchApi(`/api/send-message/channel`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => handleApiResponse<MessageSendResponseWire>(res.json()));
  });
}

export function useSendMessageToWebhookMutation() {
  return useMutation((req: MessageSendToWebhookRequestWire) => {
    return fetchApi(`/api/send-message/webhook`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => handleApiResponse<MessageSendResponseWire>(res.json()));
  });
}

export function useRestoreMessageFromWebhookMutation() {
  return useMutation((req: MessageRestoreFromWebhookRequestWire) => {
    return fetchApi(`/api/restore-message/webhook`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => handleApiResponse<MessageRestoreResponseWire>(res.json()));
  });
}

export function useRestoreMessageFromChannelMutation() {
  return useMutation((req: MessageRestoreFromChannelRequestWire) => {
    return fetchApi(`/api/restore-message/channel`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => handleApiResponse<MessageRestoreResponseWire>(res.json()));
  });
}

export function useCreatedSavedMessageMutation() {
  return useMutation(
    ({
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

      return fetchApi(url, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessageCreateResponseWire>(res.json())
      );
    }
  );
}

export function useUpdateSavedMessageMutation() {
  return useMutation(
    ({
      messageId,
      req,
      guildId,
    }: {
      messageId: string;
      req: SavedMessageCreateRequestWire;
      guildId: string | null;
    }) => {
      let url = `/api/saved-messages/${messageId}`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      return fetchApi(url, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessageUpdateResponseWire>(res.json())
      );
    }
  );
}

export function useDeleteSavedMessageMutation() {
  return useMutation(
    ({ messageId, guildId }: { messageId: string; guildId: string | null }) => {
      let url = `/api/saved-messages/${messageId}`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      return fetchApi(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessageDeleteResponseWire>(res.json())
      );
    }
  );
}

export function useImportSavedMessagesMutation() {
  return useMutation(
    ({
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

      return fetchApi(url, {
        method: "PATCH",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<SavedMessagesImportResponseWire>(res.json())
      );
    }
  );
}

export function useSharedMessageCreateMutation() {
  return useMutation((req: SharedMessageCreateRequestWire) => {
    return fetchApi("/api/shared-messages", {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) =>
      handleApiResponse<SharedMessageGetResponseWire>(res.json())
    );
  });
}

export function useCustomBotConfigureMutation() {
  return useMutation(
    ({
      guildId,
      req,
    }: {
      guildId: string;
      req: CustomBotConfigureRequestWire;
    }) => {
      return fetchApi(`/api/custom-bot?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomBotConfigureResponseWire>(res.json())
      );
    }
  );
}

export function useCustomBotDisableMutation() {
  return useMutation(({ guildId }: { guildId: string }) => {
    return fetchApi(`/api/custom-bot?guild_id=${guildId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) =>
      handleApiResponse<CustomBotDisableResponseWire>(res.json())
    );
  });
}

export function useCustomBotUpdatePresenceMutation() {
  return useMutation(
    ({
      guildId,
      req,
    }: {
      guildId: string;
      req: CustomBotUpdatePresenceRequestWire;
    }) => {
      return fetchApi(`/api/custom-bot/presence?guild_id=${guildId}`, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomBotUpdatePresenceResponseWire>(res.json())
      );
    }
  );
}

export function useCustomCommandCreateMutation() {
  return useMutation(
    ({
      guildId,
      req,
    }: {
      guildId: string;
      req: CustomCommandCreateRequestWire;
    }) => {
      return fetchApi(`/api/custom-bot/commands?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<CustomCommandCreateResponseWire>(res.json())
      );
    }
  );
}

export function useCustomCommandUpdateMutation() {
  return useMutation(
    ({
      commandId,
      guildId,
      req,
    }: {
      commandId: string;
      guildId: string;
      req: CustomCommandUpdateRequestWire;
    }) => {
      return fetchApi(
        `/api/custom-bot/commands/${commandId}?guild_id=${guildId}`,
        {
          method: "PUT",
          body: JSON.stringify(req),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) =>
        handleApiResponse<CustomCommandUpdateResponseWire>(res.json())
      );
    }
  );
}

export function useCustomCommandsDeployMutation() {
  return useMutation(({ guildId }: { guildId: string }) => {
    return fetchApi(`/api/custom-bot/commands/deploy?guild_id=${guildId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) =>
      handleApiResponse<CustomCommandsDeployResponseWire>(res.json())
    );
  });
}

export function useCustomCommandDeleteMutation() {
  return useMutation(
    ({ commandId, guildId }: { commandId: string; guildId: string }) => {
      return fetchApi(
        `/api/custom-bot/commands/${commandId}?guild_id=${guildId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) =>
        handleApiResponse<CustomCommandDeleteResponseWire>(res.json())
      );
    }
  );
}

export function useUploadImageMutation() {
  return useMutation(
    ({ guildId, file }: { guildId: string | null; file: File }) => {
      let url = `/api/images`;
      if (guildId) {
        url += `?guild_id=${guildId}`;
      }

      const body = new FormData();
      body.append("file", file);

      return fetchApi(url, {
        method: "POST",
        body,
      }).then((res) => handleApiResponse<UploadImageResponseWire>(res.json()));
    }
  );
}

export function useScheduledMessageCreateMutation() {
  return useMutation(
    ({
      guildId,
      req,
    }: {
      guildId: string;
      req: ScheduledMessageCreateRequestWire;
    }) => {
      return fetchApi(`/api/scheduled-messages?guild_id=${guildId}`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ScheduledMessageCreateResponseWire>(res.json())
      );
    }
  );
}

export function useScheduledMessageUpdateMutation() {
  return useMutation(
    ({
      messageId,
      guildId,
      req,
    }: {
      messageId: string;
      guildId: string;
      req: ScheduledMessageUpdateRequestWire;
    }) => {
      return fetchApi(
        `/api/scheduled-messages/${messageId}?guild_id=${guildId}`,
        {
          method: "PUT",
          body: JSON.stringify(req),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) =>
        handleApiResponse<ScheduledMessageUpdateResponseWire>(res.json())
      );
    }
  );
}

export function useScheduledMessageDeleteMutation() {
  return useMutation(
    ({ messageId, guildId }: { messageId: string; guildId: string }) => {
      return fetchApi(
        `/api/scheduled-messages/${messageId}?guild_id=${guildId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) =>
        handleApiResponse<ScheduledMessageDeleteResponseWire>(res.json())
      );
    }
  );
}

export function useEmbedLinkCreateMutation() {
  return useMutation((req: EmbedLinkCreateRequestWire) => {
    return fetchApi(`/api/embed-links`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) =>
      handleApiResponse<EmbedLinkCreateResponseWire>(res.json())
    );
  });
}

export function usePremiumEntitlementConsumeMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      entitlementId,
      req,
    }: {
      entitlementId: string;
      req: ConsumeEntitlementRequestWire;
    }) => {
      return fetchApi(`/api/premium/entitlements/${entitlementId}/consume`, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        handleApiResponse<ConsumeEntitlementResponseWire>(res.json())
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["premium"]);
      },
    }
  );
}
