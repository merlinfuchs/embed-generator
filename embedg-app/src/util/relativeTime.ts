const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

// "in 3 hours", "2 days ago", from Unix seconds. Like Discord it counts in whole units, rounded
// down.
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
