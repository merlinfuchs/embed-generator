import { parseWebhookUrl, type WebhookPlatform } from "../discord/util";
import { localStorageJSON } from "./storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

export interface SendSettingsStore {
  mode: "webhook" | "channel";

  messageId: string | null;

  // webhook
  webhookUrl: string | null;
  threadId: string | null;

  // channel
  guildId: string | null;
  channelId: string | null;
  threadName: string | null;

  setMode: (mode: "webhook" | "channel") => void;
  setMessageId: (messageId: string | null) => void;
  setWebhookUrl: (webhookId: string | null) => void;
  setThreadId: (threadId: string | null) => void;
  setGuildId: (guildId: string | null) => void;
  setChannelId: (channelId: string | null) => void;
  setThreadName: (threadName: string | null) => void;
}

export const useSendSettingsStore = create<SendSettingsStore>()(
  persist(
    (set) => ({
      mode: "webhook",
      messageId: null,
      webhookUrl: null,
      threadId: null,
      guildId: null,
      channelId: null,
      threadName: null,

      setMode: (mode: "webhook" | "channel") => set({ mode }),
      setMessageId: (messageId: string | null) => set({ messageId }),
      setWebhookUrl: (webhookUrl: string | null) => set({ webhookUrl }),
      setThreadId: (threadId: string | null) => set({ threadId }),
      setGuildId: (guildId: string | null) => set({ guildId }),
      setChannelId: (channelId: string | null) => set({ channelId }),
      setThreadName: (threadName: string | null) => set({ threadName }),
    }),
    { name: "send-settings", version: 0, storage: localStorageJSON },
  ),
);

interface WebhookTarget {
  platform: WebhookPlatform;
  id: string;
  token: string;
  threadId: string | null;
}

/** The webhook the message goes to, with the thread left out where the platform has none. */
function webhookTarget(state: SendSettingsStore): WebhookTarget | null {
  if (state.mode !== "webhook" || !state.webhookUrl) return null;

  const webhook = parseWebhookUrl(state.webhookUrl);
  if (!webhook) return null;

  return {
    ...webhook,
    threadId: webhook.platform === "fluxer" ? null : state.threadId,
  };
}

export const useWebhookTarget = () =>
  useSendSettingsStore(useShallow(webhookTarget));

export const useSendsToFluxer = () =>
  useSendSettingsStore((state) => webhookTarget(state)?.platform === "fluxer");
