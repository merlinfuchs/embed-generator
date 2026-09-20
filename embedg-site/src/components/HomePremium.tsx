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
    <section className="bg-azure-600 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Want more? Get Premium.
          </h2>
          <p className="mb-8 max-w-md text-lg text-white/80">
            Unlocks the good stuff for one server and pays for the servers
            that keep this running for everyone else.
          </p>
          <div className="mb-8 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">$4.99</span>
            <span className="text-white/70">/ month, cancel anytime</span>
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
            <li key={p} className="flex items-center gap-3 text-white/90">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
