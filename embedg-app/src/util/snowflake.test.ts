import { expect, test } from "vitest";
import {
  decodeSnowflake,
  formatAge,
  parseSnowflake,
  snowflakeBits,
  snowflakeFromTime,
} from "./snowflake";

// The example from Discord's documentation.
const docsId = 175928847299117063n;

test("an ID decodes into its time, worker, process and increment", () => {
  expect(decodeSnowflake(docsId)).toEqual({
    timestamp: 1462015105796,
    worker: 1,
    process: 0,
    increment: 7,
  });
  expect(new Date(1462015105796).toISOString()).toBe(
    "2016-04-30T11:18:25.796Z",
  );
});

test("IDs are found in plain numbers, mentions and links", () => {
  expect(parseSnowflake(" 175928847299117063 ")).toBe(docsId);
  expect(parseSnowflake("<@175928847299117063>")).toBe(docsId);
  expect(parseSnowflake("<@&175928847299117063>")).toBe(docsId);
  expect(
    parseSnowflake(
      "https://discord.com/channels/81384788765712384/81384788765712385/175928847299117063",
    ),
  ).toBe(docsId);
});

test("text without a valid ID is rejected", () => {
  expect(parseSnowflake("")).toBeUndefined();
  expect(parseSnowflake("hello")).toBeUndefined();
  expect(parseSnowflake("<@abc>")).toBeUndefined();
  // Larger than 64 bits
  expect(parseSnowflake("18446744073709551616")).toBeUndefined();
});

test("a time becomes the first ID of its millisecond", () => {
  const id = snowflakeFromTime(1462015105796);
  expect(id).toBe(175928847298985984n);
  if (id === undefined) throw new Error("no ID");
  expect(decodeSnowflake(id).timestamp).toBe(1462015105796);
  expect(decodeSnowflake(id).increment).toBe(0);
});

test("times Discord can't have IDs for are rejected", () => {
  expect(snowflakeFromTime(1420070399999)).toBeUndefined();
  expect(snowflakeFromTime(Number.NaN)).toBeUndefined();
  expect(snowflakeFromTime(1420070400000 + 2 ** 42)).toBeUndefined();
  expect(snowflakeFromTime(1420070400000)).toBe(0n);
});

test("the bits are grouped as 42, 5, 5 and 12", () => {
  const groups = snowflakeBits(docsId);
  expect(groups.map((g) => g.length)).toEqual([42, 5, 5, 12]);
  expect(groups.join("")).toBe(docsId.toString(2).padStart(64, "0"));
  expect(Number.parseInt(groups[3], 2)).toBe(7);
});

test("ages count in whole units in both directions", () => {
  const now = 1_000_000_000_000;
  expect(formatAge(now - 2 * 86400_000 - 5000, now)).toBe("2 days ago");
  expect(formatAge(now + 3 * 3600_000 + 59_000, now)).toBe("in 3 hours");
});
