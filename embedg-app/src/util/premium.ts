import { usePremiumGuildFeaturesQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";

export function usePremiumFeatures(guildId?: string | null) {
  const selectedGuildID = useSendSettingsStore().guildId;
  if (!guildId) {
    guildId = selectedGuildID;
  }

  const { data } = usePremiumGuildFeaturesQuery(guildId);

  if (!data?.success) {
    return null;
  }

  return data.data;
}
