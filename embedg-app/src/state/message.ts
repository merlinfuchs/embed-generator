import debounce from "just-debounce-it";
import { type TemporalState, temporal } from "zundo";
import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { defaultMessage } from "../discord/defaultMessage";
import type { Message } from "../discord/schema";

export interface MessageStore extends Message {
  clear(): void;
  replace(message: Message): void;
  setContent: (content: string) => void;
  setUsername: (username: string | undefined) => void;
  setAvatarUrl: (avatar_url: string | undefined) => void;
  setThreadName: (thread_name: string | undefined) => void;
  getComponentsV2Enabled: () => boolean;
  setComponentsV2Enabled: (enabled: boolean) => void;
}

export const createMessageStore = (key: string) =>
  create<MessageStore>()(
    immer(
      persist(
        temporal(
          (set, get) => ({
            ...defaultMessage,

            clear: () => set(defaultMessage),
            replace: (message: Message) => set(message),
            setContent: (content: string) => set({ content }),
            setUsername: (username: string | undefined) => set({ username }),
            setAvatarUrl: (avatar_url: string | undefined) =>
              set({ avatar_url }),
            setThreadName: (thread_name: string | undefined) =>
              set({ thread_name }),
            getComponentsV2Enabled: () => {
              const state = get();
              const flags = state.flags ?? 0;
              return (flags & (1 << 15)) !== 0;
            },
            setComponentsV2Enabled: (enabled: boolean) => {
              if (enabled) {
                set({
                  content: "",
                  embeds: [],
                  actions: {},
                  components: [],
                  flags: 1 << 15,
                });
              } else {
                set(defaultMessage);
              }
            },
          }),
          {
            limit: 10,
            handleSet: (handleSet) => debounce(handleSet, 1000, true),
          },
        ),
        { name: key, version: 0 },
      ),
    ),
  );

export const MESSAGE_STORE_KEY = "current-message";

export const useCurrentMessageStore = createMessageStore(MESSAGE_STORE_KEY);

export const useCurrentMessageUndoStore = <T>(
  selector: (state: TemporalState<MessageStore>) => T,
) => useStore(useCurrentMessageStore.temporal, selector);
