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
      <div className="grid gap-10 rounded-3xl border border-solid border-white/10 bg-[linear-gradient(135deg,#182238_0%,#111A2E_55%,#1E1A2E_100%)] px-6 py-12 md:px-12 lg:grid-cols-2 lg:items-center lg:px-16 lg:py-16">
        <div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            Want more? Get Premium.
          </h2>
          <p className="mb-8 max-w-md text-lg text-mist-400">
            Unlocks the good stuff for one server and pays for the servers
            that keep this running for everyone else.
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
        <div className="flex items-start gap-4 border-0 border-t border-solid border-white/5 pt-8 lg:col-span-2">
          <img
            src="/img/merlin.webp"
            alt="Merlin"
            className="h-11 w-11 flex-none rounded-full"
          />
          <p className="m-0 max-w-3xl text-sm leading-relaxed text-mist-400">
            Embed Generator is a side project I maintain in my free time,
            together with a few contributors, and the whole thing is open
            source. Premium is what pays for hosting and keeps it free for
            everyone else. If you have questions or ideas, the{" "}
            <a href="/discord" className="text-azure-400 hover:text-azure-300">
              Discord server
            </a>{" "}
            is where I hang out.
            <span className="mt-1 block text-mist-500">— Merlin</span>
          </p>
        </div>
      </div>
    </section>
  );
}
