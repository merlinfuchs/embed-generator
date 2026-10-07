import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import { useConsumableEntitlement } from "../util/premium";
import PremiumFeatures from "./PremiumFeatures";
import ConfirmModal from "./ConfirmModal";

interface Props {
  alwaysExpanded?: boolean;
}

export default function PremiumSuggest({ alwaysExpanded }: Props) {
  const [collapsed, setCollapsed] = useState(!alwaysExpanded);
  const [activateModal, setActivateModal] = useState(false);

  const { entitlementId, guildId, activate, pending } =
    useConsumableEntitlement(false);

  return (
    <AutoAnimate className="relative overflow-hidden p-3 rounded-2xl border border-amber-400/10 bg-[linear-gradient(135deg,#2B2D31_0%,#2F2E2C_65%,#3A3222_100%)] select-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]"
      />
      <div
        className="relative flex items-center px-3 py-3 space-x-3 group cursor-pointer"
        onClick={() => !alwaysExpanded && setCollapsed(!collapsed)}
      >
        <SparklesIcon className="text-amber-300 h-12 w-12 flex-none" />
        <div className="flex-auto">
          <div className="text-base font-bold text-white">
            Get Premium for <span className="text-amber-300">all features</span>
          </div>
          <div className="text-light text-sm text-mist-400 max-w-lg">
            By subscribing to Embed Generator Premium you get access to all
            features and support the development of Embed Generator.
          </div>
        </div>
        {!alwaysExpanded && (
          <InformationCircleIcon className="w-8 h-8 text-mist-400 group-hover:text-mist-100 flex-none" />
        )}
      </div>
      {!collapsed && (
        <div className="relative mt-6">
          <PremiumFeatures />
          <div className="flex justify-end pt-5">
            {entitlementId ? (
              <button
                className="bg-amber-400 px-4 py-2.5 rounded-lg transition-colors hover:bg-amber-300 text-ink-900 font-semibold w-full text-center"
                onClick={() => setActivateModal(true)}
              >
                <div>Activate Premium</div>
              </button>
            ) : (
              <a
                className="bg-amber-400 px-4 py-2.5 rounded-lg transition-colors hover:bg-amber-300 text-ink-900 font-semibold w-full text-center"
                href="/premium"
                target="_blank"
                rel="noopener"
              >
                <div>Get Premium</div>
              </a>
            )}
          </div>
        </div>
      )}
      {activateModal && (
        <ConfirmModal
          title="Are you sure that you want to activate premium for this server?"
          subTitle={`Premium will be activated for the server with the id '${guildId}'. Once activated you can't move it to another server.`}
          pending={pending}
          onClose={() => setActivateModal(false)}
          onConfirm={() => activate(() => setActivateModal(false))}
        />
      )}
    </AutoAnimate>
  );
}
