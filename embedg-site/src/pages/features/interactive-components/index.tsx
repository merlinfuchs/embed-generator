import React from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import {
  ChatBubbleLeftEllipsisIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  TagIcon,
  UserCircleIcon,
  VariableIcon,
} from "@heroicons/react/24/outline";
import { Avatar, DiscordButton } from "../../../components/discord";
import {
  Callout,
  ClosingCta,
  Faq,
  Features,
  Hero,
  LandingPage,
  Questions,
  Steps,
} from "../../../components/landing";

const TITLE = "Discord Button Roles and Role Menus | Embed Generator";
const DESCRIPTION =
  "Discord button roles and self-role menus: reaction roles with buttons instead of emoji. Buttons can also reply, send DMs or update the message. Free, no code.";
const EDITOR = { label: "Open the editor", href: "/app/editor" };

const steps = [
  {
    title: "Log in and add the bot",
    text: "Log in with Discord and add Embed Generator to your server. The bot receives the clicks, so it needs Manage Roles and a role above the roles it hands out.",
  },
  {
    title: "Add buttons or a select menu",
    text: "At the bottom of the editor, add up to 5 rows of buttons, or select menus with up to 25 options each. Pick a label, an emoji and a style.",
  },
  {
    title: "Choose what each click does",
    text: "Give each button or option its actions, like toggling a role and replying, then send the message to a channel.",
  },
];

const features = [
  {
    icon: TagIcon,
    name: "Hand out roles",
    text: "Add, remove or toggle roles on the member who clicked. Self-role menus for pronouns, regions, pings or games take a minute.",
  },
  {
    icon: ChatBubbleLeftEllipsisIcon,
    name: "Reply",
    text: "Respond with text or a saved message, visible to everyone or only to the member who clicked.",
  },
  {
    icon: EnvelopeIcon,
    name: "Send a DM",
    text: "Send the text or saved message to the member's DMs instead of the channel.",
  },
  {
    icon: PencilSquareIcon,
    name: "Update the message",
    text: "Replace the message the button is on, for menus that change as people use them.",
  },
  {
    icon: LockClosedIcon,
    name: "Check permissions first",
    text: "Only run the actions for members with certain permissions or roles, with your own message for everyone else.",
  },
  {
    icon: VariableIcon,
    name: "Personal replies",
    text: "Mention the member, use their name or show the server's member count with variables in any reply.",
    href: "/docs/guides/variables",
  },
];

const faq: Faq[] = [
  {
    q: "Is this like reaction roles?",
    a: "Yes, with buttons or a select menu instead of emoji reactions. Members click to get or remove a role, and the bot confirms it only to them, so the channel stays clean.",
  },
  {
    q: "How do I make a role menu in Discord?",
    a: "Add buttons or a select menu to a message in Embed Generator, give each one a Toggle Role action and send it with the bot. Members click to get or remove the role, no reactions needed.",
  },
  {
    q: "Can members pick roles from a dropdown?",
    a: "Yes. Add a select menu with up to 25 options and give each option a role action. It takes less space than rows of buttons when you have many roles.",
  },
  {
    q: "Do buttons work with webhooks?",
    a: "Link buttons do. Buttons with actions and select menus need the Embed Generator bot, because Discord sends each click to the app that owns the message.",
    link: { label: "Discord webhooks", href: "/features/discord-webhooks" },
  },
  {
    q: "Why can't the bot give a role?",
    a: "The bot needs the Manage Roles permission, and its role has to be above every role it hands out in your server's role list.",
  },
  {
    q: "How many buttons can a message have?",
    a: "Up to 5 rows of 5 buttons, so 25 in total. A select menu takes a full row and holds up to 25 options.",
  },
  {
    q: "How many actions can a button have?",
    a: "2 per button or select menu option for free, and 5 with Premium.",
    link: { label: "Premium", href: "/docs/premium" },
  },
  {
    q: "Do they work in saved and scheduled messages?",
    a: "Yes. Buttons and select menus keep working in saved messages, scheduled messages and Components V2 layouts.",
    link: {
      label: "Scheduled messages",
      href: "/features/scheduled-messages",
    },
  },
];

const roles = [
  { emoji: "🎮", name: "Gamer" },
  { emoji: "🎨", name: "Artist" },
  { emoji: "🔔", name: "Announcements" },
];

