import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  EllipsisVerticalIcon,
  StarIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";
import { useUserQuery } from "../api/queries";
import { userAvatarUrl } from "../util/discord";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { Link } from "react-router-dom";

export default function EditorMoreMenu() {
  const [open, setOpen] = useState(false);

  const { data: user } = useUserQuery();

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="relative">
        <EllipsisVerticalIcon
          className={clsx(
            "text-white transition-all bg-dark-3 hover:bg-dark-2 rounded-full cursor-pointer w-9 h-9 p-1",
            open && "rotate-90"
          )}
          onClick={() => setOpen((prev) => !prev)}
        />
        {open && (
          <div className="absolute w-64 bg-dark-3 rounded-md top-12 right-1 shadow-lg text-white">
            <div>
              {user && user.success ? (
                <div className="flex items-center px-4 space-x-3 py-3 overflow-x-hidden select-none">
                  <img
                    src={userAvatarUrl(user.data)}
                    alt=""
                    className="w-10 h-10 rounded-full bg-dark-2 flex-none"
                  />
                  <div className="flex flex-auto overflow-x-hidden">
                    <div className="text-white truncate">{user.data.name}</div>
                    <div className="text-gray-400 italic">
                      #{user.data.discriminator}
                    </div>
                  </div>
                  <a
                    className="rounded-full hover:bg-dark-2 p-2"
                    href="/api/auth/logout"
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                  </a>
                </div>
              ) : (
                <div>
                  <a
                    className="block px-4 py-3 hover:bg-dark-2 rounded-t"
                    href="/api/auth/login"
                  >
                    <div className="flex items-center space-x-3 mb-1">
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <div>Login</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Some features are only available after loggin in with your
                      Discord account!
                    </div>
                  </a>
                </div>
              )}
              <div className="border-b-2 border-dark-4"></div>
            </div>
            <Link
              to="/premium"
              className="flex items-center space-x-2 text-sm px-3 py-3 hover:bg-dark-2 rounded-b-md"
            >
              <StarIcon className="w-5 h-5" />
              <div>Premium</div>
            </Link>
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
