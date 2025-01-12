import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useCallback, useMemo, useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import PremiumFeatures from "./PremiumFeatures";
import { usePremiumUserEntitlementsQuery } from "../api/queries";
import { usePremiumEntitlementConsumeMutation } from "../api/mutations";
import { useSendSettingsStore } from "../state/sendSettings";
import { useToasts } from "../util/toasts";

interface Props {
  alwaysExpanded?: boolean;
}

export default function PremiumSuggest({ alwaysExpanded }: Props) {
  const [collapsed, setCollapsed] = useState(!alwaysExpanded);

  const { data } = usePremiumUserEntitlementsQuery();

  const consumableEntitlementId = useMemo(() => {
    if (!data?.success) return null;
    return data.data.entitlements.find(
      (e) => e.consumable && !e.consumed_guild_id
    )?.id;
  }, [data]);

  const guildId = useSendSettingsStore((s) => s.guildId);
  const consumeMutation = usePremiumEntitlementConsumeMutation();

  const createToast = useToasts((s) => s.create);

  const activatePremium = useCallback(() => {
    if (!consumableEntitlementId || !guildId) return;

    const confirmed = confirm(
      `You are about to activate Premium for the server with the id '${guildId}'. Once activated, you can't activate it for another server.`
    );
    if (!confirmed) return;

    consumeMutation.mutate(
      {
        entitlementId: consumableEntitlementId,
        req: { guild_id: guildId },
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            createToast({
              title: "Premium activated",
              message: "This server now has access to all features!",
              type: "success",
            });
          } else {
            createToast({
              title: "Failed to update command",
              message: res.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }, [consumableEntitlementId, guildId]);

  return (
    <AutoAnimate className="p-3 bg-dark-2 rounded select-none">
      <div
        className="flex items-center px-3 py-3 space-x-3 group cursor-pointer"
        onClick={() => !alwaysExpanded && setCollapsed(!collapsed)}
      >
        <SparklesIcon className="text-yellow h-14 w-14 flex-none" />
        <div className="flex-auto">
          <div className="text-base font-bold text-white">
            Get Premium for <span className="text-yellow">all features</span>
          </div>
          <div className="text-light text-sm text-gray-400 max-w-lg">
            By subscribing to Embed Generator Premium you get access to all
            features and support the development of Embed Generator.
          </div>
        </div>
        {!alwaysExpanded && (
          <InformationCircleIcon className="w-8 h-8 text-gray-400 group-hover:text-gray-100 flex-none" />
        )}
      </div>
      {!collapsed && (
        <div className="mt-8">
          <PremiumFeatures />
          <div className="flex justify-end pt-5">
            {consumableEntitlementId ? (
              <button
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white w-full text-center"
                onClick={activatePremium}
              >
                <div>Activate Premium</div>
              </button>
            ) : (
              <a
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white w-full text-center"
                href="/premium"
                target="_blank"
              >
                <div>Get Premium</div>
              </a>
            )}
          </div>
        </div>
      )}
    </AutoAnimate>
  );
}
