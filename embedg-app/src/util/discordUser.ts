// Discord counts the time of an ID from the first second of 2015.
const DISCORD_EPOCH = 1420070400000n;

/** When the ID was made, which for a user is when the account was created. */
export function snowflakeDate(id: string): Date {
  return new Date(Number((BigInt(id) >> 22n) + DISCORD_EPOCH));
}

/**
 * The user ID in what was pasted: an ID, a mention like <@123>, or a link that holds one. The last
 * ID wins, it's the most specific one.
 */
export function parseUserId(input: string): string | undefined {
  const text = input.trim();
  if (/^\d{17,20}$/.test(text)) return text;
  return text.match(/\d{17,20}/g)?.at(-1);
}

export interface UserBadge {
  flag: number;
  name: string;
}

// The public flags Discord documents, in the order Discord lists them.
export const userBadges: UserBadge[] = [
  { flag: 1 << 0, name: "Discord Staff" },
  { flag: 1 << 1, name: "Partnered Server Owner" },
  { flag: 1 << 2, name: "HypeSquad Events" },
  { flag: 1 << 3, name: "Bug Hunter" },
  { flag: 1 << 6, name: "HypeSquad Bravery" },
  { flag: 1 << 7, name: "HypeSquad Brilliance" },
  { flag: 1 << 8, name: "HypeSquad Balance" },
  { flag: 1 << 9, name: "Early Supporter" },
  { flag: 1 << 10, name: "Team User" },
  { flag: 1 << 14, name: "Bug Hunter Gold" },
  { flag: 1 << 16, name: "Verified Bot" },
  { flag: 1 << 17, name: "Early Verified Bot Developer" },
  { flag: 1 << 18, name: "Moderator Programs Alumni" },
  { flag: 1 << 19, name: "Bot Uses HTTP Interactions" },
  { flag: 1 << 22, name: "Active Developer" },
];

export function userBadgeNames(publicFlags: number): string[] {
  return userBadges.filter((b) => publicFlags & b.flag).map((b) => b.name);
}

/** An accent color as #RRGGBB. */
export function accentColorHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

/** "3 years ago", in whole units rounded down. */
export function formatAge(date: Date, now: Date = new Date()): string {
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 3600],
    ["month", 30 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  const diff = Math.trunc((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (abs >= seconds || unit === "second") {
      const value = Math.trunc(abs / seconds);
      return formatter.format(diff < 0 ? -value : value, unit);
    }
  }
  return "";
}
