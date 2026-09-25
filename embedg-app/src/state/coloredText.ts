import { localStorageJSON } from "./storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** What the colored text tool starts with. */
export const DEFAULT_COLORED_TEXT =
  "\x1b[45mJust select\x1b[0m \x1b[34msome text\x1b[0m and \x1b[32mclick\x1b[0m on the \x1b[1;31mcolor\x1b[0m or \x1b[4mformat that you like\x1b[0m!";

interface ColoredTextStore {
  /** The colored text tool's content as ANSI. */
  text: string;
  setText: (text: string) => void;
}

export const useColoredTextStore = create<ColoredTextStore>()(
  persist(
    (set) => ({
      text: DEFAULT_COLORED_TEXT,
      setText: (text) => set({ text }),
    }),
    { name: "colored-text", version: 0, storage: localStorageJSON },
  ),
);
