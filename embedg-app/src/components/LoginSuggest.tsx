import {
  CursorArrowRaysIcon,
  FaceSmileIcon,
  InformationCircleIcon,
  LinkIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import LoginLink from "./LoginLink";

interface Props {
  alwaysExpanded?: boolean;
}

export default function LogginSuggest({ alwaysExpanded }: Props) {
  const [collapsed, setCollapsed] = useState(!alwaysExpanded);

  return (
    <AutoAnimate className="p-3 bg-dark-2 rounded select-none">
      <div
        className="flex items-center px-3 py-3 space-x-3 cursor-pointer group"
        onClick={() => !alwaysExpanded && setCollapsed(!collapsed)}
      >
        <ArrowRightOnRectangleIcon className="text-blurple h-14 w-14 flex-none" />
        <div className="flex-auto">
          <div className="text-base font-bold text-white">
            Login for <span className="text-green">all features</span>
          </div>
          <div className="text-light text-sm text-gray-400">
            Not all features are available when sending messages without logging
            in
          </div>
        </div>
        {!alwaysExpanded && (
          <InformationCircleIcon className="w-8 h-8 text-gray-400 group-hover:text-gray-100 flex-none" />
        )}
      </div>
      {!collapsed && (
        <div className="space-y-2 mt-4">
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <ArrowUpTrayIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Save messages and load them whenever you need them
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <LinkIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Send messages without having to deal with webhooks
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <CursorArrowRaysIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Add buttons and select menus to your messages
            </div>
          </div>
          <div className="p-4 bg-dark-3 rounded flex space-x-3 items-center">
            <FaceSmileIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Add custom emojis to your messages using the emoji picker
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <LoginLink className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white">
              <div>Login Now</div>
            </LoginLink>
          </div>
        </div>
      )}
    </AutoAnimate>
  );
}
