import React from "react";
import {
  ArrowPathIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ClockIcon,
  CodeBracketIcon,
  CursorArrowRippleIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  VariableIcon,
} from "@heroicons/react/24/outline";
import {
  ClosingCta,
  Faq,
  Features,
  Hero,
  LandingPage,
  Questions,
  Screenshot,
  Section,
  Steps,
} from "../../../components/landing";

const TITLE =
  "Schedule Discord Messages: Once, on Dates or on Repeat | Embed Generator";
const DESCRIPTION =
  "Schedule Discord messages with embeds and buttons. Send once, on a list of dates, or every few minutes, hours, days, weeks or months, in any timezone. Free to send once.";
const SCHEDULE = { label: "Schedule a message", href: "/app/scheduled" };
const IMG = "/img/features/scheduled-messages";

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
    title: "Say when",
    text: "Open Scheduled Messages, pick the saved message and the channel, then click the dates or set up the repeat. The next sends show up as you go.",
  },
];

// Every way to say when, from the simplest to the most flexible.
const ways = [
  {
    icon: ClockIcon,
    name: "Once",
    example: "Sat, Oct 31 at 7:00 PM",
    text: "One date and time. Free on every server.",
  },
  {
    icon: CalendarDaysIcon,
    name: "On a list of dates",
    example: "Oct 17 at 12 PM and 6 PM, Oct 18, Oct 24",
    text: "Click the days on a calendar and give each one or more times. Up to 100 sends in one scheduled message.",
  },
  {
    icon: ArrowPathIcon,
    name: "Every few minutes or hours",
    example: "Every 6 hours at :30",
    text: "Real hours, so a daylight saving change never squeezes or stretches the gap.",
  },
  {
    icon: ArrowPathIcon,
    name: "Every few days",
    example: "Every 14 days at 9:00 AM",
    text: "Counted from your start date. No surprise restart on the 1st of the month like with cron.",
  },
  {
    icon: ArrowPathIcon,
    name: "Every few weeks on chosen days",
    example: "Every 2 weeks on Tue and Thu at 7:30 PM",
    text: "Pick any weekdays. Weeks start on Monday.",
  },
  {
    icon: ArrowPathIcon,
    name: "Every few months on a day",
    example: "Every 3 months on day 1 at 10:00 AM",
    text: "Quarterly reports, monthly recaps, yearly birthdays with every 12 months.",
  },
  {
    icon: CodeBracketIcon,
    name: "Any cron expression",
    example: "0 9 * * 1-5",
    text: "For everything else, like weekdays at 9:00. The preview tells you in plain words what it does.",
  },
  {
    icon: FlagIcon,
    name: "With an end",
    example: "Every day at 8:00 AM, 30 times",
    text: "Stop on a date or after a number of sends, like a countdown or a 30 day challenge. The preview shows when the last one goes out.",
  },
];

const modifiers = [
  "Start on any date",
  "Any timezone",
  "Edit one message in place",
  "New forum post each time",
];

const features = [
  {
    icon: GlobeAltIcon,
    name: "Your timezone, all year",
    text: "Times are in the timezone you pick. Repeats follow daylight saving time, so a message at 9:00 stays at 9:00, and a time the clocks skip still goes out once.",
  },
  {
    icon: PencilSquareIcon,
    name: "Update one message",
    text: "Point a schedule at a message the bot already sent and each run edits it instead of posting a new one. Good for a leaderboard that refreshes every other day.",
  },
  {
    icon: BeakerIcon,
    name: "Checked before it's saved",
    text: "Saving checks the message for broken variables and components, so the first send doesn't fail at 3 AM. Send test posts it to the channel right away.",
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
    text: "If a send fails, the schedule shows why and when. If Discord rejects the message, it stops instead of retrying forever, and the list marks it in red.",
  },
];

