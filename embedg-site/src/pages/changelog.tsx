import React from "react";
import { ClosingCta, LandingPage } from "../components/landing";
import { changelog, ChangeDay } from "../data/changelog";

const TITLE = "Changelog: what's new in Embed Generator";
const DESCRIPTION =
  "New features, plan changes, and fixes in Embed Generator, newest first, from forms and polls back to the first version of the bot in 2018.";

interface Month {
  id: string;
  name: string;
  days: ChangeDay[];
  count: number;
}

// Dates are calendar days, so they're read and shown in UTC to keep them from shifting a day.
function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function byMonth(days: ChangeDay[]): Month[] {
  const months: Month[] = [];
  for (const day of days) {
    const d = parse(day.date);
    const name = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    let month = months[months.length - 1];
    if (!month || month.name !== name) {
      month = {
        id: name.toLowerCase().replace(" ", "-"),
        name,
        days: [],
        count: 0,
      };
      months.push(month);
    }
    month.days.push(day);
    month.count += day.changes.length;
  }
  return months;
}

function shortDate(date: string): string {
  return parse(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Day({ day }: { day: ChangeDay }): JSX.Element {
  const big = day.changes.filter((c) => c.text);
  const small = day.changes.filter((c) => !c.text);
  return (
    <div className="grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-6">
      <time
        dateTime={day.date}
        className="pt-0.5 text-sm font-medium text-mist-500"
      >
        {shortDate(day.date)}
      </time>
      <div className="grid gap-6">
        {big.map((c) => (
          <div key={c.title}>
            <h3 className="mb-1.5 mt-0 text-base font-semibold text-mist-100">
              {c.title}
            </h3>
            <p className="m-0 max-w-2xl text-sm leading-relaxed text-mist-400">
              {c.text}
              {c.href && (
                <>
                  {" "}
                  <a
                    href={c.href}
                    className="whitespace-nowrap text-azure-400 hover:text-azure-300"
                  >
                    Learn more →
                  </a>
                </>
              )}
            </p>
          </div>
        ))}
        {small.length > 0 && (
          <ul className="m-0 grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-mist-400 marker:text-mist-500">
            {small.map((c) => (
              <li key={c.title}>
                {c.href ? (
                  <a
                    href={c.href}
                    className="text-mist-300 hover:text-azure-300"
                  >
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Changelog(): JSX.Element {
  const months = byMonth(changelog);
  return (
    <LandingPage title={TITLE} description={DESCRIPTION}>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-[520px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure-600/20 blur-[140px]"
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-16 md:px-8 lg:pb-16 lg:pt-20">
          <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-mist-100 sm:text-5xl lg:text-6xl">
            What's new in <span className="text-azure-400">Embed Generator</span>
          </h1>
          <p className="m-0 max-w-2xl text-lg leading-relaxed text-mist-400">
            New features, plan changes, and fixes, newest first. The bot started
            in 2018, and the editor has been open source on GitHub since 2022.
          </p>
        </div>
      </section>

      {months.map((m) => (
        <section
          key={m.id}
          id={m.id}
          className="scroll-mt-20 border-0 border-t border-solid border-white/5"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:py-16">
            <div>
              <h2 className="m-0 text-2xl font-bold tracking-tight text-mist-100 lg:sticky lg:top-20">
                <a href={`#${m.id}`} className="text-inherit hover:no-underline">
                  {m.name}
                </a>
                <span className="mt-1 block text-sm font-normal tracking-normal text-mist-500">
                  {m.count} {m.count === 1 ? "change" : "changes"}
                </span>
              </h2>
            </div>
            <div className="grid gap-10">
              {m.days.map((d) => (
                <Day key={d.date} day={d} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <ClosingCta
        title="Try what's new."
        text="Open the editor, no account needed."
        cta={{ label: "Open the editor", href: "/app/editor" }}
      />
    </LandingPage>
  );
}
