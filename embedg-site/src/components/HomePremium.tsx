import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

const perks = [
  "Up to 100 saved messages",
  "Up to 5 actions per component",
  "Your own bot name and avatar",
  "Custom slash commands",
  "Recurring scheduled messages",
  "AI assistant",
];

export default function HomePremium(): JSX.Element {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-24">
      <div className="relative grid gap-10 overflow-hidden rounded-3xl border border-solid border-amber-400/20 bg-[linear-gradient(135deg,#2B2D31_0%,#33302B_60%,#4A3A1C_100%)] px-6 py-12 md:px-12 lg:grid-cols-2 lg:items-center lg:gap-y-10 lg:px-16 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-400/25 blur-[110px]"
        />
        <div className="relative">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            Want more? Get <span className="text-amber-300">Premium</span>.
          </h2>
          <p className="mb-8 max-w-md text-lg text-mist-400">
            Unlocks the good stuff for one server.
          </p>
          <div className="mb-8 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-mist-100">$4.99</span>
            <span className="text-mist-400">/ month, cancel anytime</span>
          </div>
          <a
            href="/premium"
            className="inline-flex rounded-lg bg-amber-400 px-5 py-3 text-base font-semibold text-ink-900 transition-colors hover:bg-amber-300 hover:text-ink-900 hover:no-underline"
          >
            Get Premium
          </a>
        </div>
        <ul className="relative m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-1">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-3 text-mist-300">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
          <div className="relative flex items-center gap-3 text-sm text-mist-500 lg:col-span-2">
            <img
              src="/img/merlin.webp"
              alt=""
              className="h-8 w-8 flex-none rounded-full"
            />
            <span className="whitespace-normal">
              Premium is what pays for hosting and keeps this free for everyone
              else. Thanks!
              <span className="ml-2 text-mist-400">Merlin</span>
            </span>
          </div>
      </div>
    </section>
  );
}
