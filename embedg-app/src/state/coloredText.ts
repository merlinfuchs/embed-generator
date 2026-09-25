import { localStorageJSON } from "./storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColoredTextStore {
  /** The colored text tool's content as ANSI, null until it is first edited. */
  text: string | null;
  setText: (text: string) => void;
}

export const useColoredTextStore = create<ColoredTextStore>()(
  persist(
    (set) => ({
      text: null,
      setText: (text) => set({ text }),
    }),
    { name: "colored-text", version: 0, storage: localStorageJSON },
  ),
);
