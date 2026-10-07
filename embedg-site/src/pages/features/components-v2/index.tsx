import React from "react";
import {
  CursorArrowRippleIcon,
  DocumentIcon,
  MinusIcon,
  PhotoIcon,
  RectangleGroupIcon,
  Square2StackIcon,
  Bars3BottomLeftIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { Avatar, DiscordButton } from "../../../components/discord";
import {
  ClosingCta,
  Faq,
  Features,
  Hero,
  LandingPage,
  Questions,
  Steps,
} from "../../../components/landing";

const TITLE = "Discord Components V2 Builder | Embed Generator";
const DESCRIPTION =
  "Build Discord Components V2 messages in a visual editor: containers, sections, thumbnails, separators, media galleries and buttons, with a live preview. Free, no code.";
const EDITOR = { label: "Open the editor", href: "/app/editor" };

const swatches = ["#4E6EF2", "#57F287", "#FEE75C", "#EB459E", "#ED4245"];

const steps = [
  {
    title: "Switch the editor to Components V2",
    text: "Open the editor and click Components V2 in the menu bar. A message uses either embeds or components, so switching starts from an empty message.",
  },
  {
    title: "Stack your components",
    text: "Add a container with an accent color, put sections, text, separators and images inside it, and add buttons below. The preview shows how Discord renders it.",
  },
  {
    title: "Send it",
    text: "Paste a webhook URL, or log in and pick a channel to send it through the bot. Buttons with actions and select menus need the bot.",
  },
];

const features = [
  {
    icon: Square2StackIcon,
    name: "Containers",
    text: "A box with an optional accent color down the side, like an embed, that holds the other components.",
  },
  {
    icon: ViewColumnsIcon,
    name: "Sections",
    text: "Text with an accessory on the right, either a thumbnail image or a button.",
  },
  {
    icon: Bars3BottomLeftIcon,
    name: "Text displays",
    text: "Markdown paragraphs with headings, lists and links. Use several to structure a longer message.",
  },
  {
    icon: MinusIcon,
    name: "Separators",
    text: "Dividers with adjustable spacing that break the message into parts.",
  },
  {
    icon: PhotoIcon,
    name: "Media galleries and files",
    text: "Up to ten images or videos in a grid, and files shown inline where they belong in the message.",
  },
  {
    icon: CursorArrowRippleIcon,
    name: "Buttons and select menus",
    text: "Action rows anywhere in the layout, with buttons that hand out roles or reply when the bot sends the message.",
    href: "/docs/guides/interactive-components",
  },
];

const faq: Faq[] = [
  {
    q: "What is Discord Components V2?",
    a: "Discord's newer message layout system, introduced in April 2025. A message is built from components you stack and nest, like containers, sections, text displays, separators and media galleries, instead of text plus embeds.",
  },
  {
    q: "Can a message have embeds and Components V2?",
    a: "No. A Components V2 message has no regular content or embeds. A container with an accent color takes the place of an embed.",
  },
  {
    q: "Can I turn an existing message into Components V2?",
    a: "Yes, by editing it with Components V2 turned on. It can't go back: Discord doesn't let an edit turn Components V2 off again, so send a new message instead.",
  },
  {
    q: "Does it work with webhooks?",
    a: "Yes. Webhooks can send Components V2 layouts with link buttons. Buttons with actions and select menus need the Embed Generator bot.",
    link: { label: "Discord webhooks", href: "/features/discord-webhooks" },
  },
  {
    q: "How big can a Components V2 message be?",
    a: "Discord allows up to 40 components per message, nested ones included, and 4,000 characters of text across all of them.",
  },
  {
    q: "Do saved and scheduled messages support it?",
    a: "Yes. Saved messages, scheduled messages and custom command responses all work with Components V2.",
    link: {
      label: "Scheduled messages",
      href: "/features/scheduled-messages",
    },
  },
];

// A Components V2 announcement. The swatches change the container's accent color.
function MessagePreview(): JSX.Element {
  const [color, setColor] = React.useState(swatches[0]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist-500">
        <span>Pick the container's accent color.</span>
        <span className="flex items-center gap-1.5">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Set color ${c}`}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={[
                "h-4 w-4 cursor-pointer rounded-full border-2 border-solid p-0",
                color === c ? "border-white" : "border-transparent",
              ].join(" ")}
            />
          ))}
        </span>
      </div>
      <div className="rounded-2xl border border-solid border-white/5 bg-discord-bg p-5 shadow-card">
        <div className="flex gap-4">
          <Avatar icon={TrophyIcon} color="bg-amber-400" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-medium text-mist-100">Tournament Team</span>
              <span className="rounded bg-discord-button px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                App
              </span>
              <span className="text-xs text-mist-500">Today at 9:41</span>
            </div>
            <div
              className="mt-1 max-w-md rounded-lg border-0 border-l-4 border-solid bg-discord-embed p-4"
              style={{ borderColor: color }}
            >
              <div className="flex gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-lg font-bold text-mist-100">
                    Summer Tournament
                  </div>
                  <div className="text-sm leading-relaxed text-mist-300">
                    Sign-ups are open until Friday. 32 teams, single
                    elimination.
                  </div>
                </div>
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-md bg-[linear-gradient(135deg,#F5B544,#E0631F)] text-white">
                  <TrophyIcon className="h-8 w-8" />
                </div>
              </div>
              <div className="my-3 h-px bg-white/10" />
              <div className="text-sm leading-relaxed text-mist-300">
                <strong className="text-mist-100">Prize pool:</strong> $500 ·{" "}
                <strong className="text-mist-100">Format:</strong> 5v5 ·{" "}
                <strong className="text-mist-100">Starts:</strong> Saturday, 6
                PM
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-md">
                <div className="flex h-24 items-end bg-[linear-gradient(135deg,#3F5BD9,#7B4EF2)] p-2 text-xs font-semibold text-white/90">
                  Bracket
                </div>
                <div className="flex h-24 items-end bg-[linear-gradient(135deg,#1F8A5B,#57F287)] p-2 text-xs font-semibold text-white/90">
                  Map pool
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <DiscordButton style="primary">Sign up</DiscordButton>
                <DiscordButton style="secondary">Rules</DiscordButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tree: { icon: typeof DocumentIcon; name: string; note?: string; depth: number }[] = [
  { icon: Square2StackIcon, name: "Container", note: "accent color", depth: 0 },
  { icon: ViewColumnsIcon, name: "Section", note: "thumbnail", depth: 1 },
  { icon: MinusIcon, name: "Separator", depth: 1 },
  { icon: Bars3BottomLeftIcon, name: "Text Display", depth: 1 },
  { icon: PhotoIcon, name: "Media Gallery", note: "2 images", depth: 1 },
  { icon: RectangleGroupIcon, name: "Action Row", note: "2 buttons", depth: 1 },
];

// The announcement above as the editor lays it out.
function ComponentTree(): JSX.Element {
  return (
    <div className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs font-medium uppercase text-mist-400">
          Components
        </div>
        <div className="inline-flex rounded-lg bg-ink-900 p-1 text-sm">
          <span className="px-3 py-1 text-mist-500">Embeds V1</span>
          <span className="rounded-md bg-ink-700 px-3 py-1 font-medium text-mist-100">
            Components V2
          </span>
        </div>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {tree.map((c) => (
          <li
            key={c.name}
            className="flex items-center gap-3 rounded-lg bg-ink-900 px-3 py-2.5 text-sm"
            style={{ marginLeft: c.depth * 24 }}
          >
            <c.icon className="h-4 w-4 flex-none text-azure-300" />
            <span className="text-mist-100">{c.name}</span>
            {c.note && <span className="text-mist-500">{c.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ComponentsV2(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION} faq={faq}>
      <Hero
        title={
          <>
            Discord <span className="text-azure-400">Components V2</span>{" "}
            builder
          </>
        }
        text="Components V2 is Discord's newer message layout. Stack containers, sections, images and buttons in any order instead of one block of text plus embeds, and see the result as you build it."
        cta={EDITOR}
        stats={[
          { value: "Free", label: "no account needed" },
          { value: "40", label: "components per message" },
          { value: "Live", label: "preview as you type" },
        ]}
        aside={<MessagePreview />}
      />
      <Steps
        title="Build a Components V2 message in three steps."
        steps={steps}
        aside={<ComponentTree />}
      />
      <Features title="Every Components V2 block." features={features} />
      <Questions faq={faq} />
      <ClosingCta
        title="Ready to build?"
        text="Switch the editor to Components V2 and start stacking."
        cta={EDITOR}
      />
    </LandingPage>
  );
}
