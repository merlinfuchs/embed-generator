let timezones: string[] | undefined;

export function listTimezones(): string[] {
  timezones ??= [
    "UTC",
    ...Intl.supportedValuesOf("timeZone").filter((tz) => tz !== "UTC"),
  ];
  return timezones;
}

// Some browsers report zones like "Etc/Unknown" that the server can't load.
export function getCurrentTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return listTimezones().includes(tz) ? tz : "UTC";
}

const formatters = new Map<string, Intl.DateTimeFormat>();

// The wall clock of the instant in the timezone, as milliseconds of a UTC date with the same fields.
function wallClockAt(ms: number, timezone: string): number {
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

  const parts = formatter.formatToParts(ms);
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

  // The offset at the guess can differ from the one at the result around DST changes.
  let res = wall - offsetAt(wall, timezone);
  res = wall - offsetAt(res, timezone);
  return new Date(res).toISOString();
}

// Moves the instant so that it keeps its wall clock when switching timezones.
export function rezone(iso: string, from: string, to: string): string {
  return fromZonedDate(toZonedDate(iso, from), to);
}
