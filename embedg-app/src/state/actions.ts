import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { MessageActionSet } from "../discord/schema";
import { type ActionSetActions, createActionSetSlice } from "./actionSetSlice";

export interface ActionsStore extends ActionSetActions {
  clear(): void;
  actions: Record<string, MessageActionSet>;
}

export const createActionStore = (key: string) =>
  create<ActionsStore>()(
    immer(
      persist(
        (set, _get) => ({
          actions: {},

          clear: () => set({ actions: {} }),

          ...createActionSetSlice<ActionsStore>(set),
        }),
        { name: key, version: 0 },
      ),
    ),
  );

export const useCommandActionsStore = createActionStore(
  "custom-commands-actions",
);
