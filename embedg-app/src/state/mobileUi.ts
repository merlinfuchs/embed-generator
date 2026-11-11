import { create } from "zustand";

interface MobileUiStore {
  /** The "More" sheet of the mobile bottom bar. */
  moreOpen: boolean;
  setMoreOpen: (open: boolean) => void;
}

export const useMobileUiStore = create<MobileUiStore>()((set) => ({
  moreOpen: false,
  setMoreOpen: (open) => set({ moreOpen: open }),
}));
