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

// Throws a RangeError for zones the browser doesn't know.
function formatterFor(timezone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timezone, formatter);
  }
  return formatter;
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

/**
 * Converts an instant into a local Date showing the wall clock of the timezone.
 * The date picker only works in local time, so this is what it gets to display.
 */
export function toZonedDate(iso: string, timezone: string): Date {
  const wall = new Date(wallClockAt(new Date(iso).getTime(), timezone));
  return new Date(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
    wall.getUTCHours(),
    wall.getUTCMinutes(),
    wall.getUTCSeconds(),
  );
}

// Reverse of toZonedDate: reads the local wall clock of the date as a time in the timezone.
export function fromZonedDate(date: Date, timezone: string): string {
  const wall = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );
  return new Date(wallClockToInstant(wall, timezone)).toISOString();
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
