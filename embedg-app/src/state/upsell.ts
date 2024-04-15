import { create } from "zustand";
import { persist } from "zustand/middleware";

const upsellAfterSeconds = 5 * 60;

export interface UpsellStateStore {
  pageFirstOpenedAt: number;
  upsellClosed: boolean;

  setUpsellClosed: (upsellClosed: boolean) => void;
  shouldUpsell: () => boolean;
}

export const useUpsellStateStore = create<UpsellStateStore>()(
  persist(
    (set, get) => ({
      pageFirstOpenedAt: Date.now(),
      upsellClosed: false,

      setUpsellClosed: (upsellClosed: boolean) => set({ upsellClosed }),
      shouldUpsell: () => {
        if (get().upsellClosed) {
          return false;
        }

        return Date.now() - get().pageFirstOpenedAt > upsellAfterSeconds * 1000;
      },
    }),
    { name: "upselling", version: 0 }
  )
);
