import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

const perks = [
  "Up to 100 saved messages",
  "Up to 5 actions per component",
  "Custom bot with your name and avatar",
  "Custom slash commands",
  "Recurring scheduled messages",
  "AI assistant",
];

export default function HomePremium(): JSX.Element {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 lg:pb-28">
      <div className="relative overflow-hidden rounded-3xl border border-solid border-white/10 bg-ink-800 px-6 py-12 md:px-12 lg:px-16 lg:py-16">
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
              Get more out of Embed Generator with Premium.
            </h2>
            <p className="mb-8 text-lg text-mist-400">
              Supports the development and unlocks these perks for one server. Cancel anytime.
            </p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-mist-100">
                $4.99
              </span>
              <span className="text-mist-400">/ month</span>
            </div>
            <a
              href="/premium"
              className="inline-flex rounded-lg bg-amber-400 px-5 py-3 text-base font-semibold text-ink-900 transition-colors hover:bg-amber-300 hover:text-ink-900 hover:no-underline"
            >
              Get Premium
            </a>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-1">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-mist-300">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
