import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  CheckIcon,
  CommandLineIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
  StarIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Drawer } from "vaul";
import { useGuildsQuery, useUserQuery } from "../api/queries";
import { guildIconUrl } from "../discord/cdn";
import { useSendSettingsStore } from "../state/sendSettings";
import { useMobileUiStore } from "../state/mobileUi";
import { useDefaultGuild } from "../util/guilds";
import LoginLink from "./LoginLink";
import LogoutLink from "./LogoutLink";

const TABS = [
  { href: "/editor", label: "Editor", icon: PencilSquareIcon },
  { href: "/messages", label: "Saved", icon: RectangleStackIcon },
] as const;

const MORE_LINKS = [
  { href: "/scheduled", label: "Scheduled Messages", icon: CalendarDaysIcon },
  { href: "/commands", label: "Commands", icon: CommandLineIcon },
  { href: "/tools", label: "Utility Tools", icon: WrenchScrewdriverIcon },
  { href: "/premium", label: "Premium", icon: StarIcon },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon },
] as const;

/**
 * Navigation and the main editor action on screens too small for the sidebar,
 * as a bar at the bottom of the screen.
 */
export default function MobileBottomBar() {
  const moreOpen = useMobileUiStore((s) => s.moreOpen);
  const setMoreOpen = useMobileUiStore((s) => s.setMoreOpen);

  const location = useLocation();
  // The More tab lights up on the pages that live in the sheet.
  const moreActive = MORE_LINKS.some((l) =>
    location.pathname.startsWith(l.href),
  );

  // Navigating from the sheet closes it.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav
        aria-label="Main"
        className="xl:hidden fixed bottom-0 inset-x-0 z-20 flex items-center justify-between gap-2 border-t border-white/10 bg-ink-900/95 backdrop-blur-md px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg select-none"
      >
        <div className="flex w-full items-center gap-0.5 rounded-full border border-white/5 bg-white/5 p-0.5">
          {TABS.map((tab) => (
            <NavLink
              key={tab.href}
              to={tab.href}
              aria-label={tab.label}
              className={({ isActive }) => tabClasses(isActive)}
            >
              <tab.icon className="h-5 w-5 flex-none" />
              <TabLabel>{tab.label}</TabLabel>
            </NavLink>
          ))}
          <button
            type="button"
            aria-label="More"
            className={tabClasses(moreActive || moreOpen)}
            onClick={() => setMoreOpen(true)}
          >
            <EllipsisHorizontalIcon className="h-5 w-5 flex-none" />
            <TabLabel>More</TabLabel>
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}

function tabClasses(active: boolean) {
  return clsx(
    "flex items-center justify-center rounded-full transition-colors",
    "flex-col gap-0.5 h-11 flex-1 min-w-0",
    active
      ? "bg-azure-500/20 text-azure-400"
      : "text-mist-400 hover:text-mist-100 active:bg-white/10",
  );
}

function TabLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium leading-none">{children}</span>
  );
}

function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: user } = useUserQuery();
  const loggedIn = !!user && user.success;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-40 flex max-h-[85%] flex-col rounded-t-2xl border-t border-white/10 bg-ink-800 focus:outline-none">
          <Drawer.Title className="sr-only">More</Drawer.Title>
          <Drawer.Description className="sr-only">
            Server, tools, settings and account
          </Drawer.Description>
          <div className="flex-none p-4">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-ink-500" />
          </div>
          <div className="space-y-4 overflow-y-auto px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {loggedIn ? (
              <GuildList />
            ) : (
              <LoginLink className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900 p-3 transition-colors hover:border-white/15">
                <ArrowRightOnRectangleIcon className="h-7 w-7 flex-none text-azure-400" />
                <div>
                  <div className="text-sm font-medium text-mist-100">Login</div>
                  <div className="text-xs text-mist-500">
                    Many features are only available after logging in with your
                    Discord account!
                  </div>
                </div>
              </LoginLink>
            )}

            <div className="overflow-hidden rounded-xl border border-white/5 bg-ink-900">
              {MORE_LINKS.map((l) => (
                <SheetRow key={l.href} href={l.href} icon={l.icon}>
                  {l.label}
                </SheetRow>
              ))}
              <SheetRow href="/discord" icon={QuestionMarkCircleIcon} external>
                Help & Support
              </SheetRow>
              {loggedIn && (
                <LogoutLink className="flex items-center gap-3 border-t border-white/5 px-4 py-3 text-mist-300 transition-colors active:bg-white/5">
                  <ArrowLeftOnRectangleIcon className="h-6 w-6 flex-none text-mist-400" />
                  Logout
                </LogoutLink>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SheetRow({
  href,
  icon: Icon,
  external,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  children: React.ReactNode;
}) {
  const className =
    "flex items-center gap-3 px-4 py-3 text-mist-300 transition-colors active:bg-white/5 [&:not(:first-child)]:border-t border-white/5";
  const content = (
    <>
      <Icon className="h-6 w-6 flex-none text-mist-400" />
      {children}
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {content}
    </a>
  ) : (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}

function GuildList() {
  const { data: guilds } = useGuildsQuery();
  const guildId = useSendSettingsStore((s) => s.guildId);
  const setGuildId = useSendSettingsStore((s) => s.setGuildId);
  useDefaultGuild(guildId, setGuildId);

  const list = useMemo(() => (guilds?.success ? guilds.data : []), [guilds]);

  return (
    <div>
      <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-mist-500">
        Server
      </div>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-white/5 bg-ink-900">
        {list.map((g) => (
          <button
            type="button"
            key={g.id}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-white/5 [&:not(:first-child)]:border-t border-white/5"
            onClick={() => setGuildId(g.id)}
          >
            <img
              src={guildIconUrl(g)}
              alt=""
              className="h-8 w-8 flex-none rounded-full"
            />
            <span className="flex-auto truncate text-mist-300">{g.name}</span>
            {g.id === guildId && (
              <CheckIcon className="h-5 w-5 flex-none text-azure-400" />
            )}
          </button>
        ))}
        <a
          href="/invite"
          className="flex items-center gap-3 px-4 py-2.5 text-mist-300 transition-colors active:bg-white/5 [&:not(:first-child)]:border-t border-white/5"
        >
          <PlusCircleIcon className="h-8 w-8 flex-none text-mist-400" />
          Invite the bot
        </a>
      </div>
    </div>
  );
}
