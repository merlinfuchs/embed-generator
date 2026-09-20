import { createJSONStorage } from "zustand/middleware";

/**
 * Where every persisted store keeps its state. Zustand defaults to
 * `window.localStorage`, but the rest of the app reads `localStorage` as a
 * plain global, and saying so here keeps the two from disagreeing.
 */
export const localStorageJSON = createJSONStorage(() => localStorage);
