import { SparklesIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { ULTIMATE_PLAN, usePlan } from "../util/plans";
import { useConsumableEntitlement } from "../util/premium";
import ConfirmModal from "./ConfirmModal";
import UltimateFeatures from "./UltimateFeatures";

interface Props {
  upgrade?: boolean;
}

export default function UltimateSuggest({ upgrade }: Props) {
  const [activateModal, setActivateModal] = useState(false);

  const { entitlementId, guildId, activate, pending } =
    useConsumableEntitlement(true);

  // Not every instance sells it.
  if (!usePlan(ULTIMATE_PLAN)) return null;

  return (
    <div className="relative overflow-hidden p-3 rounded-2xl border border-amber-400/10 bg-[linear-gradient(135deg,#2B2D31_0%,#2F2E2C_65%,#3A3222_100%)] select-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]"
      />
      <div className="relative flex items-center px-3 py-3 space-x-3">
        <SparklesIcon className="text-amber-300 h-12 w-12 flex-none" />
        <div className="flex-auto">
          <div className="text-base font-bold text-white">
            {upgrade ? "Upgrade to " : "Need more? Get "}
            <span className="text-amber-300">Ultimate</span>
          </div>
          <div className="text-light text-sm text-mist-400 max-w-lg">
            For servers that outgrow the limits of Premium.
          </div>
        </div>
      </div>
      <div className="relative mt-6">
        <UltimateFeatures />
        <div className="flex justify-end pt-5">
          {entitlementId ? (
            <button
              className="bg-amber-400 px-4 py-2.5 rounded-lg transition-colors hover:bg-amber-300 text-ink-900 font-semibold w-full text-center"
              onClick={() => setActivateModal(true)}
            >
              <div>Activate Ultimate</div>
            </button>
          ) : (
            <a
              className="bg-amber-400 px-4 py-2.5 rounded-lg transition-colors hover:bg-amber-300 text-ink-900 font-semibold w-full text-center"
              href="/premium"
              target="_blank"
              rel="noopener"
            >
              <div>{upgrade ? "Upgrade to Ultimate" : "Get Ultimate"}</div>
            </a>
          )}
        </div>
      </div>
      {activateModal && (
        <ConfirmModal
          title="Are you sure that you want to activate ultimate for this server?"
          subTitle={`Ultimate will be activated for the server with the id '${guildId}'. Once activated you can't move it to another server.`}
          pending={pending}
          onClose={() => setActivateModal(false)}
          onConfirm={() => activate(() => setActivateModal(false))}
        />
      )}
    </div>
  );
}
