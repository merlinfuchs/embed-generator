import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useGuildsQuery } from "../api/queries";

interface SelectedGuildStore {
  guildId: string | null;
  setGuildId: (guildId: string | null) => void;
}

export const useSelectedGuildStore = create<SelectedGuildStore>()(
  persist(
    (set) => ({
      guildId: null,
      setGuildId: (guildId: string | null) => set({ guildId }),
    }),
    { name: "selected-guild" }
  )
);

export default function useSelectedGuild() {
  const { data: guilds } = useGuildsQuery();
  const selectedGuildId = useSelectedGuildStore((state) => state.guildId);
  return guilds?.success
    ? guilds.data.find((guild) => guild.id === selectedGuildId)
    : null;
}
