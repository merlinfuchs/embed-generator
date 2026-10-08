import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { MaxRunTimes } from "../api/wire";
import {
  dateOnDay,
  sortDates,
  weekdayName,
  weekdayOrder,
} from "../util/schedule";
import {
  addMonths,
  formatDay,
  formatMonth,
  weekdayFromMonday,
  zonedDate,
  zonedDateTime,
  zonedTime,
} from "../util/time";

// The YYYY-MM-DD days of a YYYY-MM month, and the grid column its first day is in.
function monthDays(month: string): { days: string[]; firstColumn: number } {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    days: Array.from(
      { length: count },
      (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
    ),
    // Weeks start on Monday.
    firstColumn: weekdayFromMonday(`${month}-01`) + 1,
  };
}

interface Props {
  dates: string[];
  timezone: string;
  onChange: (dates: string[]) => void;
  periodicAllowed: boolean;
}

export default function ScheduleDates({
  dates,
  timezone,
  onChange,
  periodicAllowed,
}: Props) {
  const now = new Date().toISOString();
  const today = zonedDate(now, timezone);
  const sorted = useMemo(() => sortDates(dates), [dates]);
  const picked = useMemo(
    () => new Set(sorted.map((d) => zonedDate(d, timezone))),
    [sorted, timezone],
  );

  // Grouped by day, a day can have several times. Each keeps its place in dates, so editing its
  // time doesn't replace its row.
  const days = useMemo(() => {
    const res: { day: string; times: { date: string; pos: number }[] }[] = [];
    const entries = dates
      .map((date, pos) => ({ date, pos }))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    for (const entry of entries) {
      const day = zonedDate(entry.date, timezone);
      const last = res.at(-1);
      if (last?.day === day) last.times.push(entry);
      else res.push({ day, times: [entry] });
    }
    return res;
  }, [dates, timezone]);

  const [month, setMonth] = useState(() =>
    zonedDate(sorted.find((d) => d >= now) ?? now, timezone).slice(0, 7),
  );

  function toggle(day: string) {
    if (picked.has(day)) {
      onChange(dates.filter((d) => zonedDate(d, timezone) !== day));
      return;
    }
    // A new date takes the time of the last one, the same time is the usual case.
    const last = sorted.at(-1);
    const [hour, minute] = last
      ? zonedTime(last, timezone).split(":").map(Number)
      : [12, 0];
    const date = dateOnDay(day, timezone, hour, minute);
    // Minutes before midnight the soonest time is tomorrow already, too late for this day.
    if (zonedDate(date, timezone) !== day) return;
    // Without premium a message goes out on one date, picking another one moves it.
    onChange(periodicAllowed ? [...dates, date] : [date]);
  }

  function setTime(pos: number, time: string) {
    const [hour, minute] = time.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;
    const moved = zonedDateTime(
      zonedDate(dates[pos], timezone),
      timezone,
      hour,
      minute,
    );
    onChange(dates.map((d, i) => (i === pos ? moved : d)));
  }

  // Another time on a day, an hour after its latest one and at most its last minute.
  function addTime(day: string, latest: string) {
    const [hour, minute] = zonedTime(latest, timezone).split(":").map(Number);
    const date =
      hour < 23
        ? zonedDateTime(day, timezone, hour + 1, minute)
        : zonedDateTime(day, timezone, 23, 59);
    if (!dates.includes(date)) onChange([...dates, date]);
  }

  const full = dates.length >= MaxRunTimes;
  const { days: monthDayList, firstColumn } = monthDays(month);

  return (
    <div className="grid sm:grid-cols-[16rem_1fr] gap-5">
      <div>
        <div className="flex items-center justify-between mb-2 text-sm text-mist-300">
          <button
            type="button"
            aria-label="Previous month"
            className="p-1 rounded hover:bg-ink-700"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="font-medium text-white">{formatMonth(month)}</span>
          <button
            type="button"
            aria-label="Next month"
            className="p-1 rounded hover:bg-ink-700"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-mist-500 mb-1">
          {weekdayOrder.map((d) => (
            <div key={d}>{weekdayName(d).slice(0, 2)}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDayList.map((day, i) => (
            <button
              key={day}
              type="button"
              aria-pressed={picked.has(day)}
              aria-label={day}
              disabled={day < today || (full && !picked.has(day))}
              onClick={() => toggle(day)}
              style={i === 0 ? { gridColumnStart: firstColumn } : undefined}
              className={clsx(
                "aspect-square rounded-md text-sm",
                picked.has(day)
                  ? "bg-azure-500 text-white"
                  : "text-mist-300 hover:bg-ink-700",
                day === today && !picked.has(day) && "ring-1 ring-mist-500",
                "disabled:text-ink-500 disabled:hover:bg-transparent",
              )}
            >
              {Number(day.slice(8))}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        {days.length === 0 ? (
          <div className="text-mist-400 text-sm font-light">
            Pick the days to send on in the calendar.
          </div>
        ) : (
          <ul className="space-y-3">
            {days.map(({ day, times }) => {
              const label = formatDay(times[0].date, timezone);
              return (
                <li key={day} className="flex items-start gap-2">
                  <span className="text-sm text-white w-28 flex-none pt-2">
                    {label}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {times.map(({ date, pos }) => {
                      const time = zonedTime(date, timezone);
                      return (
                        <span key={pos} className="flex items-center">
                          <input
                            type="time"
                            aria-label={`Time on ${label}`}
                            className={clsx(
                              "bg-ink-900 rounded-lg px-3 h-9",
                              // Past times stay listed, they were sent already.
                              date < now ? "text-mist-500" : "text-white",
                            )}
                            value={time}
                            onChange={(e) => setTime(pos, e.target.value)}
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${label} at ${time}`}
                            className="text-mist-500 hover:text-white p-1"
                            onClick={() =>
                              onChange(dates.filter((_, i) => i !== pos))
                            }
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </span>
                      );
                    })}
                    {periodicAllowed && !full && (
                      <button
                        type="button"
                        aria-label={`Add a time on ${label}`}
                        className="text-mist-500 hover:text-white p-1"
                        onClick={() =>
                          addTime(day, times[times.length - 1].date)
                        }
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!periodicAllowed && (
          <div className="text-mist-400 text-sm font-light mt-3">
            Sending on more than one date needs Premium.
          </div>
        )}
        {full && (
          <div className="text-mist-400 text-sm font-light mt-3">
            A scheduled message can be sent on up to {MaxRunTimes} dates.
          </div>
        )}
      </div>
    </div>
  );
}
