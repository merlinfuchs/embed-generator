import cronstrue from "cronstrue";
import type {
  ScheduledMessageScheduleWire,
  ScheduledMessageWire,
} from "../api/wire";
import { timezoneOrUTC } from "./time";

export type RepeatUnit = "minutes" | "hours" | "days" | "weeks" | "months";

// A schedule the simple editor can show as a sentence: "every 2 weeks on Mon, Thu at 12:00".
// It becomes a cron expression plus an interval, the server counts the interval in units.
export interface Repeat {
  unit: RepeatUnit;
  every: number;
  hour: number;
  minute: number;
  // Cron weekdays, 0 is Sunday.
  weekdays: number[];
  monthDay: number;
}

// Weeks start on Monday, like the server counts them.
export const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

export const defaultRepeat: Repeat = {
  unit: "days",
  every: 1,
  hour: 12,
  minute: 0,
  weekdays: [1],
  monthDay: 1,
};

const weekdayNames: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

function number(field: string, max: number): number | null {
  if (!/^\d+$/.test(field)) return null;
  const n = Number(field);
  return n <= max ? n : null;
}

function weekday(field: string): number | null {
  const n = field in weekdayNames ? weekdayNames[field] : number(field, 7);
  return n === null ? null : n % 7;
}

function parseWeekdays(field: string): number[] | null {
  const days = new Set<number>();
  for (const part of field.split(",")) {
    const [from, to = from] = part.split("-").map(weekday);
    if (from === null || to === null || to < from) return null;
    for (let d = from; d <= to; d++) days.add(d);
  }
  return [...days].sort((a, b) => a - b);
}

/**
 * Reads a cron expression and interval back into a Repeat, null when it isn't one the sentence
 * can show. Understands what the old cron builder saved, like "30 12 1/1 * ?" for every day.
 */
export function parseRepeat(cron: string, interval: number): Repeat | null {
  const fields = cron.trim().toUpperCase().split(/\s+/);
  if (fields.length !== 5) return null;
  const [min, hour, dom, month, dow] = fields;

  // "0/1" and "1/1" step through every value from the first, the same as "*".
  const anyTime = (f: string) => f === "*" || f === "?" || f === "0/1";
  const anyDay = (f: string) => f === "*" || f === "?" || f === "1/1";
  // Weekdays count from 0, so "1/1" there skips Sunday.
  const anyWeekday = (f: string) => f === "*" || f === "?";
  if (!anyDay(month)) return null;

  const base = { ...defaultRepeat, every: Math.max(1, interval) };

  if (anyTime(min)) {
    return anyTime(hour) && anyDay(dom) && anyWeekday(dow)
      ? { ...base, unit: "minutes" }
      : null;
  }
  const minute = number(min, 59);
  if (minute === null) return null;

  if (anyTime(hour)) {
    return anyDay(dom) && anyWeekday(dow)
      ? { ...base, unit: "hours", minute }
      : null;
  }
  const h = number(hour, 23);
  if (h === null) return null;

  const at = { ...base, hour: h, minute };
  if (anyDay(dom) && anyWeekday(dow)) return { ...at, unit: "days" };
  if (anyDay(dom)) {
    const weekdays = parseWeekdays(dow);
    return weekdays ? { ...at, unit: "weeks", weekdays } : null;
  }
  const monthDay = number(dom, 31);
  if (anyWeekday(dow) && monthDay) return { ...at, unit: "months", monthDay };
  return null;
}

export function repeatToCron(r: Repeat): string {
  switch (r.unit) {
    case "minutes":
      return "* * * * *";
    case "hours":
      return `${r.minute} * * * *`;
    case "days":
      return `${r.minute} ${r.hour} * * *`;
    case "weeks":
      return `${r.minute} ${r.hour} * * ${[...r.weekdays].sort((a, b) => a - b).join(",")}`;
    case "months":
      return `${r.minute} ${r.hour} ${r.monthDay} * *`;
  }
}

function formatTimeOfDay(hour: number, minute: number): string {
  return new Date(Date.UTC(2000, 0, 1, hour, minute)).toLocaleTimeString(
    undefined,
    { hour: "numeric", minute: "2-digit", timeZone: "UTC" },
  );
}