const faq: Faq[] = [
  {
    q: "Can you schedule messages on Discord?",
    a: "Yes, with a bot. Embed Generator's bot posts a saved message to a channel at the time you set: once, on a list of dates, or on a repeating schedule.",
  },
  {
    q: "Is it free?",
    a: "Scheduling a message to send once is free. Repeating schedules, lists of dates and more scheduled messages per server come with Premium.",
    link: { label: "Premium", href: "/docs/premium" },
  },
  {
    q: "How often can a message repeat?",
    a: "As often as every minute, or every few hours, days, weeks or months. For anything else you can enter a cron expression. You can set when it starts and when it ends, on a date or after a number of sends.",
  },
  {
    q: "Can I send every two weeks?",
    a: "Yes. Pick every 2 weeks and the days of the week. It's counted from your start date, so it keeps a real two week rhythm, unlike cron's day-of-month steps that restart every month.",
  },
  {
    q: "Can I send the same message on several dates?",
    a: "Yes. Switch to On specific dates, click the days in the calendar and give each day one or more times. One scheduled message holds up to 100 dates.",
  },
  {
    q: "How do I see everything that's scheduled?",
    a: "The Calendar tab shows every upcoming send of the server in one month view, in the timezone you pick. Click a send to open its schedule.",
  },
  {
    q: "Can I schedule a post in a forum channel?",
    a: "Yes. Pick the forum or media channel and set a thread name. Each run creates a new post with that name.",
  },
  {
    q: "Can a schedule edit a message instead of posting a new one?",
    a: "Yes. Paste the link of a message Embed Generator sent into Message ID or URL. Each run edits it in place and keeps its name and avatar.",
  },
];

type Mode = "once" | "dates" | "repeat" | "cron";

interface Send {
  at: string;
  in: string;
}

interface RepeatExample {
  every: number;
  unit: string;
  weekdays?: string[];
  monthDay?: number;
  at?: string;
  summary: string;
  sends: Send[];
}

const repeatExamples: RepeatExample[] = [
  {
    every: 2,
    unit: "weeks",
    weekdays: ["Tue", "Thu"],
    at: "7:30 PM",
    summary: "Every 2 weeks on Tue, Thu at 7:30 PM",
    sends: [
      { at: "Thu, Oct 8, 7:30 PM", in: "in 8 hours" },
      { at: "Tue, Oct 20, 7:30 PM", in: "in 12 days" },
      { at: "Thu, Oct 22, 7:30 PM", in: "in 14 days" },
      { at: "Tue, Nov 3, 7:30 PM", in: "in 26 days" },
      { at: "Thu, Nov 5, 7:30 PM", in: "in 28 days" },
    ],
  },
  {
    every: 3,
    unit: "days",
    at: "9:00 AM",
    summary: "Every 3 days at 9:00 AM",
    sends: [
      { at: "Fri, Oct 9, 9:00 AM", in: "in 22 hours" },
      { at: "Mon, Oct 12, 9:00 AM", in: "in 4 days" },
      { at: "Thu, Oct 15, 9:00 AM", in: "in 7 days" },
      { at: "Sun, Oct 18, 9:00 AM", in: "in 10 days" },
      { at: "Wed, Oct 21, 9:00 AM", in: "in 13 days" },
    ],
  },
  {
    every: 6,
    unit: "hours",
    at: ":30",
    summary: "Every 6 hours at minute 30",
    sends: [
      { at: "Thu, Oct 8, 11:30 AM", in: "in 30 minutes" },
      { at: "Thu, Oct 8, 5:30 PM", in: "in 6 hours" },
      { at: "Thu, Oct 8, 11:30 PM", in: "in 12 hours" },
      { at: "Fri, Oct 9, 5:30 AM", in: "in 18 hours" },
      { at: "Fri, Oct 9, 11:30 AM", in: "in 1 day" },
    ],
  },
  {
    every: 3,
    unit: "months",
    monthDay: 1,
    at: "10:00 AM",
    summary: "Every 3 months on day 1 at 10:00 AM",
    sends: [
      { at: "Sun, Nov 1, 10:00 AM", in: "in 24 days" },
      { at: "Mon, Feb 1, 10:00 AM", in: "in 4 months" },
      { at: "Sat, May 1, 10:00 AM", in: "in 7 months" },
      { at: "Sun, Aug 1, 10:00 AM", in: "in 10 months" },
      { at: "Mon, Nov 1, 10:00 AM", in: "in 1 year" },
    ],
  },
  {
    every: 15,
    unit: "minutes",
    summary: "Every 15 minutes",
    sends: [
      { at: "Thu, Oct 8, 11:15 AM", in: "in 15 minutes" },
      { at: "Thu, Oct 8, 11:30 AM", in: "in 30 minutes" },
      { at: "Thu, Oct 8, 11:45 AM", in: "in 45 minutes" },
      { at: "Thu, Oct 8, 12:00 PM", in: "in 1 hour" },
      { at: "Thu, Oct 8, 12:15 PM", in: "in 1 hour" },
    ],
  },
];

