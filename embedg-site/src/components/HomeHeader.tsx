import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

const links = [
  { label: "Features", href: "/features" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Discord", href: "/discord", external: true },
  { label: "GitHub", href: "/source", external: true },
];

type HomeHeaderProps = {
  /**
   * Lets a parent own the mobile menu (used by the docs/blog navbar to open
   * the Docusaurus sidebar). Without it the header renders its own link menu.
   */
  mobileMenu?: { open: boolean; onToggle: () => void };
  /**
   * Adds Docusaurus's `navbar` class. Docusaurus looks the navbar up by that
   * class (e.g. the docs table of contents measures its height).
   */
  asNavbar?: boolean;
};

export default function HomeHeader({
  mobileMenu,
  asNavbar,
}: HomeHeaderProps): JSX.Element {
  const [ownOpen, setOwnOpen] = useState(false);
  const external = !!mobileMenu;
  const open = mobileMenu ? mobileMenu.open : ownOpen;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOwnOpen(v);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mobile menu on Escape or when clicking outside the header.
  useEffect(() => {
    if (!ownOpen || external) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [ownOpen, external]);

  return (
    <header
      ref={headerRef}
      className={`${asNavbar ? "navbar home-header " : ""}sticky top-0 z-[200] border-0 border-b border-solid border-white/5 bg-ink-900/80 backdrop-blur-md`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-5 md:px-8">
        <a
          href="/"
          className="mr-2 flex shrink-0 items-center gap-2.5 text-mist-100 hover:no-underline"
        >
          <img src="/img/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
          <span className="hidden text-base font-semibold tracking-tight min-[360px]:block">
            Embed Generator
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(l.external && { target: "_blank", rel: "noopener" })}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100 hover:no-underline"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="/app/editor"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-azure-500 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-colors hover:bg-azure-400 hover:text-white hover:no-underline sm:px-4"
          >
            <SparklesIcon className="hidden h-4 w-4 sm:block" />
            Open App
          </a>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={external ? undefined : "home-mobile-menu"}
            onClick={() => (mobileMenu ? mobileMenu.onToggle() : setOpen((o) => !o))}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100 md:hidden"
          >
            {open ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {ownOpen && !external && (
        <nav
          id="home-mobile-menu"
          aria-label="Menu"
          className="border-0 border-t border-solid border-white/5 px-3 py-2 md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(l.external && { target: "_blank", rel: "noopener" })}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-mist-300 transition-colors hover:bg-white/5 hover:text-mist-100 hover:no-underline"
            >
              {l.label}
              {l.external && (
                <ArrowUpRightIcon className="h-4 w-4 text-mist-500" />
              )}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
