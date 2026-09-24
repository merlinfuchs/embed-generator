import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

const links = [
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Discord", href: "/discord", hideBelow: "sm" },
  { label: "GitHub", href: "/source", hideBelow: "md" },
];

export default function HomeHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-20 border-0 border-b border-solid border-white/5 bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <a
          href="/"
          className="flex items-center gap-3 text-mist-100 hover:no-underline"
        >
          <img src="/img/logo.svg" alt="" className="h-9 w-9 rounded-xl" />
          <span className="hidden text-lg font-semibold tracking-tight sm:block">
            Embed Generator
          </span>
        </a>
        <nav className="flex items-center gap-1 md:gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100 hover:no-underline",
                l.hideBelow === "sm" ? "hidden sm:block" : "",
                l.hideBelow === "md" ? "hidden md:block" : "",
              ].join(" ")}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/app"
            className="ml-2 flex items-center gap-2 rounded-lg bg-azure-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-colors hover:bg-azure-400 hover:text-white hover:no-underline"
          >
            <SparklesIcon className="h-4 w-4" />
            Open App
          </a>
        </nav>
      </div>
    </header>
  );
}
