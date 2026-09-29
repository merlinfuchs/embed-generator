import { create } from "zustand";
import type { AssistantChatMessageWire, AssistantFieldWire } from "../api/wire";

export interface AssistantChatEntry extends AssistantChatMessageWire {
  // A request the user can send to make the change the answer suggests.
  buildPrompt?: string;
  // What the assistant asks the user to fill in.
  fields?: AssistantFieldWire[];
  // Problems left with the assistant's message.
  issues?: string[];
  repaired?: boolean;
  // The prompt failed, and content is the error.
  failed?: boolean;
}

/**
 * The chat with the assistant. Kept outside the panel, so closing it neither
 * loses the chat nor a prompt that is still running.
 */
export interface AssistantStore {
  // The server the chat is about, as it uses its roles and prompts.
  guildId: string | null;
  entries: AssistantChatEntry[];
  busy: boolean;

  /** Starts a new chat if the server changed. */
  setGuildId: (guildId: string | null) => void;
  /** Adds the entry unless the chat moved on to another server since. */
  addEntry: (guildId: string, entry: AssistantChatEntry) => void;
  setBusy: (busy: boolean) => void;
  clear: () => void;
}

export const useAssistantStore = create<AssistantStore>()((set) => ({
  guildId: null,
  entries: [],
  busy: false,

  setGuildId: (guildId) =>
    set((s) => (s.guildId === guildId ? s : { guildId, entries: [] })),
  addEntry: (guildId, entry) =>
    set((s) =>
      s.guildId === guildId ? { entries: [...s.entries, entry] } : s,
    ),
  setBusy: (busy) => set({ busy }),
  clear: () => set({ entries: [] }),
}));
