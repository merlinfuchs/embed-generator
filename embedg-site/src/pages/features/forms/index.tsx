import React from "react";
import { UserGroupIcon as UserGroupSolidIcon } from "@heroicons/react/24/solid";
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  InboxArrowDownIcon,
  ListBulletIcon,
  TagIcon,
  UserGroupIcon,
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

const TITLE = "Discord Forms for Applications and Reports | Embed Generator";
const DESCRIPTION =
  "Pop-up forms in Discord for staff applications, reports, and suggestions. They open from a button, then reply with the answers or give a role. Free to start.";
const FORMS = { label: "Create a form", href: "/app/forms" };
const GUIDE = "/docs/guides/forms";

const steps = [
  {
    title: "Build the form",
    text: "Open Forms in the app, pick your server, and add up to 5 questions. Each one can be a text box, a list of options, or a picker for members, roles, or channels.",
  },
  {
    title: "Add a button that opens it",
    text: "Give a button, a select menu option, or a custom command the Show Form action. Send the message with the Embed Generator bot, since Discord sends the click to the bot.",
  },
  {
    title: "Choose what happens on submit",
    text: "Add actions the same way as on a button. Reply with the answers, give the member a role, or post everything in a staff channel with Embed Generator Premium.",
  },
];

const features = [
  {
    icon: DocumentTextIcon,
    name: "Text answers",
    text: "Short answers or long paragraphs, with a minimum and maximum length and optional text that's already filled in.",
  },
  {
    icon: ListBulletIcon,
    name: "Options to pick from",
    text: "Select menus with up to 25 options, radio buttons for exactly one answer, and checkboxes for several.",
  },
  {
    icon: UserGroupIcon,
    name: "Members, roles, and channels",
    text: "Let members pick who they're reporting or which channel they mean. Their picks show up as mentions in the reply.",
  },
  {
    icon: ChatBubbleLeftEllipsisIcon,
    name: "Replies with the answers",
    text: "Quote what they wrote in a reply that only they see, or in one for the whole channel.",
    href: `${GUIDE}#using-what-members-entered`,
  },
  {
    icon: TagIcon,
    name: "Roles on submit",
    text: "Give a role to everyone who fills in the form, like a role that opens the rest of the server after a short intro.",
  },
  {
    icon: InboxArrowDownIcon,
    name: "Answers in a staff channel",
    text: "Post every answer under its question in a channel only your team sees. This needs Premium.",
  },
];

const faq: Faq[] = [
  {
    q: "How do I make a form in Discord?",
    a: "Create a form on the Forms page of Embed Generator, then give a button the Show Form action and send the message with the bot. When a member clicks the button, the form pops up.",
    link: { label: "Forms guide", href: GUIDE },
  },
  {
    q: "Are forms free?",
    a: "Yes. Every server gets 3 forms for free, 10 with Embed Generator Premium, and 25 with Ultimate. Posting the answers to a staff channel and sending them to other tools need Premium.",
    link: { label: "Premium", href: "/docs/premium" },
  },
  {
    q: "How many questions can a form have?",
    a: "Up to 5. That's the most Discord allows in one pop-up.",
  },
  {
    q: "Can I use it for staff applications?",
    a: "Yes. Ask your questions, then post the answers to a staff channel with Embed Generator Premium. Embed Generator doesn't keep a list of submissions, so that channel or your spreadsheet is where you go through them.",
  },
  {
    q: "Can a slash command open a form?",
    a: "Yes. Give a custom command like /apply or /report the Show Form action. Custom commands need Embed Generator Premium.",
    link: { label: "Custom commands", href: "/docs/features/custom-commands" },
  },
  {
    q: "Can I see who sent a form?",
    a: "Yes. Put {{.User.Mention}} in the reply or the staff channel post, and it mentions the member who submitted the form.",
  },
  {
    q: "Does the bot have to be in my server?",
    a: "Yes. Discord sends the click and the answers to the app that sent the message, so the message with the button has to come from the Embed Generator bot.",
  },
  {
    q: "Can buttons do anything else?",
    a: "Yes. Buttons and select menus can also hand out roles, reply, send DMs, or update the message without a form.",
    link: { label: "Button roles", href: "/features/interactive-components" },
  },
];

