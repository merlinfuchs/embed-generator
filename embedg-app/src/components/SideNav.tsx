import {
  PencilSquareIcon,
  RectangleStackIcon,
  StarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  Bars3Icon,
  PlusCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { useGuildsQuery, useUserQuery } from "../api/queries";
import { guildIconUrl } from "../discord/cdn";
import { useSendSettingsStore } from "../state/sendSettings";
import { shallow } from "zustand/shallow";

export default function SideNav() {
  const [preCollapsed, setCollapsed] = useState(
    document.body.clientWidth < 1680
  );
  const [hidden, setHidden] = useState(true);

  const { data: user } = useUserQuery();

  const collapsed = preCollapsed && hidden;

  return (
    <>
      <div
        className={clsx(
          "h-full bg-dark-3 flex-none transition-all fixed z-30 shadow",
          collapsed ? "w-16" : "w-56",
          hidden && "hidden xl:relative xl:block"
        )}
      >
        <div className="flex flex-col justify-between h-full">
          <div
            className={clsx("flex flex-col py-5", collapsed && "items-center")}
          >
            <div className="justify-end px-3 hidden xl:flex">
              <div
                className="mb-5 cursor-pointer text-gray-300 hover:text-white"
                role="button"
                onClick={() => setCollapsed((h) => !h)}
              >
                {collapsed ? (
                  <ChevronDoubleRightIcon className="h-6 w-6" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-6 w-6" />
                )}
              </div>
            </div>
            <div className="mb-7">
              {user && user.success ? (
                <NavigationGuildSelect collapsed={collapsed} />
              ) : (
                <a
                  className={clsx(
                    "bg-dark-2 flex items-center mx-3 group",
                    collapsed ? "rounded-full p-2" : "rounded p-2"
                  )}
                  href="/api/auth/login"
                >
                  <ArrowRightOnRectangleIcon className="h-8 w-8 flex-none text-gray-300 group-hover:text-white" />
                  {!collapsed && (
                    <div className="ml-5">
                      <div className="text-gray-300 group-hover:text-white mb-1">
                        Login
                      </div>
                      <div className="text-xs text-gray-400">
                        Many features are only available after loggin in with
                        your Discord account!
                      </div>
                    </div>
                  )}
                </a>
              )}
            </div>
            <div
              className={clsx(
                "h-0.5 bg-dark-4 rounded-full mb-7",
                collapsed ? "w-12" : "w-52 mx-auto"
              )}
            ></div>
            <div className="flex flex-col space-y-4">
              <NavigationButton
                href="/editor"
                label="Message Editor"
                icon={PencilSquareIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />
              <NavigationButton
                href="/messages"
                label="Saved Messages"
                icon={RectangleStackIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />
              {/*<NavigationButton
                href="/premium"
                label="Premium"
                icon={StarIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />*/}
            </div>
          </div>
          <div className="flex flex-col items-center py-5 space-y-7">
            {user && user.success && (
              <a
                className={clsx(
                  "flex w-full items-center group",
                  collapsed ? "px-4" : "px-5"
                )}
                href="/api/auth/logout"
              >
                <ArrowLeftOnRectangleIcon className="h-8 w-8 flex-none text-gray-300 group-hover:text-white" />
                {!collapsed && (
                  <div
                    className={clsx(
                      "ml-5 text-gray-300 group-hover:text-white"
                    )}
                  >
                    Logout
                  </div>
                )}
              </a>
            )}

            <NavigationButton
              href="/settings"
              label="Settings"
              icon={Cog6ToothIcon}
              collapsed={collapsed}
              setHidden={setHidden}
            />
          </div>
        </div>
      </div>
      {!hidden && (
        <div
          className="fixed inset-0 bg-black z-20 bg-opacity-40"
          onClick={() => setHidden(true)}
        ></div>
      )}
      <div
        className="block xl:hidden fixed w-12 h-12 rounded-full bg-blurple bottom-3 left-3 flex items-center justify-center cursor-pointer z-10"
        onClick={() => setHidden((h) => !h)}
        role="button"
      >
        <Bars3Icon className="text-gray-200 h-10 w-10" />
      </div>
    </>
  );
}

function NavigationButton({
  href,
  label,
  icon,
  collapsed,
  setHidden,
}: {
  href: string;
  label: string;
  collapsed: boolean;
  icon: any;
  setHidden: (hidden: boolean) => void;
}) {
  const Icon = icon;

  return (
    <NavLink
      className="flex w-full items-center pr-4 group"
      to={href}
      onClick={() => setHidden(true)}
      children={({ isActive }) => (
        <>
          <div
            className={clsx(
              "w-1 rounded-r h-12",
              isActive && "bg-blurple",
              collapsed ? "mr-3" : "mr-4"
            )}
          ></div>
          <Icon
            className={clsx(
              "h-8 w-8 flex-none",
              isActive ? "text-blurple" : "text-gray-300 group-hover:text-white"
            )}
            aria-label={label}
          />
          {!collapsed && (
            <div
              className={clsx(
                "ml-5 truncate",
                isActive
                  ? "text-blurple"
                  : "text-gray-300 group-hover:text-white"
              )}
            >
              {label}
            </div>
          )}
        </>
      )}
    />
  );
}

function NavigationGuildSelect({ collapsed }: { collapsed: boolean }) {
  const { data: guilds, isLoading } = useGuildsQuery();
  useEffect(() => {
    if (guilds?.success) {
      guilds.data.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [guilds]);

  const [guildId, setGuildId] = useSendSettingsStore(
    (state) => [state.guildId, state.setGuildId],
    shallow
  );

  const guild = useMemo(
    () => guilds?.success && guilds.data.find((g) => g.id === guildId),
    [guilds, guildId]
  );

  useEffect(() => {
    if (!guildId) {
      if (guilds?.success) {
        const defaultGuild = guilds.data.find(
          (g) => g.has_channel_with_bot_access
        );
        if (defaultGuild) {
          setGuildId(defaultGuild.id);
        }
      }
    } else if (!isLoading) {
      if (!guilds?.success || !guilds.data.find((g) => g.id === guildId)) {
        setGuildId(null);
      }
    }
  }, [guilds, guildId, isLoading]);

  function selectGuild(guildId: string) {
    setGuildId(guildId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler
      onClickOutside={() => setOpen(false)}
      className="relative"
    >
      <div
        className={clsx(
          "relative flex items-center cursor-pointer",
          collapsed ? "group" : "bg-dark-2 mx-3 rounded px-2 py-1"
        )}
        role="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {guild ? (
          <img
            src={guildIconUrl(guild)}
            className={clsx(
              "rounded-full flex-none",
              collapsed ? "h-12 w-12 border border-dark-2 shadow" : "h-10 w-10"
            )}
            alt=""
          />
        ) : collapsed ? (
          <div
            className={clsx(
              "rounded-full flex-none flex items-center justify-center",
              collapsed
                ? "h-12 w-12 border border-dark-2 shadow bg-dark-2"
                : "h-10 w-10"
            )}
          >
            <ChevronDownIcon className="text-gray-300 h-8 w-8 flex-none" />
          </div>
        ) : null}
        {!collapsed && (
          <>
            <div className="ml-3 text-gray-300 truncate flex-auto">
              {guild ? guild.name : "Select a server"}
            </div>
            <ChevronDownIcon className="text-gray-300 h-5 w-5 flex-none ml-2" />
          </>
        )}
        {collapsed && (
          <div className="hidden group-hover:flex absolute cursor-pointer inset-0 bg-black bg-opacity-30 rounded-full items-center justify-center">
            <ChevronDownIcon className="text-gray-300 h-8 w-8" />
          </div>
        )}
      </div>

      {open && (
        <div
          className={clsx(
            "absolute bg-dark-2 rounded shadow-lg w-64 max-h-128 overflow-y-auto border-2 border-dark-2 z-10",
            collapsed ? "top-14 left-0" : "top-16 left-3"
          )}
        >
          {guilds?.success &&
            guilds.data.map((g) => (
              <div
                key={g.id}
                className={clsx(
                  "py-2 flex space-x-2 items-center rounded px-3",
                  g.has_channel_with_bot_access
                    ? "hover:bg-dark-3 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                )}
                role="button"
                onClick={() =>
                  g.has_channel_with_bot_access && selectGuild(g.id)
                }
              >
                <img
                  src={guildIconUrl(g)}
                  alt="icon"
                  className="h-7 w-7 rounded-full flex-none"
                />
                <div className="text-gray-300 truncate">{g.name}</div>
              </div>
            ))}
          <a
            className="py-2 flex space-x-2 items-center hover:bg-dark-3 rounded cursor-pointer px-3"
            role="button"
            href="/invite"
          >
            <PlusCircleIcon className="w-7 h-7 text-gray-300" />
            <div className="text-gray-300">Invite the bot</div>
          </a>
        </div>
      )}
    </ClickOutsideHandler>
  );
}
