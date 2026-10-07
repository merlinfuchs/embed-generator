import { StarIcon } from "@heroicons/react/20/solid";
import { useUserQuery } from "../api/queries";
import LogginSuggest from "../components/LoginSuggest";
import PremiumFeatures from "../components/PremiumFeatures";
import PremiumSuggest from "../components/PremiumSuggest";
import UltimateFeatures from "../components/UltimateFeatures";
import UltimateSuggest from "../components/UltimateSuggest";
import { PREMIUM_PLAN, ULTIMATE_PLAN, usePlans } from "../util/plans";
import { usePremiumGuildFeatures } from "../util/premium";

export default function PremiumView() {
  const { data: user } = useUserQuery();

  const features = usePremiumGuildFeatures();
  const isUltimate = features?.plan === ULTIMATE_PLAN;
  const planName = features?.plan || PREMIUM_PLAN;

  // Plans come from the cheapest to the most expensive, and the free one isn't listed.
  const plans = usePlans();
  const rank = (name: string) => plans?.findIndex((p) => p.plan === name) ?? -1;
  const offerUltimate = !!features && rank(ULTIMATE_PLAN) > rank(features.plan);

  return (
    <div className="px-4 max-w-5xl mx-auto mb-20 mt-5 lg:mt-20 w-full">
      <div className="flex items-center px-3 py-3 space-x-3 mb-10">
        <StarIcon className="text-amber-300 h-14 w-14 flex-none" />
        <div className="flex-auto">
          <div className="font-bold text-white text-xl">
            Embed Generator <span className="text-amber-300">{planName}</span>
          </div>
          <div className="text-light text-sm text-mist-400">
            {features?.is_premium
              ? `This server is subscribed to Embed Generator ${planName} and has access to all features!`
              : "Subscribe to Embed Generator Premium to unlock all features on this server!"}
          </div>
        </div>
      </div>
      {user && user.success ? (
        <div className="space-y-10">
          {features?.is_premium ? (
            <div className="select-none">
              {isUltimate ? <UltimateFeatures /> : <PremiumFeatures />}
              <div className="flex pt-5">
                <a
                  className="px-3 py-2 rounded-lg border-2 border-white/15 text-mist-100 hover:bg-white/5 hover:border-white/30 transition-colors cursor-pointer"
                  href="/premium"
                  target="_blank"
                  rel="noopener"
                >
                  <div>Manage Subscription</div>
                </a>
              </div>
            </div>
          ) : (
            <PremiumSuggest alwaysExpanded={true} />
          )}
          {offerUltimate && <UltimateSuggest upgrade={features.is_premium} />}
        </div>
      ) : (
        <LogginSuggest alwaysExpanded={true} />
      )}
    </div>
  );
}
