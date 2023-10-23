import {
  ArrowUpTrayIcon,
  ChatBubbleLeftIcon,
  CursorArrowRippleIcon,
  PhotoIcon,
  SparklesIcon,
  StarIcon,
} from "@heroicons/react/20/solid";
import { usePremiumGuildEntitlementsQuery, useUserQuery } from "../api/queries";
import LogginSuggest from "../components/LoginSuggest";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import PremiumSuggest from "../components/PremiumSuggest";
import PremiumFeatures from "../components/PremiumFeatures";

export default function PremiumView() {
  const { data: user } = useUserQuery();
  const guildId = useSendSettingsStore((s) => s.guildId);

  const features = usePremiumGuildFeatures();

  const { data } = usePremiumGuildEntitlementsQuery(guildId);

  const hasEntitlement = data?.success && data.data.entitlements.length !== 0;

  return (
    <div className="px-4 max-w-5xl mx-auto my-20 w-full my-5 lg:my-20">
      {user && user.success ? (
        <div>
          <div className="flex items-center px-3 py-3 space-x-3 mb-4">
            <StarIcon className="text-yellow h-14 w-14 flex-none" />
            <div className="flex-auto">
              <div className="text-base font-bold text-white text-xl">
                Embed Generator <span className="text-yellow">Premium</span>
              </div>
              <div className="text-light text-sm text-gray-400">
                {features?.is_premium
                  ? "You are subscribed to Embed Generator Premium and have access to all features!"
                  : "Subscribe to Embed Generator Premium to unlock all features!"}
              </div>
            </div>
          </div>
          {features?.is_premium ? (
            <div className="select-none">
              <PremiumFeatures />
              <div className="flex pt-5">
                <a
                  className="px-3 py-2 rounded border-2 text-white border-dark-7 hover:bg-dark-6 cursor-pointer"
                  href="/premium"
                  target="_blank"
                >
                  <div>Manage Subscription</div>
                </a>
              </div>
            </div>
          ) : (
            <PremiumSuggest alwaysExpanded={true} />
          )}
        </div>
      ) : (
        <LogginSuggest />
      )}
    </div>
  );
}
