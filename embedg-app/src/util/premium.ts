import {
  usePremiumGuildFeaturesQuery,
  usePremiumUserFeaturesQuery,
} from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";

export function usePremiumGuildFeatures(guildId?: string | null) {
  const selectedGuildID = useSendSettingsStore().guildId;
  if (guildId === undefined) {
    guildId = selectedGuildID;
  }

  const { data } = usePremiumGuildFeaturesQuery(guildId);

  if (!data?.success) {
    return null;
  }

  return data.data;
}

export function usePremiumUserFeatures() {
  const { data } = usePremiumUserFeaturesQuery();

  if (!data?.success) {
    return null;
  }

  return data.data;
}