// English like the sentences around it.
export function weekdayName(day: number): string {
  // Jan 1 2023 was a Sunday.
  return new Date(Date.UTC(2023, 0, 1 + day)).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

const unitNames: Record<RepeatUnit, [string, string]> = {
  minutes: ["minute", "minutes"],
  hours: ["hour", "hours"],
  days: ["day", "days"],
  weeks: ["week", "weeks"],
  months: ["month", "months"],
};

export function describeRepeat(r: Repeat): string {
  const [one, many] = unitNames[r.unit];
  let s = r.every === 1 ? `Every ${one}` : `Every ${r.every} ${many}`;

  if (r.unit === "weeks") {
    const days = weekdayOrder.filter((d) => r.weekdays.includes(d));
    s += ` on ${days.map(weekdayName).join(", ")}`;
  }
  if (r.unit === "months") s += ` on day ${r.monthDay}`;

  if (r.unit === "hours") s += ` at minute ${r.minute}`;
  else if (r.unit !== "minutes")
    s += ` at ${formatTimeOfDay(r.hour, r.minute)}`;
  return s;
}

export function describeSchedule(
  cron: string | null,
  interval: number,
): string {
  if (!cron) return "";
  const repeat = parseRepeat(cron, interval);
  if (repeat) return describeRepeat(repeat);

  let s: string;
  try {
    s = cronstrue.toString(cron, { verbose: true });
  } catch {
    s = cron;
  }
  // Only possible through the API, the editor has no interval for cron expressions.
  return interval > 1 ? `${s}, only every ${interval} periods` : s;
}

export type Ends = "never" | "date" | "count";

// What the schedule part of the scheduled message form edits.
export interface ScheduleDraft {
  // Sent on the dates, or repeating.
  onDates: boolean;
  dates: string[];
  timezone: string;
  // Where a repeating schedule starts.
  startAt: string | undefined;
  // Null when the cron expression is edited directly.
  repeat: Repeat | null;
  cron: string;
  interval: number;
  ends: Ends;
  endAt: string | undefined;
  endCount: number;
}

export function newScheduleDraft(timezone: string): ScheduleDraft {
  return {
    onDates: true,
    dates: [],
    timezone,
    startAt: undefined,
    repeat: defaultRepeat,
    cron: "",
    interval: 1,
    ends: "never",
    endAt: undefined,
    endCount: 10,
  };
}

export function isOnDates(msg: ScheduledMessageWire): boolean {
  return !!msg.run_times?.length;
}

export function scheduleDraftFromMessage(
  msg: ScheduledMessageWire,
): ScheduleDraft {
  const cron = msg.cron_expression ?? "";
  const onDates = isOnDates(msg);
  return {
    onDates,
    dates: msg.run_times ?? [],
    timezone: timezoneOrUTC(msg.cron_timezone),
    startAt: onDates ? undefined : msg.start_at,
    repeat: onDates ? defaultRepeat : parseRepeat(cron, msg.cron_interval),
    cron,
    interval: msg.cron_interval,
    ends: msg.end_at ? "date" : "never",
    endAt: msg.end_at ?? undefined,
    endCount: 10,
  };
}

export function sortDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => Date.parse(a) - Date.parse(b));
}

export function scheduleFromDraft(
  d: ScheduleDraft,
): ScheduledMessageScheduleWire {
  if (d.onDates) {
    const dates = sortDates(d.dates);
    return {
      run_times: dates,
      cron_expression: null,
      cron_timezone: d.timezone,
      cron_interval: 1,
      // Ignored, the server starts at the first date.
      start_at: dates[0] ?? new Date().toISOString(),
      end_at: null,
      end_after_runs: 0,
    };
  }

  return {
    run_times: [],
    cron_expression: d.repeat ? repeatToCron(d.repeat) : d.cron,
    cron_timezone: d.timezone,
    cron_interval: d.repeat?.every ?? d.interval,
    start_at: d.startAt ?? "",
    end_at: d.ends === "date" ? (d.endAt ?? null) : null,
    // The server works out when the last of them is.
    end_after_runs: d.ends === "count" ? d.endCount : 0,
  };
}
