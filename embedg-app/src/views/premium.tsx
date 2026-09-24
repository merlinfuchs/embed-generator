import { StarIcon } from "@heroicons/react/20/solid";
import { useUserQuery } from "../api/queries";
import LogginSuggest from "../components/LoginSuggest";
import PremiumFeatures from "../components/PremiumFeatures";
import PremiumSuggest from "../components/PremiumSuggest";
import { usePremiumGuildFeatures } from "../util/premium";

export default function PremiumView() {
  const { data: user } = useUserQuery();

  const features = usePremiumGuildFeatures();

  return (
    <div className="px-4 max-w-5xl mx-auto mb-20 mt-5 lg:mt-20 w-full">
      <div className="flex items-center px-3 py-3 space-x-3 mb-10">
        <StarIcon className="text-amber-300 h-14 w-14 flex-none" />
        <div className="flex-auto">
          <div className="font-bold text-white text-xl">
            Embed Generator <span className="text-amber-300">Premium</span>
          </div>
          <div className="text-light text-sm text-mist-400">
            {features?.is_premium
              ? "This server is subscribed to Embed Generator Premium and has access to all features!"
              : "Subscribe to Embed Generator Premium to unlock all features on this server!"}
          </div>
        </div>
      </div>
      {user && user.success ? (
        <div>
          {features?.is_premium ? (
            <div className="select-none">
              <PremiumFeatures />
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
        </div>
      ) : (
        <LogginSuggest alwaysExpanded={true} />
      )}
    </div>
  );
}
