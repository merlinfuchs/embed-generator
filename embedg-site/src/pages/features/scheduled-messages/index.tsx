import React from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/solid";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CursorArrowRippleIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  HashtagIcon,
  PencilSquareIcon,
  VariableIcon,
} from "@heroicons/react/24/outline";
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

const TITLE =
  "Schedule Discord Messages: Send Later or on Repeat | Embed Generator";
const DESCRIPTION =
  "Schedule Discord messages with embeds and buttons. Pick a channel and a time and the bot posts it, once or every hour, day, week or month. Free to send once.";
const SCHEDULE = { label: "Schedule a message", href: "/app/scheduled" };

const steps = [
  {
    title: "Add the bot to your server",
    text: "Log in with Discord and add Embed Generator to your server. The bot sends the message, so it needs access to the channel.",
  },
  {
    title: "Build and save the message",
    text: "Write it in the editor with embeds, images and buttons, then save it. A schedule always sends a saved message, so you can change the message later without touching the schedule.",
  },
  {
    title: "Pick a channel and a time",
    text: "Open Scheduled Messages, choose the saved message and the channel, then set a date and time or a repeating schedule.",
  },
];

const features = [
  {
    icon: ArrowPathIcon,
    name: "Once or on repeat",
    text: "Send at a set date and time, or every few minutes, hours, days, weeks or months, with an optional start and end date. Repeats come with Premium.",
  },
  {
    icon: GlobeAltIcon,
    name: "Your timezone",
    text: "Times are in the timezone you pick. Repeats follow daylight saving time, so a message at 9:00 stays at 9:00 all year.",
  },
  {
    icon: PencilSquareIcon,
    name: "Update one message",
    text: "Point a schedule at a message the bot already sent and each run edits it instead of posting a new one. Good for a status board that refreshes every day.",
  },
  {
    icon: VariableIcon,
    name: "Live variables",
    text: "The server name, member count and channel are filled in when the message goes out, not when you wrote it.",
    href: "/docs/guides/variables",
  },
  {
    icon: CursorArrowRippleIcon,
    name: "Buttons that work",
    text: "Buttons and select menus in the saved message keep working in scheduled posts, including ones that hand out roles.",
    href: "/docs/guides/interactive-components",
  },
  {
    icon: ExclamationTriangleIcon,
    name: "Clear errors",
    text: "If a run fails, the schedule shows why and when. If Discord rejects the message, a repeating schedule stops instead of retrying forever.",
  },
];

const faq: Faq[] = [
  {
    q: "Can you schedule messages on Discord?",
    a: "Yes, with a bot. Embed Generator's bot posts a saved message to a channel at the time you set, once or on a repeating schedule.",
  },
  {
    q: "Is it free?",
    a: "Scheduling a message to send once is free. Repeating schedules and more scheduled messages per server come with Premium.",
    link: { label: "Premium", href: "/docs/premium" },
  },
  {
    q: "How often can a message repeat?",
    a: "Every few minutes, hours, days, weeks or months, or on a custom cron schedule. You can set when the schedule starts and when it ends.",
  },
  {
    q: "Can I schedule a post in a forum channel?",
    a: "Yes. Pick the forum or media channel and set a thread name. Each run creates a new post with that name.",
  },
  {
    q: "Can a schedule edit a message instead of posting a new one?",
    a: "Yes. Paste the link of a message Embed Generator sent into Message ID or URL. Each run edits it in place and keeps its name and avatar.",
  },
  {
    q: "Can I change the message after scheduling it?",
    a: "Yes. A schedule sends the saved message as it is when the run happens, so edit the saved message and the next run picks up the change.",
  },
];

// A schedule from the app next to the post it produces. The toggle switches between the two modes.
function SchedulePreview(): JSX.Element {
  const [repeat, setRepeat] = React.useState(true);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-mist-100">
            <ClockIcon className="h-5 w-5 text-mist-400" />
            Game night
          </div>
          <span className="flex items-center gap-1.5 text-xs text-mist-400">
            <span className="h-2 w-2 rounded-full bg-[#57F287]" />
            Enabled
          </span>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-ink-900 px-3 py-1.5 text-mist-300">
            Game night invite
          </span>
          <span className="text-mist-500">→</span>
          <span className="flex items-center gap-1 rounded-lg bg-ink-900 px-3 py-1.5 text-mist-300">
            <HashtagIcon className="h-3.5 w-3.5" />
            events
          </span>
        </div>
        <div className="mb-4 inline-flex rounded-lg bg-ink-900 p-1 text-sm">
          {[
            { label: "Send Once", value: false },
            { label: "Send Periodically", value: true },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setRepeat(o.value)}
              className={[
                "cursor-pointer rounded-md border-0 px-3 py-1 text-sm transition-colors",
                repeat === o.value
                  ? "bg-ink-700 font-medium text-mist-100"
                  : "bg-transparent text-mist-500 hover:text-mist-300",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <CalendarDaysIcon className="h-4 w-4 text-azure-300" />
          <span className="text-mist-100">
            {repeat ? "Every Friday at 6:00 PM" : "Friday at 6:00 PM"}
          </span>
          <span className="text-mist-500">Europe/Berlin</span>
          {repeat && (
            <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-300">
              Premium
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-solid border-white/5 bg-discord-bg p-5 shadow-card">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-mist-400">
          <HashtagIcon className="h-4 w-4" />
          events
        </div>
        <div className="flex gap-4">
          <Avatar icon={ChatBubbleLeftRightIcon} color="bg-azure-500" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-medium text-mist-100">Event Team</span>
              <span className="rounded bg-discord-button px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                App
              </span>
              <span className="text-xs text-mist-500">Friday at 6:00 PM</span>
            </div>
            <div className="mt-1 max-w-md rounded-md border-0 border-l-4 border-solid border-azure-500 bg-discord-embed p-4">
              <div className="mb-1 text-base font-semibold text-mist-100">
                Game night starts now 🎲
              </div>
              <div className="text-sm leading-relaxed text-mist-300">
                Join the Game Night voice channel and bring a friend. Snacks
                are on you.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-semibold text-mist-100">When</div>
                  <div className="text-mist-300">
                    {repeat ? "Every Friday, 6 PM" : "This Friday, 6 PM"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-mist-100">Members</div>
                  <div className="text-mist-300">12,480</div>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <DiscordButton style="primary">I'm in</DiscordButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledMessages(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION} faq={faq}>
      <Hero
        title={
          <>
            Schedule <span className="text-azure-400">Discord messages</span>
          </>
        }
        text="Yes, you can schedule messages on Discord. Pick a saved message, a channel and a time, and Embed Generator's bot posts it right on time. Once for free, or on repeat with Premium."
        cta={SCHEDULE}
        stats={[
          { value: "Free", label: "to send once" },
          { value: "Any", label: "timezone" },
          { value: "Hourly", label: "daily, weekly, monthly" },
        ]}
        aside={<SchedulePreview />}
      />
      <Steps
        title="Schedule a message in three steps."
        steps={steps}
        image={{
          src: "/img/features/scheduled-messages/schedule-form.png",
          alt: "The form for a new scheduled message in Embed Generator",
        }}
      />
      <Features title="More than a reminder bot." features={features} />
      <Questions faq={faq} />
      <ClosingCta
        title="Got something to announce?"
        text="Build it once and let the bot post it on time."
        cta={SCHEDULE}
      />
    </LandingPage>
  );
}
