// Discord counts the time of an ID from the first second of 2015.
export const DISCORD_EPOCH = 1420070400000n;

const MAX_SNOWFLAKE = (1n << 64n) - 1n;

export interface SnowflakeParts {
  // Milliseconds since 1970, like Date.now().
  timestamp: number;
  worker: number;
  process: number;
  increment: number;
}

/**
 * The ID in what was pasted. Besides plain IDs it takes mentions like <@123> and Discord links,
 * where the last ID is the most specific one (the message of a message link).
 */
export function parseSnowflake(input: string): bigint | undefined {
  const text = input.trim();
  let digits: string | undefined;
  if (/^\d+$/.test(text)) {
    digits = text;
  } else {
    digits = text.match(/\d{17,20}/g)?.at(-1);
  }
  if (!digits) return undefined;

  const id = BigInt(digits);
  return id <= MAX_SNOWFLAKE ? id : undefined;
}

export function decodeSnowflake(id: bigint): SnowflakeParts {
  return {
    timestamp: Number((id >> 22n) + DISCORD_EPOCH),
    worker: Number((id & 0x3e0000n) >> 17n),
    process: Number((id & 0x1f000n) >> 12n),
    increment: Number(id & 0xfffn),
  };
}

/**
 * The first ID of the millisecond, so every ID made at that time is greater or equal. Undefined
 * for times before Discord's epoch and after the last one an ID can hold.
 */
export function snowflakeFromTime(ms: number): bigint | undefined {
  if (!Number.isFinite(ms)) return undefined;
  const since = BigInt(Math.trunc(ms)) - DISCORD_EPOCH;
  if (since < 0n || since >= 1n << 42n) return undefined;
  return since << 22n;
}

// The 64 bits grouped by what they hold: time, worker, process, increment.
export function snowflakeBits(id: bigint): string[] {
  const bits = id.toString(2).padStart(64, "0");
  return [
    bits.slice(0, 42),
    bits.slice(42, 47),
    bits.slice(47, 52),
    bits.slice(52),
  ];
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

// "3 years ago" or "in 2 days", in whole units rounded down.
export function formatAge(ms: number, nowMs: number): string {
  const diff = Math.trunc((ms - nowMs) / 1000);
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
