import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Settings {
  editHistoryEnabled: boolean;
  alwaysCollapseSidebar: boolean;
  confirmOnExit: boolean;
}

interface SettingsStore extends Settings {
  setEditHistoryEnabled: (enabled: boolean) => void;
  setAlwaysCollapseSidebar: (enabled: boolean) => void;
  setConfirmOnExit: (enabled: boolean) => void;
}

const defaultSettings: Settings = {
  editHistoryEnabled: true,
  alwaysCollapseSidebar: false,
  confirmOnExit: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setEditHistoryEnabled: (enabled) => set({ editHistoryEnabled: enabled }),
      setAlwaysCollapseSidebar: (enabled) =>
        set({ alwaysCollapseSidebar: enabled }),
      setConfirmOnExit: (enabled) => set({ confirmOnExit: enabled }),
    }),
    { name: "settings" }
  )
);
