let timezones: string[] | undefined;

export function listTimezones(): string[] {
  if (!timezones) {
    // Missing in browsers before Safari 15.4, they only get UTC and their own zone.
    const supported =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : [getCurrentTimezone()];
    timezones = ["UTC", ...supported.filter((tz) => tz !== "UTC")];
  }
  return timezones;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

// Building a formatter is slow, a list of dates formats many. Throws a RangeError for zones the
// browser doesn't know.
function cachedFormatter(
  kind: string,
  locale: string | undefined,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${kind}:${timezone}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: timezone,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

function formatterFor(timezone: string): Intl.DateTimeFormat {
  return cachedFormatter("parts", "en-US", timezone, {
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

// Formatting with a zone the browser doesn't know throws, e.g. "Etc/Unknown" that some browsers report.
export function timezoneOrUTC(timezone: string | null | undefined): string {
  if (!timezone) return "UTC";
  try {
    formatterFor(timezone);
    return timezone;
  } catch {
    return "UTC";
  }
}

export function getCurrentTimezone(): string {
  return timezoneOrUTC(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

// The wall clock of the instant in the timezone, as milliseconds of a UTC date with the same fields.
function wallClockAt(ms: number, timezone: string): number {
  const parts = formatterFor(timezone).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  return Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
}

function offsetAt(ms: number, timezone: string): number {
  return wallClockAt(ms, timezone) - Math.floor(ms / 1000) * 1000;
}

// Moves the instant so that it keeps its wall clock when switching timezones.
// Stays off local Dates, which would shift wall clocks inside the browser's own DST gap.
export function rezone(iso: string, from: string, to: string): string {
  const wall = wallClockAt(new Date(iso).getTime(), from);
  return new Date(wallClockToInstant(wall, to)).toISOString();
}

function wallClockToInstant(wall: number, timezone: string): number {
  // The offset at the guess can differ from the one at the result around DST changes.
  const guess = wall - offsetAt(wall, timezone);
  const res = wall - offsetAt(guess, timezone);
  // A wall clock skipped by a DST change moves forward, like local Dates do.
  return wallClockAt(res, timezone) === wall ? res : Math.max(guess, res);
}

// The calendar date of the instant in the timezone, as YYYY-MM-DD for date inputs.
export function zonedDate(iso: string, timezone: string): string {
  return new Date(wallClockAt(new Date(iso).getTime(), timezone))
    .toISOString()
    .slice(0, 10);
}

// The instant the timezone's wall clock shows the given time on a YYYY-MM-DD date.
export function zonedDateTime(
  date: string,
  timezone: string,
  hours: number,
  minutes: number,
  seconds = 0,
): string {
  const [y, m, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, hours, minutes, seconds);
  return new Date(wallClockToInstant(wall, timezone)).toISOString();
}

// The wall clock of the instant in the timezone, as HH:MM for time inputs.
export function zonedTime(iso: string, timezone: string): string {
  return new Date(wallClockAt(new Date(iso).getTime(), timezone))
    .toISOString()
    .slice(11, 16);
}

// "Sat, Oct 31, 5:50 AM" in the timezone.
export function formatRun(iso: string, timezone: string): string {
  return cachedFormatter("run", undefined, timezone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// "Sat, Oct 31" in the timezone.
export function formatDay(iso: string, timezone: string): string {
  return cachedFormatter("day", undefined, timezone, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

// "5:50 AM" in the timezone.
export function formatTime(iso: string, timezone: string): string {
  return cachedFormatter("time", undefined, timezone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Calendar days and months as YYYY-MM-DD and YYYY-MM, independent of any timezone.

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

// The day of the week of a YYYY-MM-DD day, counted from Monday.
export function weekdayFromMonday(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function formatMonth(month: string): string {
  return cachedFormatter("month", undefined, "UTC", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}
