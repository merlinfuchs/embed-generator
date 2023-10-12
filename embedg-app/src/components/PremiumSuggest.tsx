import {
  FireIcon,
  ClipboardIcon,
  CpuChipIcon,
  CommandLineIcon,
  InformationCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon, HeartIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";

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
        <div className="space-y-2 mt-8">
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <CpuChipIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Get a personal{" "}
              <span className="font-medium text-white">AI assistant</span> that
              helps you creating beautiful and unique messages
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <TagIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Add your{" "}
              <span className="font-medium text-white">custom bot</span> to
              change the username and avatar on interaction responses and custom
              commands
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <CommandLineIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Add{" "}
              <span className="font-medium text-white">custom commands</span>{" "}
              with your own branding to your server that can be used by anyone
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <FireIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Add up to{" "}
              <span className="font-medium text-white">5 actions</span> to each
              interactive component and save up to{" "}
              <span className="font-medium text-white">100 messages</span>
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <HeartIcon className="w-5 h-5 text-red flex-none" />
            <div className="text-gray-400 font-light text-sm">
              By subscribing to premium you make sure that Embed Generator can
              continue to exist and be updated
            </div>
          </div>
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