// A message with an Apply button that opens a working form, like Discord shows it.
function FormPreview(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [why, setWhy] = React.useState("");
  const [hours, setHours] = React.useState("");
  const [sent, setSent] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!why.trim()) return;
    setSent(why.trim());
    setOpen(false);
    setWhy("");
    setHours("");
  }

  const input =
    "box-border w-full rounded border-0 bg-ink-900 px-3 py-2.5 font-sans text-sm text-mist-100 outline-none placeholder:text-mist-500 focus:ring-2 focus:ring-discord-button";

  return (
    <div>
      <div className="mb-2 text-xs text-mist-500">
        Click Apply to open the form.
      </div>
      <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-solid border-white/5 bg-discord-bg p-5 shadow-card">
        <div className="flex gap-4">
          <Avatar icon={UserGroupSolidIcon} color="bg-[#E67E22]" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-medium text-mist-100">Staff Team</span>
              <span className="rounded bg-discord-button px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                App
              </span>
              <span className="text-xs text-mist-500">Today at 9:41</span>
            </div>
            <div className="mt-1 max-w-md rounded-md border-0 border-l-4 border-solid border-[#E67E22] bg-discord-embed p-4">
              <div className="mb-1 text-base font-semibold text-mist-100">
                Join the staff team
              </div>
              <div className="text-sm leading-relaxed text-mist-300">
                We're looking for two more moderators. Click below to apply, it
                takes a minute.
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <DiscordButton style="primary" onClick={() => setOpen(true)}>
                <span className="mr-1.5">📝</span>
                Apply
              </DiscordButton>
            </div>
            {sent && (
              <div
                key={sent}
                className="mt-3 animate-[fadeIn_300ms_ease-out] text-sm text-mist-300"
              >
                <span className="mr-2 rounded bg-discord-button/30 px-1.5 py-0.5 text-xs text-[#C9CDFB]">
                  Only you can see this
                </span>
                Thanks <span className="rounded bg-discord-button/30 px-1 text-[#C9CDFB]">@you</span>,
                your application is in. You wrote:
                <div className="mt-1.5 break-words border-0 border-l-4 border-solid border-ink-500 pl-3 text-mist-400">
                  {sent}
                </div>
              </div>
            )}
          </div>
        </div>

        {open && (
          <div className="absolute inset-0 flex animate-[fadeIn_200ms_ease-out] items-center justify-center bg-black/60 p-3 sm:p-6">
            <form
              onSubmit={submit}
              role="dialog"
              aria-label="Staff application"
              className="w-full max-w-sm rounded-lg bg-ink-700 shadow-card"
            >
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-mist-100">
                  <Avatar
                    icon={UserGroupSolidIcon}
                    color="bg-[#E67E22]"
                    size="h-6 w-6"
                  />
                  Staff application
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer border-0 bg-transparent p-1 text-xl leading-none text-mist-400 hover:text-mist-100"
                >
                  ×
                </button>
              </div>
              <div className="grid gap-4 px-4 py-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-mist-100">
                    Why do you want to help? <span className="text-[#F23F43]">*</span>
                  </span>
                  <textarea
                    autoFocus
                    rows={3}
                    maxLength={300}
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="A few sentences is enough"
                    className={`${input} resize-none`}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-mist-100">
                    How many hours a week can you help?
                  </span>
                  <input
                    value={hours}
                    maxLength={20}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="About 5"
                    className={input}
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 rounded-b-lg bg-ink-800 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer border-0 bg-transparent px-3 py-2 font-sans text-sm font-medium text-mist-100 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!why.trim()}
                  className="cursor-pointer rounded border-0 bg-discord-button px-5 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const fields = [
  { label: "Who are you reporting?", type: "User Select", required: true },
  { label: "What happened?", type: "Select Menu", required: true },
  { label: "Anything else we should know?", type: "Text, multiple lines" },
];

const actions = [
  {
    type: "Text Response",
    detail: "Thanks {{.User.Mention}}, the mods will take a look.",
    note: "only visible to the member",
  },
  {
    type: "Post Answers to a Channel",
    detail: "#mod-reports",
    premium: true,
  },
];

// A report form with its questions and actions as the Forms page shows them.
function FormEditor(): JSX.Element {
  return (
    <div className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase text-mist-400">Form</div>
        <span className="text-xs text-mist-500">Title: Report a member</span>
      </div>
      <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase text-mist-400">
        <span>Questions</span>
        <span className="normal-case text-mist-500">3 / 5</span>
      </div>
      <ul className="m-0 mb-5 grid list-none gap-2 p-0">
        {fields.map((f) => (
          <li
            key={f.label}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-ink-900 px-3 py-2.5 text-sm"
          >
            <span className="text-mist-100">
              {f.label}
              {f.required && <span className="ml-1 text-[#F23F43]">*</span>}
            </span>
            <span className="text-xs text-mist-500">{f.type}</span>
          </li>
        ))}
      </ul>
      <div className="mb-3 text-xs font-medium uppercase text-mist-400">
        When submitted
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {actions.map((a) => (
          <li key={a.type} className="rounded-lg bg-ink-900 px-3 py-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium text-azure-300">{a.type}</span>
              {a.note && <span className="text-xs text-mist-500">{a.note}</span>}
              {a.premium && (
                <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                  Premium
                </span>
              )}
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

export default function Forms(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION} faq={faq}>
      <Hero
        title={
          <>
            Collect applications and reports with{" "}
            <span className="text-azure-400">Discord forms</span>
          </>
        }
        text="Add a button that opens a pop-up form, and members answer without leaving Discord. When they submit it, the bot can reply with their answers or give them a role. You set it all up on a website, with no commands to learn."
        cta={FORMS}
        stats={[
          { value: "5", label: "questions per form" },
          { value: "9", label: "kinds of questions" },
          { value: "3", label: "forms on the free plan" },
        ]}
        aside={<FormPreview />}
      />
      <Steps
        title="Set up a form in three steps."
        steps={steps}
        aside={<FormEditor />}
      />
      <Features title="What a form can ask and do." features={features} />
      <Callout
        icon={ArrowsRightLeftIcon}
        title="Send the answers to a spreadsheet."
        text="With Premium, a form can send its answers to Zapier, n8n, Make, or your own server. Applications land in a spreadsheet or start a workflow there, without another bot."
        link={{
          label: "Sending answers",
          href: `${GUIDE}#sending-answers-to-other-tools`,
        }}
      />
      <Questions faq={faq} />
      <ClosingCta
        title="Ready for your first form?"
        text="Add a few questions, put a button on a message, and send it. 3 forms are free on every server."
        cta={FORMS}
      />
    </LandingPage>
  );
}
