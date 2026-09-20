import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";
import HeroPreview from "./HeroPreview";

export default function HomeHero(): JSX.Element {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[520px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure-600/20 blur-[140px]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-mist-100 sm:text-5xl lg:text-6xl">
            Good-looking{" "}
            <span className="text-azure-400">Discord messages</span>, without
            the hassle.
          </h1>
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-mist-400">
            Design embeds, buttons and select menus in a visual editor and send
            them straight to your server. No coding needed.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/app"
              className="flex items-center gap-2 rounded-lg bg-azure-500 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-azure-400 hover:text-white hover:no-underline"
            >
              <SparklesIcon className="h-5 w-5" />
              Open App
            </a>
            <a
              href="/docs"
              className="flex items-center gap-2 rounded-lg border border-solid border-white/10 px-5 py-3 text-base font-semibold text-mist-100 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white hover:no-underline"
            >
              Read the docs
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <div className="text-2xl font-bold text-mist-100">250,000+</div>
              <div className="text-sm text-mist-500">servers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mist-100">3,000,000+</div>
              <div className="text-sm text-mist-500">messages sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mist-100">Free</div>
              <div className="text-sm text-mist-500">and open source</div>
            </div>
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}
