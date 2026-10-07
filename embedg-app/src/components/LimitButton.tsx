import { SparklesIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { type ReactNode, useState } from "react";
import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";
import LimitReachedModal, {
  type Limit,
  upgradesFor,
} from "./LimitReachedModal";

interface Props {
  limit: Limit;
  features: GetPremiumPlanFeaturesResponseDataWire | null;
  atLimit: boolean;
  className: string;
  onClick: () => void;
  children: ReactNode;
}

/** Opens the limit dialog instead of doing its thing once the limit is reached. */
export default function LimitButton({
  limit,
  features,
  atLimit,
  className,
  onClick,
  children,
}: Props) {
  const [modal, setModal] = useState(false);

  if (!atLimit) {
    return (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    );
  }

  const upgradable = upgradesFor(limit, features).length > 0;

  return (
    <>
      <button
        className={clsx(
          "px-3 py-2 rounded-lg border-2 inline-flex items-center space-x-2 flex-none transition-colors",
          upgradable
            ? "border-amber-400/40 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400/70"
            : "border-white/10 text-mist-500",
        )}
        title={upgradable ? "Upgrade to get more" : undefined}
        onClick={() => setModal(true)}
      >
        {upgradable && <SparklesIcon className="h-4 w-4 flex-none" />}
        <span>{children}</span>
      </button>
      {modal && (
        <LimitReachedModal
          limit={limit}
          features={features}
          onClose={() => setModal(false)}
        />
      )}
    </>
  );
}
