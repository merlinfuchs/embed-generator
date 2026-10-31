import { localStorageJSON } from "./storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light" | "system";

interface Settings {
  theme: Theme;
  editHistoryEnabled: boolean;
  alwaysCollapseSidebar: boolean;
  confirmOnExit: boolean;
}

interface SettingsStore extends Settings {
  setTheme: (theme: Theme) => void;
  setEditHistoryEnabled: (enabled: boolean) => void;
  setAlwaysCollapseSidebar: (enabled: boolean) => void;
  setConfirmOnExit: (enabled: boolean) => void;
}

const defaultSettings: Settings = {
  theme: "dark",
  editHistoryEnabled: true,
  alwaysCollapseSidebar: false,
  confirmOnExit: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setTheme: (theme) => set({ theme }),
      setEditHistoryEnabled: (enabled) => set({ editHistoryEnabled: enabled }),
      setAlwaysCollapseSidebar: (enabled) =>
        set({ alwaysCollapseSidebar: enabled }),
      setConfirmOnExit: (enabled) => set({ confirmOnExit: enabled }),
    }),
    { name: "settings", storage: localStorageJSON },
  ),
);
