import { localStorageJSON } from "./storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { MessageActionSet } from "../discord/schema";
import { type ActionSetActions, createActionSetSlice } from "./actionSetSlice";

export interface ActionsStore extends ActionSetActions {
  clear(): void;
  actions: Record<string, MessageActionSet>;
}

export const createActionStore = (
  key: string,
  partialize?: (state: ActionsStore) => Partial<ActionsStore>,
) =>
  create<ActionsStore>()(
    immer(
      persist(
        (set, _get) => ({
          actions: {},

          clear: () => set({ actions: {} }),

          ...createActionSetSlice<ActionsStore>(set),
        }),
        {
          name: key,
          version: 0,
          storage: localStorageJSON,
          // An undefined partialize would replace persist's default and store nothing.
          ...(partialize && { partialize }),
        },
      ),
    ),
  );

export const useCommandActionsStore = createActionStore(
  "custom-commands-actions",
);

// Saved forms are seeded from the server whenever they're opened, so only the unsaved new one is
// worth keeping across reloads.
export const useFormActionsStore = createActionStore("form-actions", (s) => {
  const actions: ActionsStore["actions"] = {};
  if (s.actions.new) actions.new = s.actions.new;
  return { actions };
});
