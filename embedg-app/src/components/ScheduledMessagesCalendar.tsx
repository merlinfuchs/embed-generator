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
import {
  addDays,
  addMonths,
  formatDay,
  formatMonth,
  formatTime,
  getCurrentTimezone,
  weekdayFromMonday,
  zonedDate,
  zonedDateTime,
} from "../util/time";
import TimezoneSelect from "./TimezoneSelect";

// The six weeks shown for a YYYY-MM month, from the Monday on or before its first day, and the
// day after them where the range ends.
function gridDays(month: string): string[] {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayFromMonday(first));
  return Array.from({ length: 43 }, (_, i) => addDays(start, i));
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
  at: string;
  msg: ScheduledMessageWire;
}

interface Props {
  guildId: string | null;
  messages: ScheduledMessageWire[];
  onOpen: (messageId: string) => void;
  // Starts a new scheduled message on a YYYY-MM-DD day in the timezone. Left out when the plan
  // has no room for one.
  onCreate?: (day: string, timezone: string) => void;
}

export default function ScheduledMessagesCalendar({
  guildId,
  messages,
  onOpen,
  onCreate,
}: Props) {
  // A day whose runs don't fit its cell, showing all of them.
  const [expanded, setExpanded] = useState<string | null>(null);
  // One timezone for all messages, whichever each of them is in.
  const [timezone, setTimezone] = useState(getCurrentTimezone);
  const today = zonedDate(new Date().toISOString(), timezone);
  const todayMonth = today.slice(0, 7);
  const [month, setMonth] = useState(todayMonth);

  const days = useMemo(() => gridDays(month), [month]);
  const from = zonedDateTime(days[0], timezone, 0, 0);
  const to = zonedDateTime(days[42], timezone, 0, 0);

  const runsQuery = useScheduledMessageRunsQuery(guildId, from, to);
  const data = runsQuery.data?.success ? runsQuery.data.data : null;

  const runsByDay = useMemo(() => {
    const byId = new Map(messages.map((m) => [m.id, m]));
    const res = new Map<string, Run[]>();
    for (const run of data?.runs ?? []) {
      const msg = byId.get(run.scheduled_message_id);
      if (!msg) continue;
      const day = zonedDate(run.at, timezone);
      const runs = res.get(day);
      if (runs) runs.push({ at: run.at, msg });
      else res.set(day, [{ at: run.at, msg }]);
    }
    for (const runs of res.values()) {
      runs.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    }
    return res;
  }, [data, messages, timezone]);

  const inMonth = (day: string) => day.startsWith(month);
  const agenda = days.slice(0, 42).flatMap((day) => {
    const runs = runsByDay.get(day);
    return inMonth(day) && day >= today && runs ? [{ day, runs }] : [];
  });
  const thisMonth = month === todayMonth;

  // A day's runs up to the limit, with a toggle for the rest.
  const chips = (day: string, runs: Run[], limit: number) => (
    <>
      {(expanded === day ? runs : runs.slice(0, limit)).map((run) => (
        <RunChip
          key={`${run.msg.id}-${run.at}`}
          run={run}
          timezone={timezone}
          onOpen={onOpen}
        />
      ))}
      {runs.length > limit && (
        <button
          type="button"
          className="text-mist-500 hover:text-white text-xs px-1"
          onClick={() => setExpanded(expanded === day ? null : day)}
        >
          {expanded === day ? "Show less" : `${runs.length - limit} more`}
        </button>
      )}
    </>
  );

  return (
    <div className="bg-ink-700 rounded-lg p-4 md:p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="text-white font-medium text-lg">
          {formatMonth(month)}
        </div>
        <div className="flex items-center gap-1 text-mist-300 flex-wrap">
          <div className="w-56 mr-2">
            <TimezoneSelect value={timezone} onChange={setTimezone} />
          </div>
          <button
            type="button"
            className="px-2 py-1 rounded-lg hover:bg-ink-600 text-sm"
            onClick={() => setMonth(todayMonth)}
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            // Past months show nothing, only upcoming sends are known.
            disabled={thisMonth}
            className="p-1 rounded-lg hover:bg-ink-600 disabled:text-ink-500 disabled:hover:bg-transparent"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="p-1 rounded-lg hover:bg-ink-600"
            onClick={() => setMonth((m) => addMonths(m, 1))}
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
          {days.slice(0, 42).map((day) => {
            const runs = runsByDay.get(day) ?? [];
            return (
              <div
                key={day}
                className={clsx(
                  "group min-h-24 p-1.5 text-xs",
                  inMonth(day) ? "bg-ink-800" : "bg-ink-900",
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={clsx(
                      day === today
                        ? "bg-azure-500 text-white rounded-full w-5 h-5 grid place-items-center"
                        : inMonth(day)
                          ? "text-mist-400"
                          : "text-ink-500",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {onCreate && day >= today && (
                    <button
                      type="button"
                      aria-label={`Schedule a message on ${day}`}
                      // Invisible until hovered, but still there for the keyboard and touch.
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-mist-500 hover:text-white"
                      onClick={() => onCreate(day, timezone)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {chips(day, runs, 3)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {agenda.length === 0 ? (
          <div className="text-mist-400 text-sm font-light">
            Nothing is scheduled for the rest of {formatMonth(month)}.
          </div>
        ) : (
          agenda.map(({ day, runs }) => (
            <div key={day}>
              <div className="text-mist-300 text-sm font-medium mb-1.5">
                {formatDay(`${day}T12:00:00Z`, "UTC")}
              </div>
              <div className="space-y-1 text-sm">
                {chips(day, runs, maxAgendaRuns)}
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

const maxAgendaRuns = 10;

function RunChip({
  run,
  timezone,
  onOpen,
}: {
  run: Run;
  timezone: string;
  onOpen: (messageId: string) => void;
}) {
  const time = formatTime(run.at, timezone);
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
