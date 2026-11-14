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

export default function HomeHeader(): JSX.Element {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mobile menu on Escape or when clicking outside the header.
  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 border-0 border-b border-solid border-white/5 bg-ink-900/80 backdrop-blur-md"
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
            aria-controls="home-mobile-menu"
            onClick={() => setOpen((o) => !o)}
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

      {open && (
        <nav
          id="home-mobile-menu"
          aria-label="Menu"
          className="border-0 border-t border-solid border-white/5 px-3 py-2 md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
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
