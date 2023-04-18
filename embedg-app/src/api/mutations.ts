import { useMutation } from "react-query";
import {
  GenerateMagicMessageRequestWire,
  GenerateMagicMessageResponseWire,
  MessageSendResponseWire,
  MessageSendToChannelRequestWire,
  MessageSendToWebhookRequestWire,
  SavedMessageCreateRequestWire,
  SavedMessageCreateResponseWire,
  SavedMessageDeleteResponseWire,
  SavedMessageUpdateResponseWire,
} from "./wire";

export function useGenerateMagicMessageMutation() {
  return useMutation((req: GenerateMagicMessageRequestWire) => {
    return fetch(`/api/magic/message`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        return (await res.json()) as GenerateMagicMessageResponseWire;
      } else {
        throw new Error("Failed to generate magic message");
      }
    });
  });
}

export function useSendMessageToChannelMutation() {
  return useMutation((req: MessageSendToChannelRequestWire) => {
    return fetch(`/api/send-message/channel`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        return (await res.json()) as MessageSendResponseWire;
      } else {
        throw new Error("Failed to send message to channel");
      }
    });
  });
}

export function useSendMessageToWebhookMutation() {
  return useMutation((req: MessageSendToWebhookRequestWire) => {
    return fetch(`/api/send-message/webhook`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        return (await res.json()) as MessageSendResponseWire;
      } else {
        throw new Error("Failed to send message to channel");
      }
    });
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

      return fetch(url, {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          return (await res.json()) as SavedMessageCreateResponseWire;
        } else {
          throw new Error("Failed to send message to channel");
        }
      });
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

      return fetch(url, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          return (await res.json()) as SavedMessageUpdateResponseWire;
        } else {
          throw new Error("Failed to send message to channel");
        }
      });
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

      return fetch(url, {
        method: "Delete",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          return (await res.json()) as SavedMessageDeleteResponseWire;
        } else {
          throw new Error("Failed to send message to channel");
        }
      });
    }
  );
}
