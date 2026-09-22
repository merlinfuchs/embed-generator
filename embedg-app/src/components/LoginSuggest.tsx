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
import CheckBox from "./CheckBox";
import LoginLink from "./LoginLink";

interface Props {
  alwaysExpanded?: boolean;
}

export default function LogginSuggest({ alwaysExpanded }: Props) {
  const [collapsed, setCollapsed] = useState(!alwaysExpanded);
  const [joinSupportServer, setJoinSupportServer] = useState(false);

  return (
    <AutoAnimate className="p-3 bg-ink-700 border border-white/5 rounded-2xl shadow-card select-none">
      <div
        className="flex items-center px-3 py-3 space-x-3 cursor-pointer group"
        onClick={() => !alwaysExpanded && setCollapsed(!collapsed)}
      >
        <ArrowRightOnRectangleIcon className="text-azure-400 h-12 w-12 flex-none" />
        <div className="flex-auto">
          <div className="text-base font-bold text-white">
            Login for <span className="text-azure-400">all features</span>
          </div>
          <div className="text-light text-sm text-mist-400">
            Not all features are available when sending messages without logging
            in
          </div>
        </div>
        {!alwaysExpanded && (
          <InformationCircleIcon className="w-8 h-8 text-mist-400 group-hover:text-mist-100 flex-none" />
        )}
      </div>
      {!collapsed && (
        <div className="space-y-5 mt-5 px-3 py-2">
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-azure-500/15 text-azure-300">
              <ArrowUpTrayIcon className="h-4 w-4" />
            </span>
            <div className="text-mist-300 text-sm">
              Save messages and load them whenever you need them
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-azure-500/15 text-azure-300">
              <LinkIcon className="h-4 w-4" />
            </span>
            <div className="text-mist-300 text-sm">
              Send messages without having to deal with webhooks
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-azure-500/15 text-azure-300">
              <CursorArrowRaysIcon className="h-4 w-4" />
            </span>
            <div className="text-mist-300 text-sm">
              Add buttons and select menus to your messages
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-azure-500/15 text-azure-300">
              <FaceSmileIcon className="h-4 w-4" />
            </span>
            <div className="text-mist-300 text-sm">
              Add custom emojis to your messages using the emoji picker
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <CheckBox
              label="Join the Discord support server"
              checked={joinSupportServer}
              onChange={setJoinSupportServer}
            />
            <div
              className="text-mist-300 text-sm cursor-pointer"
              onClick={() => setJoinSupportServer(!joinSupportServer)}
            >
              Join the Discord support server
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <LoginLink
              className="bg-azure-500 px-4 py-2.5 rounded-lg transition-colors hover:bg-azure-400 text-white font-semibold"
              joinSupportServer={joinSupportServer}
            >
              <div>Login Now</div>
            </LoginLink>
          </div>
        </div>
      )}
    </AutoAnimate>
  );
}
