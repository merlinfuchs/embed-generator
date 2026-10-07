import React from "react";
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CloudIcon,
  CommandLineIcon,
  CursorArrowRippleIcon,
  EyeDropperIcon,
  InformationCircleIcon,
  LinkIcon,
  PaintBrushIcon,
  SparklesIcon,
  Squares2X2Icon,
  TagIcon,
  VariableIcon,
} from "@heroicons/react/24/outline";
import { ClosingCta, LandingPage, Section } from "../../components/landing";

const TITLE = "Features: Discord Webhooks, Buttons, Scheduling | Embed Generator";
const DESCRIPTION =
  "Everything Embed Generator does for your Discord server: a webhook sender, buttons and role menus, scheduled messages, Components V2 and more. Free to start.";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const pages: { icon: Icon; name: string; text: string; href: string }[] = [
  {
    icon: ChatBubbleLeftRightIcon,
    name: "Discord Webhook Sender",
    text: "Send messages and embeds to any channel with a webhook URL, under any name and avatar. No bot, no login.",
    href: "/features/discord-webhooks",
  },
  {
    icon: CursorArrowRippleIcon,
    name: "Buttons and Role Menus",
    text: "Buttons and select menus that hand out roles, reply, send DMs or update the message when members click.",
    href: "/features/interactive-components",
  },
  {
    icon: ClockIcon,
    name: "Scheduled Messages",
    text: "Post a message at a set time, or every hour, day, week or month, in the timezone you pick.",
    href: "/features/scheduled-messages",
  },
  {
    icon: Squares2X2Icon,
    name: "Components V2 Builder",
    text: "Discord's newer layouts with containers, sections, separators and galleries, built visually with a live preview.",
    href: "/features/components-v2",
  },
];

const more: { icon: Icon; name: string; text: string; href: string; premium?: boolean }[] = [
  {
    icon: EyeDropperIcon,
    name: "Custom name and avatar",
    text: "Every message can look like it comes from your server.",
    href: "/docs/features/custom-branding",
  },
  {
    icon: CloudIcon,
    name: "Saved messages",
    text: "Keep templates in the cloud and reuse them anywhere.",
    href: "/docs/features/save-messages",
  },
  {
    icon: VariableIcon,
    name: "Variables",
    text: "Member names, counts and dates, filled in when the message goes out.",
    href: "/docs/guides/variables",
  },
  {
    icon: CommandLineIcon,
    name: "Custom commands",
    text: "Slash commands your members can run, answered with your messages.",
    href: "/docs/features/custom-commands",
    premium: true,
  },
  {
    icon: TagIcon,
    name: "Your own bot",
    text: "Replies come from your bot's name and avatar instead of ours.",
    href: "/docs/features/white-label",
    premium: true,
  },
  {
    icon: SparklesIcon,
    name: "AI assistant",
    text: "Describe the message you want and let AI build it in the editor.",
    href: "/docs/features/ai-assistant",
  },
  {
    icon: PaintBrushIcon,
    name: "Colored text generator",
    text: "Color words in Discord with ANSI code blocks you copy and paste.",
    href: "/app/tools/colored-text",
  },
  {
    icon: LinkIcon,
    name: "Embed links",
    text: "Links that unfurl into a rich embed when posted, no webhook needed.",
    href: "/app/tools/embed-links",
  },
  {
    icon: InformationCircleIcon,
    name: "Webhook info",
    text: "See the name, server and creator behind any webhook URL.",
    href: "/app/tools/webhook-info",
  },
];

export default function Features(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION}>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-[520px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure-600/20 blur-[140px]"
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 lg:pb-20 lg:pt-20">
          <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-mist-100 sm:text-5xl lg:text-6xl">
            Everything Embed Generator does for{" "}
            <span className="text-azure-400">your server</span>
          </h1>
          <p className="mb-12 max-w-2xl text-lg leading-relaxed text-mist-400">
            Build Discord messages in a visual editor, then send them through a
            webhook or the bot, on a schedule or with buttons that do things.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {pages.map((p) => (
              <a
                key={p.href}
                href={p.href}
                className="group flex flex-col rounded-2xl border border-solid border-white/5 bg-ink-800 p-6 shadow-card transition-colors hover:border-white/15 hover:no-underline"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-azure-500/15 text-azure-300">
                  <p.icon className="h-6 w-6" />
                </div>
                <h2 className="mb-2 mt-0 text-xl font-semibold text-mist-100">
                  {p.name}
                </h2>
                <p className="mb-4 mt-0 flex-1 text-sm leading-relaxed text-mist-400">
                  {p.text}
                </p>
                <span className="flex items-center gap-1.5 text-sm font-medium text-azure-400 group-hover:text-azure-300">
                  Learn more
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Section title="And a lot more.">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {more.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="group flex gap-4 hover:no-underline"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-azure-500/15 text-azure-300">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1 mt-0 flex items-center gap-2 text-base font-semibold text-mist-100 group-hover:text-azure-300">
                  {m.name}
                  {m.premium && (
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                      Premium
                    </span>
                  )}
                </h3>
                <p className="m-0 text-sm leading-relaxed text-mist-400">
                  {m.text}
                </p>
              </div>
            </a>
          ))}
        </div>
      </Section>

      <ClosingCta
        title="Start with a message."
        text="Open the editor, no account needed."
        cta={{ label: "Open the editor", href: "/app/editor" }}
      />
    </LandingPage>
  );
}
