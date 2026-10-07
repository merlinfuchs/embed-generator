import { useMemo } from "react";
import { usePremiumEntitlementConsumeMutation } from "../api/mutations";
import {
  usePremiumGuildFeaturesQuery,
  usePremiumUserEntitlementsQuery,
  usePremiumUserFeaturesQuery,
} from "../api/queries";
import { useSendSettingsStore } from "../state/sendSettings";
import { useToasts } from "./toasts";

export function usePremiumGuildFeatures(guildId?: string | null) {
  const selectedGuildID = useSendSettingsStore((state) => state.guildId);
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

export function useConsumableEntitlement(ultimate: boolean) {
  const { data } = usePremiumUserEntitlementsQuery();

  const entitlementId = useMemo(() => {
    if (!data?.success) return null;
    return data.data.entitlements.find(
      (e) => e.consumable && !e.consumed_guild_id && e.is_ultimate === ultimate,
    )?.id;
  }, [data, ultimate]);

  const guildId = useSendSettingsStore((s) => s.guildId);
  const consumeMutation = usePremiumEntitlementConsumeMutation();
  const createToast = useToasts((s) => s.create);

  const planName = ultimate ? "Ultimate" : "Premium";

  function activate(onDone: () => void) {
    if (!entitlementId || !guildId) return;

    consumeMutation.mutate(
      {
        entitlementId,
        req: { guild_id: guildId },
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            createToast({
              title: `${planName} activated`,
              message: "This server now has access to all features!",
              type: "success",
            });
          } else {
            createToast({
              title: `Failed to activate ${planName.toLowerCase()}`,
              message: res.error.message,
              type: "error",
            });
          }
          onDone();
        },
      },
    );
  }

  return {
    entitlementId,
    guildId,
    activate,
    pending: consumeMutation.isPending,
  };
}
