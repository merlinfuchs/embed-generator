import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useScheduledMessageRunsQuery } from "../api/queries";
import type { ScheduledMessageWire } from "../api/wire";
import { isOnDates, weekdayName, weekdayOrder } from "../util/schedule";

// The calendar shows the browser's local time, the messages can each be in another timezone.
export function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The six weeks shown for a month, from the Monday on or before its first day, and the day
// after them where the range ends.
function gridDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
  return Array.from(
    { length: 43 },
    (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}

const colors = [
  "bg-azure-500/25 text-azure-300",
  "bg-green/15 text-green",
  "bg-fuchsia/20 text-fuchsia",
  "bg-amber-400/20 text-amber-300",
  "bg-yellow/15 text-yellow",
];

// Stays the same for a message when the list is sorted differently.
function colorOf(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

interface Run {
  at: Date;
  msg: ScheduledMessageWire;
}

interface Props {
  guildId: string | null;
  messages: ScheduledMessageWire[];
  onOpen: (messageId: string) => void;
  // Starts a new scheduled message on a YYYY-MM-DD day, when the plan has room for one.
  onCreate: (day: string) => void;
  canCreate: boolean;
}

export default function ScheduledMessagesCalendar({
  guildId,
  messages,
  onOpen,
  onCreate,
  canCreate,
}: Props) {
  // A day whose runs don't fit its cell, showing all of them.
  const [expanded, setExpanded] = useState<string | null>(null);
  const now = new Date();
  const today = localDay(now);
  const [month, setMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const days = useMemo(
    () => gridDays(month.year, month.month),
    [month.year, month.month],
  );
  const from = days[0].toISOString();
  const to = days[42].toISOString();

  const runsQuery = useScheduledMessageRunsQuery(guildId, from, to);
  const data = runsQuery.data?.success ? runsQuery.data.data : null;

  const runsByDay = useMemo(() => {
    const byId = new Map(messages.map((m) => [m.id, m]));
    const res = new Map<string, Run[]>();
    for (const run of data?.runs ?? []) {
      const msg = byId.get(run.scheduled_message_id);
      if (!msg) continue;
      const at = new Date(run.at);
      const day = localDay(at);
      const runs = res.get(day);
      if (runs) runs.push({ at, msg });
      else res.set(day, [{ at, msg }]);
    }
    for (const runs of res.values()) {
      runs.sort((a, b) => a.at.getTime() - b.at.getTime());
    }
    return res;
  }, [data, messages]);

  const monthLabel = new Date(month.year, month.month, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );
  const move = (n: number) =>
    setMonth((m) => {
      const d = new Date(m.year, m.month + n, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const inMonth = (d: Date) => d.getMonth() === month.month;
  const agenda = days.slice(0, 42).flatMap((d) => {
    const day = localDay(d);
    const runs = runsByDay.get(day);
    return inMonth(d) && day >= today && runs ? [{ d, day, runs }] : [];
  });
  const thisMonth =
    month.year === now.getFullYear() && month.month === now.getMonth();

  const chips = (runs: Run[]) =>
    runs.map((run) => (
      <RunChip
        key={`${run.msg.id}-${run.at.getTime()}`}
        run={run}
        onOpen={onOpen}
      />
    ));

  return (
    <div className="bg-ink-700 rounded-lg p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white font-medium text-lg">{monthLabel}</div>
        <div className="flex items-center gap-1 text-mist-300">
          <button
            type="button"
            className="px-2 py-1 rounded-lg hover:bg-ink-600 text-sm"
            onClick={() =>
              setMonth({ year: now.getFullYear(), month: now.getMonth() })
            }
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            // Past months show nothing, only upcoming sends are known.
            disabled={thisMonth}
            className="p-1 rounded-lg hover:bg-ink-600 disabled:text-ink-500 disabled:hover:bg-transparent"
            onClick={() => move(-1)}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="p-1 rounded-lg hover:bg-ink-600"
            onClick={() => move(1)}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-px text-xs text-mist-500 mb-1">
          {weekdayOrder.map((d) => (
            <div key={d} className="px-2">
              {weekdayName(d)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-ink-600 rounded-lg overflow-hidden">
          {days.slice(0, 42).map((d) => {
            const day = localDay(d);
            const runs = runsByDay.get(day) ?? [];
            return (
              <div
                key={day}
                className={clsx(
                  "group min-h-24 p-1.5 text-xs",
                  inMonth(d) ? "bg-ink-800" : "bg-ink-900",
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={clsx(
                      day === today
                        ? "bg-azure-500 text-white rounded-full w-5 h-5 grid place-items-center"
                        : inMonth(d)
                          ? "text-mist-400"
                          : "text-ink-500",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {canCreate && day >= today && (
                    <button
                      type="button"
                      aria-label={`Schedule a message on ${day}`}
                      // Invisible until hovered, but still there for the keyboard and touch.
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-mist-500 hover:text-white"
                      onClick={() => onCreate(day)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {chips(expanded === day ? runs : runs.slice(0, 3))}
                {runs.length > 3 && (
                  <button
                    type="button"
                    className="text-mist-500 hover:text-white px-1"
                    onClick={() => setExpanded(expanded === day ? null : day)}
                  >
                    {expanded === day ? "Show less" : `${runs.length - 3} more`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {agenda.length === 0 ? (
          <div className="text-mist-400 text-sm font-light">
            Nothing is scheduled for the rest of {monthLabel}.
          </div>
        ) : (
          agenda.map(({ d, day, runs }) => (
            <div key={day}>
              <div className="text-mist-300 text-sm font-medium mb-1.5">
                {agendaDayFormat.format(d)}
              </div>
              <div className="space-y-1 text-sm">
                {chips(expanded === day ? runs : runs.slice(0, maxAgendaRuns))}
                {runs.length > maxAgendaRuns && (
                  <button
                    type="button"
                    className="text-mist-500 hover:text-white text-xs px-1"
                    onClick={() => setExpanded(expanded === day ? null : day)}
                  >
                    {expanded === day
                      ? "Show less"
                      : `${runs.length - maxAgendaRuns} more`}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {runsQuery.isPending && (
        <div className="text-mist-500 text-xs mt-3">Loading the sends…</div>
      )}
      {runsQuery.data && !runsQuery.data.success && (
        <div className="text-red text-xs mt-3">
          The sends couldn't be loaded: {runsQuery.data.error.message}
        </div>
      )}
      {data?.truncated && (
        <div className="text-mist-500 text-xs mt-3">
          Some messages send too often to show every run.
        </div>
      )}
    </div>
  );
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const agendaDayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
});
const maxAgendaRuns = 10;

function RunChip({
  run,
  onOpen,
}: {
  run: Run;
  onOpen: (messageId: string) => void;
}) {
  const time = timeFormat.format(run.at);
  const Icon = isOnDates(run.msg) ? CalendarDaysIcon : ArrowPathIcon;

  return (
    <button
      type="button"
      title={`${run.msg.name} at ${time}`}
      onClick={() => onOpen(run.msg.id)}
      className={clsx(
        "flex items-center gap-1 w-full rounded px-1 py-0.5 mb-0.5 text-left truncate",
        colorOf(run.msg.id),
      )}
    >
      <Icon className="h-3 w-3 flex-none" />
      <span className="flex-none">{time}</span>
      <span className="truncate">{run.msg.name}</span>
    </button>
  );
}
