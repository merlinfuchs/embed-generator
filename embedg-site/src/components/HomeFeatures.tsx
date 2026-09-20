import React from "react";
import {
  CloudIcon,
  CommandLineIcon,
  CursorArrowRippleIcon,
  EyeDropperIcon,
  SparklesIcon,
  TagIcon,
  ClockIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Visual editor with live preview",
    description:
      "See exactly what your message will look like while you build it. Embeds, fields, images, buttons and select menus, all in one place.",
    href: "/docs",
    icon: Squares2X2Icon,
  },
  {
    name: "Save messages",
    description:
      "Keep your messages in the cloud, available on all your devices, and share them with your team.",
    href: "/docs/features/save-messages",
    icon: CloudIcon,
  },
  {
    name: "Custom branding",
    description:
      "Change the username and avatar of every message so it looks like it came from your own server.",
    href: "/docs/features/custom-branding",
    icon: EyeDropperIcon,
  },
  {
    name: "Interactive components",
    description:
      "Hand out roles, send responses or open links with buttons and select menus, no code required.",
    href: "/docs/features/interactive-components",
    icon: CursorArrowRippleIcon,
  },
  {
    name: "Scheduled messages",
    description:
      "Send a message once at a specific time or repeat it every hour, day or week.",
    href: "/docs/guides/scheduled-messages",
    icon: ClockIcon,
    premium: true,
  },
  {
    name: "White label",
    description:
      "Bring your own bot so interaction responses use your name and avatar instead of ours.",
    href: "/docs/features/white-label",
    icon: TagIcon,
    premium: true,
  },
  {
    name: "Custom commands",
    description:
      "Add slash commands with custom logic and responses that your members can use.",
    href: "/docs/features/custom-commands",
    icon: CommandLineIcon,
    premium: true,
  },
  {
    name: "AI assistant",
    description:
      "Draft a message from a short prompt and refine it until it fits.",
    href: "/docs/features/ai-assistant",
    icon: SparklesIcon,
    premium: true,
  },
];

export default function HomeFeatures(): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5 bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-28">
        <div className="mb-14 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            Build the message once, send it anywhere.
          </h2>
          <p className="text-lg text-mist-400">
            Works with webhooks or with our bot. Add the bot when you want
            buttons, roles and scheduling.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <a
              key={f.name}
              href={f.href}
              className="group flex flex-col rounded-2xl border border-solid border-white/5 bg-ink-800/60 p-6 shadow-card transition-colors hover:border-azure-500/40 hover:bg-ink-800 hover:no-underline"
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className={
                    f.premium
                      ? "flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"
                      : "flex h-10 w-10 items-center justify-center rounded-xl bg-azure-500/15 text-azure-300"
                  }
                >
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                {f.premium && (
                  <span className="rounded-full border border-solid border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                    Premium
                  </span>
                )}
              </div>
              <h3 className="mb-2 text-base font-semibold text-mist-100">
                {f.name}
              </h3>
              <p className="mb-0 flex-auto text-sm leading-relaxed text-mist-400">
                {f.description}
              </p>
              <div className="mt-4 text-sm font-medium text-azure-400 opacity-0 transition-opacity group-hover:opacity-100">
                Learn more →
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
