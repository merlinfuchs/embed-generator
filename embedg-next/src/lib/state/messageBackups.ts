import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Message } from "../schema/message";

export interface MessageBackup {
  name: string;
  data: Message;
  updatedAt: Date;
}

export interface MessageBackupStore {
  backups: MessageBackup[];

  hasBackup(name: string): boolean;
  addBackup(name: string, data: Message): void;
  removeBackup(name: string): void;
  overwriteBackup(name: string, data: Message): void;
}

export const useCurrentWebhookStore = create<MessageBackupStore>()(
  persist(
    (set, get) => ({
      backups: [],
      hasBackup: (name) => {
        return get().backups.some((backup) => backup.name === name);
      },
      addBackup: (name, data) => {
        set((state) => ({
          backups: [...state.backups, { name, data, updatedAt: new Date() }],
        }));
      },
      removeBackup: (name) => {
        set((state) => ({
          backups: state.backups.filter((backup) => backup.name !== name),
        }));
      },
      overwriteBackup: (name, data) => {
        set((state) => ({
          backups: state.backups.map((backup) =>
            backup.name === name
              ? { name, data, updatedAt: new Date() }
              : backup
          ),
        }));
      },
    }),
    { name: "message-backups" }
  )
);

const storage = createJSONStorage(() => localStorage, {
  reviver: (key, value: any) => {
    if (key === "updatedAt") {
      return new Date(value);
    }
    return value;
  },
  replacer: (key, value: any) => {
    if (key === "updatedAt") {
      return value.toISOString();
    }
    return value;
  },
});
