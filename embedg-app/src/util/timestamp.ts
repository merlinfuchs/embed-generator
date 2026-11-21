import { formatRelative } from "./relativeTime";

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

// What Discord shows for the style, in the viewer's own timezone and language. The preview is the
// same, using the browser's. dateStyle and timeStyle follow the locale, like "9:05 AM" in en-US
// and "09:05" in en-GB. Only the short date is spelled out, since dateStyle "short" has a 2-digit
// year in en-US.
export function formatTimestamp(
  unix: number,
  style: TimestampStyle,
  nowUnix: number,
): string {
  const date = new Date(unix * 1000);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, options).format(date);

  const shortDate = fmt({ day: "2-digit", month: "2-digit", year: "numeric" });

  switch (style) {
    case "d":
      return shortDate;
    case "D":
      return fmt({ dateStyle: "long" });
    case "t":
      return fmt({ timeStyle: "short" });
    case "T":
      return fmt({ timeStyle: "medium" });
    case "f":
      return fmt({ dateStyle: "long", timeStyle: "short" });
    case "F":
      return fmt({ dateStyle: "full", timeStyle: "short" });
    case "s":
      return `${shortDate}, ${fmt({ timeStyle: "short" })}`;
    case "S":
      return `${shortDate}, ${fmt({ timeStyle: "medium" })}`;
    case "R":
      return formatRelative(unix, nowUnix);
  }
}

export function isTimestampStyle(style: string): style is TimestampStyle {
  return timestampFormats.some(({ formats }) =>
    formats.some((format) => format.style === style),
  );
}