const dateTimes = [
  { date: 17, label: "Sat, Oct 17", times: ["12:00 PM", "6:00 PM"] },
  { date: 18, label: "Sun, Oct 18", times: ["12:00 PM", "7:00 PM"] },
  { date: 24, label: "Sat, Oct 24", times: ["3:00 PM"] },
];

const dateSends: Send[] = [
  { at: "Sat, Oct 17, 12:00 PM", in: "in 9 days" },
  { at: "Sat, Oct 17, 6:00 PM", in: "in 9 days" },
  { at: "Sun, Oct 18, 12:00 PM", in: "in 10 days" },
  { at: "Sun, Oct 18, 7:00 PM", in: "in 10 days" },
  { at: "Sat, Oct 24, 3:00 PM", in: "in 16 days" },
];

const cronExamples: { cron: string; summary: string; sends: Send[] }[] = [
  {
    cron: "0 9 * * 1-5",
    summary: "At 9:00 AM, Monday through Friday",
    sends: [
      { at: "Fri, Oct 9, 9:00 AM", in: "in 22 hours" },
      { at: "Mon, Oct 12, 9:00 AM", in: "in 4 days" },
      { at: "Tue, Oct 13, 9:00 AM", in: "in 5 days" },
      { at: "Wed, Oct 14, 9:00 AM", in: "in 6 days" },
      { at: "Thu, Oct 15, 9:00 AM", in: "in 7 days" },
    ],
  },
  {
    cron: "0 12 L * *",
    summary: "At 12:00 PM, on the last day of the month",
    sends: [
      { at: "Sat, Oct 31, 12:00 PM", in: "in 23 days" },
      { at: "Mon, Nov 30, 12:00 PM", in: "in 2 months" },
      { at: "Thu, Dec 31, 12:00 PM", in: "in 3 months" },
      { at: "Sun, Jan 31, 12:00 PM", in: "in 4 months" },
      { at: "Sun, Feb 28, 12:00 PM", in: "in 5 months" },
    ],
  },
  {
    cron: "0 18 * * 5#1",
    summary: "At 6:00 PM, on the first Friday of the month",
    sends: [
      { at: "Fri, Nov 6, 6:00 PM", in: "in 29 days" },
      { at: "Fri, Dec 4, 6:00 PM", in: "in 2 months" },
      { at: "Fri, Jan 1, 6:00 PM", in: "in 3 months" },
      { at: "Fri, Feb 5, 6:00 PM", in: "in 4 months" },
      { at: "Fri, Mar 5, 6:00 PM", in: "in 5 months" },
    ],
  },
];

