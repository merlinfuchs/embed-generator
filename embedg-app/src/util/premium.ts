import { useGuildsQuery } from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";

interface PremiumStatus {
  hasPremium: boolean;
  benefits: PremiumBenefits;
}

interface PremiumBenefits {
  maxActionsPerComponent: number;
  maxSavedMessages: number;
  actionRespondSavedMessag: boolean;
}

const benefitsWithPremium = {
  maxActionsPerComponent: 5,
  maxSavedMessages: 50,
  actionRespondSavedMessag: true,
};

const benefitsWithoutPremium = {
  maxActionsPerComponent: 2,
  maxSavedMessages: 25,
  actionRespondSavedMessag: false,
};

export function usePremiumStatus(guildId?: string | null): PremiumStatus {
  const { data: guilds } = useGuildsQuery();
  let selectedGuildId = useSendSettingsStore((s) => s.guildId);
  if (guildId) {
    selectedGuildId = guildId;
  }

  if (!guilds?.success) {
    return {
      hasPremium: false,
      benefits: benefitsWithoutPremium,
    };
  }

  const selectedGuild = guilds?.data.find((g) => g.id === selectedGuildId);

  if (!selectedGuild || !selectedGuild.has_premium) {
    return {
      hasPremium: false,
      benefits: benefitsWithoutPremium,
    };
  } else {
    return {
      hasPremium: true,
      benefits: benefitsWithPremium,
    };
  }
}
