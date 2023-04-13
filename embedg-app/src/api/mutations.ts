import { useMutation } from "react-query";
import {
  GenerateMagicMessageRequestWire,
  GenerateMagicMessageResponseWire,
  MessageSendResponseWire,
  MessageSendToChannelRequestWire,
  MessageSendToWebhookRequestWire,
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