function Field({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}): JSX.Element {
  return (
    <span
      className={[
        "inline-flex items-center rounded-lg bg-ink-900 px-3 py-1.5 text-mist-100",
        wide ? "min-w-[96px]" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}): JSX.Element {
  return (
    <div className="inline-flex rounded-lg bg-ink-900 p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={[
            "cursor-pointer rounded-md border-0 px-3 py-1 text-sm transition-colors",
            value === o.value
              ? "bg-ink-700 font-medium text-mist-100"
              : "bg-transparent text-mist-500 hover:text-mist-300",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Examples({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: number;
  onChange: (i: number) => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(i)}
          className={[
            "cursor-pointer rounded-full border border-solid px-2.5 py-1 text-xs transition-colors",
            i === value
              ? "border-azure-400/60 bg-azure-500/15 text-azure-300"
              : "border-white/10 bg-transparent text-mist-500 hover:text-mist-300",
          ].join(" ")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RepeatSentence({ r }: { r: RepeatExample }): JSX.Element {
  return (
    <div className="space-y-3 text-sm text-mist-400">
      <div className="flex flex-wrap items-center gap-2">
        Every <Field>{r.every}</Field>
        <Field wide>{r.unit} ▾</Field>
        {r.monthDay && (
          <>
            on day <Field>{r.monthDay}</Field>
          </>
        )}
        {r.at && (
          <>
            at <Field>{r.at}</Field>
          </>
        )}
      </div>
      {r.weekdays && (
        <div className="flex flex-wrap items-center gap-1.5">
          on
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span
              key={d}
              className={[
                "rounded-full px-2.5 py-1 text-xs",
                r.weekdays?.includes(d)
                  ? "bg-azure-500 text-white"
                  : "bg-ink-900 text-mist-400",
              ].join(" ")}
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DatePicker({
  days,
}: {
  days: { date: number; label: string; times: string[] }[];
}): JSX.Element {
  const picked = days.map((d) => d.date);
  // October 2026 starts on a Thursday.
  const cells = [
    ...Array<null>(3).fill(null),
    ...Array.from({ length: 31 }, (_, i) => i + 1),
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="pb-1 text-mist-500">
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={d ?? `blank-${i}`}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-md",
              d && picked.includes(d)
                ? "bg-azure-500 text-white"
                : d && d < 8
                  ? "text-mist-500/50"
                  : "text-mist-300",
            ].join(" ")}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm">
        {days.map((d) => (
          <div key={d.label} className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-mist-300">{d.label}</span>
            {d.times.map((t) => (
              <Field key={t}>{t}</Field>
            ))}
            <span className="text-mist-500">+</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The schedule editor of the app, switchable between every way to say when, with the sends it
// produces. The times are fixed, as if it was Thursday, Oct 8 at 11:00 AM in New York.
function ScheduleShowcase(): JSX.Element {
  const [mode, setMode] = React.useState<Mode>("repeat");
  const [example, setExample] = React.useState(0);
  const [cronExample, setCronExample] = React.useState(0);

  const r = repeatExamples[example];
  const c = cronExamples[cronExample];
  const summary = {
    once: "Sat, Oct 31 at 7:00 PM",
    dates: "5 dates from Sat, Oct 17 to Sat, Oct 24",
    repeat: r.summary,
    cron: c.summary,
  }[mode];
  const sends = {
    once: [{ at: "Sat, Oct 31, 7:00 PM", in: "in 23 days" }],
    dates: dateSends,
    repeat: r.sends,
    cron: c.sends,
  }[mode];

  return (
    <div className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5 shadow-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-mist-400">
          When
        </div>
        <Tabs<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "once", label: "Once" },
            { value: "dates", label: "Dates" },
            { value: "repeat", label: "Repeat" },
            { value: "cron", label: "Cron" },
          ]}
        />
      </div>

      <div className="min-h-[200px]">
        {mode === "once" && (
          <DatePicker
            days={[{ date: 31, label: "Sat, Oct 31", times: ["7:00 PM"] }]}
          />
        )}
        {mode === "dates" && <DatePicker days={dateTimes} />}
        {mode === "repeat" && (
          <div className="space-y-4">
            <RepeatSentence r={r} />
            <Examples
              options={repeatExamples.map((e) => e.summary)}
              value={example}
              onChange={setExample}
            />
          </div>
        )}
        {mode === "cron" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start gap-2 text-sm text-mist-400">
              {c.cron.split(" ").map((f, i) => (
                <div key={["minute", "hour", "day", "month", "weekday"][i]}>
                  <div className="min-w-[52px] rounded-lg bg-ink-900 px-3 py-1.5 text-center font-mono text-mist-100">
                    {f}
                  </div>
                  <div className="mt-1 text-center text-[11px] text-mist-500">
                    {["minute", "hour", "day", "month", "weekday"][i]}
                  </div>
                </div>
              ))}
            </div>
            <Examples
              options={cronExamples.map((e) => e.summary)}
              value={cronExample}
              onChange={setCronExample}
            />
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-ink-900/70 p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist-400">
          Upcoming sends
        </div>
        <div className="mb-3 text-sm text-mist-300">
          {summary}{" "}
          <span className="text-mist-500">(America/New_York)</span>
        </div>
        <ol className="m-0 list-none space-y-1.5 p-0 text-sm">
          {sends.map((s, i) => (
            <li
              key={s.at}
              className="flex justify-between gap-4"
              style={{ animation: `fadeIn .25s ease-out ${i * 40}ms both` }}
            >
              <span className={i === 0 ? "text-mist-100" : "text-mist-300"}>
                {s.at}
              </span>
              <span className="text-mist-500">{s.in}</span>
            </li>
          ))}
        </ol>
        {mode !== "once" && (
          <div className="mt-2 text-xs text-mist-500">
            {mode === "dates" ? "and that's all" : "and so on"}
          </div>
        )}
      </div>
    </div>
  );
}

function WaysToSchedule(): JSX.Element {
  return (
    <Section title="Every way to say when.">
      <div className="grid gap-4 sm:grid-cols-2">
        {ways.map((w) => (
          <div
            key={w.name}
            className="rounded-2xl border border-solid border-white/5 bg-ink-800 p-5"
          >
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-mist-100">
              <w.icon className="h-5 w-5 flex-none text-azure-300" />
              {w.name}
            </div>
            <div className="mb-3 inline-block rounded-lg bg-ink-900 px-3 py-1.5 text-sm text-azure-300">
              {w.example}
            </div>
            <p className="m-0 text-sm leading-relaxed text-mist-400">
              {w.text}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-1 text-mist-500">With any of them:</span>
        {modifiers.map((m) => (
          <span
            key={m}
            className="rounded-full border border-solid border-white/10 px-3 py-1 text-mist-300"
          >
            {m}
          </span>
        ))}
      </div>
    </Section>
  );
}

// A screenshot from the app next to what it shows, alternating sides down the page.
function Showcase({
  icon: Icon,
  title,
  text,
  src,
  alt,
  flip,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
  src: string;
  alt: string;
  flip?: boolean;
}): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5">
      <div
        className={[
          "mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:px-8 lg:gap-16",
          flip
            ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
            : "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
        ].join(" ")}
      >
        <div className={flip ? "lg:order-2" : undefined}>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-azure-500/15 text-azure-300">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="mb-4 mt-0 text-3xl font-bold tracking-tight text-mist-100">
            {title}
          </h2>
          <p className="m-0 text-base leading-relaxed text-mist-400">{text}</p>
        </div>
        <div className={flip ? "lg:order-1" : undefined}>
          <Screenshot src={src} alt={alt} />
        </div>
      </div>
    </section>
  );
}

export default function ScheduledMessages(): JSX.Element {
  return (
    <LandingPage title={TITLE} description={DESCRIPTION} faq={faq}>
      <Hero
        title={
          <>
            Schedule <span className="text-azure-400">Discord messages</span>{" "}
            any way you like
          </>
        }
        text="Once, on a handful of dates, every other Tuesday or every 6 hours. Pick when, check the next sends right away, and Embed Generator's bot posts the message on time in your timezone."
        cta={SCHEDULE}
        stats={[
          { value: "Free", label: "to send once" },
          { value: "1 min", label: "to years apart" },
          { value: "100", label: "dates per message" },
          { value: "Any", label: "timezone" },
        ]}
        aside={<ScheduleShowcase />}
      />
      <WaysToSchedule />
      <Showcase
        icon={ArrowPathIcon}
        title="Repeats that read like a sentence."
        text="Pick a number, a unit, the days and a time, and the schedule reads like you'd say it: every 2 weeks on Tuesday and Thursday at 7:30 PM. The upcoming sends update while you edit, so you know what it does before you save it, and the cadence is counted from your start date instead of resetting every month."
        src={`${IMG}/repeat.webp`}
        alt="The repeat editor with every 2 weeks on Tuesday and Thursday and the upcoming sends"
      />
      <Showcase
        icon={CalendarDaysIcon}
        title="Or just pick the dates."
        text="For events that don't follow a pattern, click the days in the calendar and give each one as many times as you need. A tournament weekend with a reminder at noon and one before the finals is a single scheduled message."
        src={`${IMG}/dates.webp`}
        alt="The date picker with three days selected, two of them with two times"
        flip
      />
      <Showcase
        icon={Squares2X2Icon}
        title="See the whole month at once."
        text="The calendar shows every upcoming send of the server in the timezone you pick, colored by message. Spot a crowded Friday, click a send to open its schedule, or click the plus on a day to schedule something new on it."
        src={`${IMG}/calendar.webp`}
        alt="A month calendar with the sends of several scheduled messages"
      />
      <Showcase
        icon={ExclamationTriangleIcon}
        title="Know what's running."
        text="Every scheduled message shows whether it's active, paused, ended or stopped, and when it sends next. If Discord rejects a message, it stops and says why instead of failing quietly."
        src={`${IMG}/list.webp`}
        alt="The list of scheduled messages with active, paused, ended and stopped ones"
        flip
      />
      <Steps
        title="Schedule a message in three steps."
        steps={steps}
        aside={
          <Screenshot
            src={`${IMG}/once.webp`}
            alt="A scheduled message that sends once on October 31"
          />
        }
      />
      <Features title="More than a reminder bot." features={features} />
      <Questions faq={faq} />
      <ClosingCta
        title="Got something to announce?"
        text="Build it once and let the bot post it on time, as often as you need."
        cta={SCHEDULE}
      />
    </LandingPage>
  );
}
