import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import PremiumFeatures from "./PremiumFeatures";

interface Props {
  alwaysExpanded?: boolean;
}

export default function PremiumSuggest({ alwaysExpanded }: Props) {
  const [collapsed, setCollapsed] = useState(!alwaysExpanded);

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
            <a
              className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white w-full text-center"
              href="/premium"
              target="_blank"
            >
              <div>Get Premium</div>
            </a>
          </div>
        </div>
      )}
    </AutoAnimate>
  );
}
