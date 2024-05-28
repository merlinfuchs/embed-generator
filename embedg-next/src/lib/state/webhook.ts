import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WebhookStore {
  webhookUrl?: string;
  threadId?: string;
  messageId?: string;

  setWebhookUrl(webhookUrl: string | undefined): void;
  setThreadId(threadId: string | undefined): void;
  setMessageId(messageId: string | undefined): void;
}

export const useCurrentWebhookStore = create<WebhookStore>()(
  persist(
    (set) => ({
      setWebhookUrl: (webhookUrl) => {
        set({ webhookUrl });
      },
      setThreadId: (threadId) => {
        set({ threadId });
      },
      setMessageId: (messageId) => {
        set({ messageId });
      },
    }),
    { name: "current-webhook" }
  )
);
