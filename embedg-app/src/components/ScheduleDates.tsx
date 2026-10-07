import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { MaxRunTimes } from "../api/wire";
import { sortDates, weekdayName, weekdayOrder } from "../util/schedule";
import { formatDay, zonedDate, zonedDateTime, zonedTime } from "../util/time";

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
    firstColumn: ((new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7) + 1,
  };
}

function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

function formatMonth(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
    let date = zonedDateTime(day, timezone, hour, minute);
    // Today the time may be over already, the next five minutes are the soonest it can go out.
    if (date < now) {
      date = new Date(Math.ceil(Date.now() / 300_000) * 300_000).toISOString();
    }
    // Without premium a message goes out on one date, picking another one moves it.
    onChange(periodicAllowed ? [...dates, date] : [date]);
  }

  function setTime(date: string, time: string) {
    const [hour, minute] = time.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;
    const moved = zonedDateTime(
      zonedDate(date, timezone),
      timezone,
      hour,
      minute,
    );
    onChange(dates.map((d) => (d === date ? moved : d)));
  }

  const full = dates.length >= MaxRunTimes;
  const { days, firstColumn } = monthDays(month);

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
          {days.map((day, i) => (
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
        {sorted.length === 0 ? (
          <div className="text-mist-400 text-sm font-light">
            Pick the days to send on in the calendar.
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((date) => {
              const past = date < now;
              const label = formatDay(date, timezone);
              return (
                // Not the date itself, changing its time would replace the row and drop the focus.
                <li
                  key={zonedDate(date, timezone)}
                  className="flex items-center gap-2"
                >
                  <span
                    className={clsx(
                      "flex-auto text-sm",
                      past ? "text-mist-500" : "text-white",
                    )}
                  >
                    {label}
                    {past && " (past)"}
                  </span>
                  <input
                    type="time"
                    aria-label={`Time on ${label}`}
                    className="bg-ink-900 rounded-lg px-3 h-9 text-white"
                    value={zonedTime(date, timezone)}
                    onChange={(e) => setTime(date, e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    className="text-mist-500 hover:text-white p-1"
                    onClick={() => onChange(dates.filter((d) => d !== date))}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
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
