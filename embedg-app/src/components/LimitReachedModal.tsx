import { SparklesIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";
import type { Limit } from "../util/plans";
import { op } from "./AnalyticsProvider";
import Modal from "./Modal";

const limitNames: Record<Limit, string> = {
  max_saved_messages: "saved messages",
  max_saved_message_versions: "versions per saved message",
  max_scheduled_messages: "scheduled messages",
  max_custom_commands: "custom commands",
  max_actions_per_component: "actions per component",
  max_ai_prompts_per_month: "AI prompts per month",
};

interface Props {
  limit: Limit;
  current: number;
  // The plans that raise the limit, cheapest first.
  upgrades: GetPremiumPlanFeaturesResponseDataWire[];
  onClose: () => void;
}

export default function LimitReachedModal({
  limit,
  current,
  upgrades,
  onClose,
}: Props) {
  useEffect(() => {
    op.track("limit_reached", { limit });
  }, [limit]);

  return (
    <Modal width="xs" onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center space-x-3 mb-5 pr-6">
          <SparklesIcon className="text-amber-300 h-10 w-10 flex-none" />
          <div className="text-white font-medium">
            You've reached the limit of {current} {limitNames[limit]}
          </div>
        </div>
        {upgrades.length ? (
          <>
            <div className="text-mist-300 text-sm mb-3">
              Upgrade to get more:
            </div>
            <div className="space-y-2 mb-6">
              {upgrades.map((p) => (
                <div
                  key={p.plan}
                  className="flex justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-amber-300">{p.plan}</span>
                  <span className="text-mist-100">
                    up to {p[limit]} {limitNames[limit]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 justify-end text-sm">
              <Link
                to="/premium"
                className="px-3 py-2 rounded-lg text-mist-100 border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors"
                onClick={onClose}
              >
                Compare plans
              </Link>
              <a
                href="/premium"
                target="_blank"
                rel="noopener"
                className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-ink-900 font-semibold transition-colors"
                onClick={() =>
                  op.track("upgrade_clicked", { limit, plan: upgrades[0].plan })
                }
              >
                Upgrade to {upgrades[0].plan}
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="text-mist-300 text-sm mb-6">
              This is the highest limit available. Delete some to make room for
              new ones.
            </div>
            <div className="flex justify-end text-sm">
              <button
                className="px-3 py-2 rounded-lg text-mist-100 border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
