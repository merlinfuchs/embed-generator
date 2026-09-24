import { useShallow } from "zustand/react/shallow";
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
  CommandLineIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import logo from "../assets/logo.svg";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { useGuildsQuery, useUserQuery } from "../api/queries";
import { guildIconUrl } from "../discord/cdn";
import { useSendSettingsStore } from "../state/sendSettings";
import LoginLink from "./LoginLink";
import LogoutLink from "./LogoutLink";
import { useSettingsStore } from "../state/settings";

const collapsedBreakpoint = 1680;

export default function SideNav() {
  const alwaysCollapseSidebar = useSettingsStore(
    (s) => s.alwaysCollapseSidebar,
  );

  const [preCollapsed, setCollapsed] = useState(
    alwaysCollapseSidebar || document.body.clientWidth < collapsedBreakpoint,
  );
  const [hidden, setHidden] = useState(true);

  const { data: user } = useUserQuery();

  const collapsed = preCollapsed && hidden;

  useEffect(() => {
    if (alwaysCollapseSidebar) {
      setCollapsed(true);
    } else {
      setCollapsed(document.body.clientWidth < collapsedBreakpoint);
    }
  }, [alwaysCollapseSidebar]);

  return (
    <>
      <div
        className={clsx(
          "h-full bg-ink-900 border-r border-white/5 flex-none transition-all fixed z-30",
          collapsed ? "w-16" : "w-64",
          hidden && "hidden xl:relative xl:block",
        )}
      >
        <div className="flex flex-col justify-between h-full">
          <div
            className={clsx("flex flex-col py-5", collapsed && "items-center")}
          >
            <div
              className={clsx(
                "flex items-center mb-6 px-3",
                collapsed ? "flex-col gap-3" : "justify-between",
              )}
            >
              <a href="/" className="flex items-center gap-3 min-w-0">
                <img
                  src={logo}
                  alt=""
                  className="h-9 w-9 rounded-xl flex-none"
                />
                {!collapsed && (
                  <span className="font-semibold tracking-tight text-mist-100 truncate">
                    Embed Generator
                  </span>
                )}
              </a>
              <button
                type="button"
                className="hidden xl:block flex-none rounded-md p-1 text-mist-500 hover:bg-white/5 hover:text-mist-100 transition-colors"
                onClick={() => setCollapsed((h) => !h)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mb-7">
              {user && user.success ? (
                <NavigationGuildSelect collapsed={collapsed} />
              ) : (
                <LoginLink
                  className={clsx(
                    "bg-ink-800 border border-white/5 flex items-center mx-3 group transition-colors hover:border-white/15",
                    collapsed ? "rounded-full p-2" : "rounded-xl p-3",
                  )}
                >
                  <ArrowRightOnRectangleIcon className="h-7 w-7 flex-none text-azure-400" />
                  {!collapsed && (
                    <div className="ml-4">
                      <div className="text-sm font-medium text-mist-100 mb-0.5">
                        Login
                      </div>
                      <div className="text-xs text-mist-500">
                        Many features are only available after loggin in with
                        your Discord account!
                      </div>
                    </div>
                  )}
                </LoginLink>
              )}
            </div>
            <div
              className={clsx(
                "h-px bg-white/5 mb-5",
                collapsed ? "w-10" : "mx-3",
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
              <NavigationButton
                href="/scheduled"
                label="Scheduled Messages"
                icon={CalendarDaysIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />
              <NavigationButton
                href="/commands"
                label="Commands"
                icon={CommandLineIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />
              <NavigationButton
                href="/tools"
                label="Utility Tools"
                icon={WrenchScrewdriverIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />
              <NavigationButton
                href="/premium"
                label="Premium"
                icon={StarIcon}
                collapsed={collapsed}
                setHidden={setHidden}
              />
            </div>
          </div>
          <div className="flex flex-col items-center py-5 space-y-7">
            {user && user.success && (
              <LogoutLink
                className={clsx(
                  "flex w-full items-center group",
                  collapsed ? "px-4" : "px-5",
                )}
              >
                <ArrowLeftOnRectangleIcon className="h-8 w-8 flex-none text-mist-400 group-hover:text-mist-100" />
                {!collapsed && (
                  <div className="ml-5 text-mist-400 group-hover:text-mist-100">
                    Logout
                  </div>
                )}
              </LogoutLink>
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
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => setHidden(true)}
        ></div>
      )}
      <button
        type="button"
        aria-label="Toggle navigation"
        className="xl:hidden fixed w-12 h-12 rounded-full bg-azure-500 hover:bg-azure-400 shadow-lg bottom-3 left-3 flex items-center justify-center cursor-pointer z-10 transition-colors"
        onClick={() => setHidden((h) => !h)}
      >
        <Bars3Icon className="text-white h-7 w-7" />
      </button>
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
    >
      {({ isActive }) => (
        <>
          <div
            className={clsx(
              "w-1 rounded-r-lg h-12",
              isActive && "bg-azure-500",
              collapsed ? "mr-3" : "mr-4",
            )}
          ></div>
          <Icon
            className={clsx(
              "h-8 w-8 flex-none",
              isActive
                ? "text-azure-400"
                : "text-mist-400 group-hover:text-mist-100",
            )}
            aria-label={label}
            title={label}
          />
          {!collapsed && (
            <div
              className={clsx(
                "ml-5 truncate",
                isActive
                  ? "text-azure-400"
                  : "text-mist-400 group-hover:text-mist-100",
              )}
            >
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavigationGuildSelect({ collapsed }: { collapsed: boolean }) {
  const { data: guilds, isPending } = useGuildsQuery();

  const [guildId, setGuildId] = useSendSettingsStore(
    useShallow((state) => [state.guildId, state.setGuildId]),
  );

  const guild = useMemo(
    () => guilds?.success && guilds.data.find((g) => g.id === guildId),
    [guilds, guildId],
  );

  useEffect(() => {
    if (!guildId) {
      if (guilds?.success) {
        const defaultGuild = guilds.data[0];
        if (defaultGuild) {
          setGuildId(defaultGuild.id);
        }
      }
    } else if (!isPending) {
      if (!guilds?.success || !guilds.data.find((g) => g.id === guildId)) {
        setGuildId(null);
      }
    }
  }, [guilds, guildId, isPending]);

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
      <button
        type="button"
        className={clsx(
          "relative flex items-center cursor-pointer w-full text-left",
          collapsed
            ? "group"
            : "bg-ink-800 border border-white/5 hover:border-white/15 transition-colors mx-3 rounded-xl px-2 py-1.5",
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        {guild ? (
          <img
            src={guildIconUrl(guild)}
            className={clsx(
              "rounded-full flex-none",
              collapsed ? "h-12 w-12 border border-white/10" : "h-10 w-10",
            )}
            alt=""
          />
        ) : collapsed ? (
          <div
            className={clsx(
              "rounded-full flex-none flex items-center justify-center",
              collapsed
                ? "h-12 w-12 border border-white/10 bg-ink-800"
                : "h-10 w-10",
            )}
          >
            <ChevronDownIcon className="text-mist-300 h-8 w-8 flex-none" />
          </div>
        ) : null}
        {!collapsed && (
          <>
            <div className="ml-3 text-mist-300 truncate flex-auto">
              {guild ? guild.name : "Select a server"}
            </div>
            <ChevronDownIcon className="text-mist-300 h-5 w-5 flex-none ml-2" />
          </>
        )}
        {collapsed && (
          <div className="hidden group-hover:flex absolute cursor-pointer inset-0 bg-black/30 rounded-full items-center justify-center">
            <ChevronDownIcon className="text-mist-300 h-8 w-8" />
          </div>
        )}
      </button>

      {open && (
        <div
          className={clsx(
            "absolute bg-ink-800 rounded-xl shadow-card w-64 max-h-128 overflow-y-auto border border-white/10 p-1 z-10",
            collapsed ? "top-14 left-0" : "top-16 left-3",
          )}
        >
          {guilds?.success &&
            guilds.data.map((g) => (
              <button
                type="button"
                key={g.id}
                className="py-2 flex space-x-2 items-center rounded-lg px-3 hover:bg-ink-800 cursor-pointer w-full text-left"
                onClick={() => selectGuild(g.id)}
              >
                <img
                  src={guildIconUrl(g)}
                  alt="icon"
                  className="h-7 w-7 rounded-full flex-none"
                />
                <div className="text-mist-300 truncate">{g.name}</div>
              </button>
            ))}
          <a
            className="py-2 flex space-x-2 items-center hover:bg-ink-800 rounded-lg cursor-pointer px-3"
            href="/invite"
          >
            <PlusCircleIcon className="w-7 h-7 text-mist-300" />
            <div className="text-mist-300">Invite the bot</div>
          </a>
        </div>
      )}
    </ClickOutsideHandler>
  );
}
