import {
  InformationCircleIcon,
  LoginIcon,
  UploadIcon,
} from "@heroicons/react/outline";
import { useState } from "react";

export default function LoginSuggest() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="p-3 bg-dark-3 rounded select-none">
      <div
        className="flex items-center px-3 py-3 space-x-3 cursor-pointer group"
        onClick={() => setCollapsed(!collapsed)}
      >
        <LoginIcon className="text-blurple h-14 w-14 flex-none" />
        <div className="flex-auto">
          <div className="text-base font-bold">
            Login for <span className="text-green">all features</span>
          </div>
          <div className="text-light text-sm text-gray-400">
            Not all features are available when sending messages without logging
            in
          </div>
        </div>
        <InformationCircleIcon className="w-8 h-8 text-gray-400 group-hover:text-gray-100 flex-none" />
      </div>
      {!collapsed && (
        <div className="space-y-2 mt-4">
          <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
            <UploadIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Save messages and load them whenever you need them
            </div>
          </div>
          <div className="p-4 bg-dark-2 rounded flex space-x-3 items-center">
            <UploadIcon className="w-5 h-5 text-green flex-none" />
            <div className="text-gray-400 font-light text-sm">
              Save messages and load them whenever you need them
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <a
              className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
              href="/api/auth/redirect"
            >
              <div>Login Now</div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