// A role menu that works: each button toggles its role and answers like the bot would.
function RoleMenuPreview(): JSX.Element {
  const [mine, setMine] = React.useState<string[]>(["Announcements"]);
  const [last, setLast] = React.useState<{ name: string; added: boolean } | null>(
    null,
  );

  function toggle(name: string) {
    const added = !mine.includes(name);
    setMine((cur) => (added ? [...cur, name] : cur.filter((r) => r !== name)));
    setLast({ name, added });
  }

  return (
    <div>
      <div className="mb-2 text-xs text-mist-500">
        Click a button to toggle its role.
      </div>
      <div className="rounded-2xl border border-solid border-white/5 bg-discord-bg p-5 shadow-card">
        <div className="flex gap-4">
          <Avatar icon={ShieldCheckIcon} color="bg-[#2FA85C]" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-medium text-mist-100">Server Roles</span>
              <span className="rounded bg-discord-button px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                App
              </span>
              <span className="text-xs text-mist-500">Today at 9:41</span>
            </div>
            <div className="mt-1 max-w-md rounded-md border-0 border-l-4 border-solid border-[#2FA85C] bg-discord-embed p-4">
              <div className="mb-1 text-base font-semibold text-mist-100">
                Pick your roles
              </div>
              <div className="text-sm leading-relaxed text-mist-300">
                Click a button to get a role, click it again to remove it.
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.map((r) => (
                <DiscordButton
                  key={r.name}
                  style={mine.includes(r.name) ? "success" : "secondary"}
                  onClick={() => toggle(r.name)}
                >
                  <span className="mr-1.5">{r.emoji}</span>
                  {r.name}
                </DiscordButton>
              ))}
            </div>
            {last && (
              <div
                key={`${last.name}-${last.added}`}
                className="mt-3 flex animate-[fadeIn_300ms_ease-out] flex-wrap items-center gap-2 text-sm text-mist-300"
              >
                <span className="rounded bg-discord-button/30 px-1.5 py-0.5 text-xs text-[#C9CDFB]">
                  Only you can see this
                </span>
                {last.added ? "Added" : "Removed"} role
                <span className="rounded bg-discord-button/30 px-1 text-[#C9CDFB]">
                  @{last.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const actions = [
  { type: "Toggle Role", detail: "@Gamer" },
  {
    type: "Text Response",
    detail: "Welcome to the squad, {{ .Interaction.User.Mention }}!",
    note: "only visible to the member",
  },
];

// One button and its actions as the editor shows them.
function ActionEditor(): JSX.Element {
  return (
    <div className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase text-mist-400">
          Button
        </div>
        <span className="text-xs text-mist-500">Style: Primary</span>
      </div>
      <div className="mb-5 flex items-center gap-2 rounded-lg bg-ink-900 px-3 py-2.5 text-sm text-mist-100">
        <span>🎮</span>
        Gamer
      </div>
      <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase text-mist-400">
        <span>Actions</span>
        <span className="normal-case text-mist-500">2 / 2 · 5 with Premium</span>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {actions.map((a) => (
          <li key={a.type} className="rounded-lg bg-ink-900 px-3 py-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium text-azure-300">{a.type}</span>
              {a.note && <span className="text-xs text-mist-500">{a.note}</span>}
            </div>
            <div className="mt-1 break-words font-mono text-xs text-mist-300">
              {a.detail}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InteractiveComponents(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION} faq={faq}>
      <Hero
        title={
          <>
            Discord <span className="text-azure-400">button roles</span> and
            role menus
          </>
        }
        text="Let members pick their own roles with buttons or a select menu, like reaction roles without the emoji. Each click can also reply, send a DM or update the message. All set up in the editor, no code."
        cta={EDITOR}
        stats={[
          { value: "25", label: "buttons per message" },
          { value: "25", label: "options per select menu" },
          { value: "Free", label: "to set up" },
        ]}
        aside={<RoleMenuPreview />}
      />
      <Steps
        title="Build a role menu in three steps."
        steps={steps}
        aside={<ActionEditor />}
      />
      <Features title="What a click can do." features={features} />
      <Callout
        icon={UserCircleIcon}
        title="Replies from your own bot."
        text="Clicks are answered by the Embed Generator bot. With Premium you can connect your own bot, so replies and role messages come with your server's name and avatar."
        link={{ label: "White label bot", href: "/docs/features/white-label" }}
      />
      <Questions faq={faq} />
      <ClosingCta
        title="Ready for your first role menu?"
        text="Add a few buttons, pick the roles and send it."
        cta={EDITOR}
      />
    </LandingPage>
  );
}
