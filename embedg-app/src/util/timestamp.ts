export type TimestampStyle =
  | "d"
  | "D"
  | "t"
  | "T"
  | "f"
  | "F"
  | "s"
  | "S"
  | "R";

export interface TimestampFormat {
  style: TimestampStyle;
  name: string;
}

// In the order of Discord's own picker, grouped by what they show.
export const timestampFormats: { group: string; formats: TimestampFormat[] }[] =
  [
    {
      group: "Date",
      formats: [
        { style: "d", name: "Short date" },
        { style: "D", name: "Long date" },
      ],
    },
    {
      group: "Time",
      formats: [
        { style: "t", name: "Short time" },
        { style: "T", name: "Long time" },
      ],
    },
    {
      group: "Date and time",
      formats: [
        { style: "f", name: "Short date and time" },
        { style: "F", name: "Long date and time" },
        { style: "s", name: "Numeric date and time" },
        { style: "S", name: "Numeric date and time with seconds" },
      ],
    },
    {
      group: "Relative",
      formats: [{ style: "R", name: "Relative time" }],
    },
  ];

export function unixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function timestampMarkdown(
  unix: number,
  style?: TimestampStyle,
): string {
  return style ? `<t:${unix}:${style}>` : `<t:${unix}>`;
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

// "in 3 hours", "2 days ago". Like Discord it counts in whole units, rounded down.
export function formatRelative(unix: number, nowUnix: number): string {
  const diff = unix - nowUnix;
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, seconds] of relativeUnits) {
    if (abs >= seconds || unit === "second") {
      const value = Math.trunc(abs / seconds);
      return formatter.format(diff < 0 ? -value : value, unit);
    }
  }
  return "";
}

// What Discord shows for the style, in the viewer's own timezone and language. The preview is the
// same, using the browser's.
export function formatTimestamp(
  unix: number,
  style: TimestampStyle,
  nowUnix: number,
): string {
  const date = new Date(unix * 1000);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, options).format(date);

  const shortDate = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  } as const;
  const longDate = { day: "numeric", month: "long", year: "numeric" } as const;
  const shortTime = { hour: "2-digit", minute: "2-digit" } as const;
  const longTime = { ...shortTime, second: "2-digit" } as const;

  switch (style) {
    case "d":
      return fmt(shortDate);
    case "D":
      return fmt(longDate);
    case "t":
      return fmt(shortTime);
    case "T":
      return fmt(longTime);
    case "f":
      return fmt({ ...longDate, ...shortTime });
    case "F":
      return fmt({ ...longDate, weekday: "long", ...shortTime });
    case "s":
      return fmt({ ...shortDate, ...shortTime });
    case "S":
      return fmt({ ...shortDate, ...longTime });
    case "R":
      return formatRelative(unix, nowUnix);
  }
}
