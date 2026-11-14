import { expect, test } from "vitest";
import {
  accentColorHex,
  formatAge,
  parseUserId,
  snowflakeDate,
  userBadgeNames,
} from "./discordUser";

test("an ID tells when the account was created", () => {
  // The example ID from Discord's documentation.
  expect(snowflakeDate("175928847299117063").toISOString()).toBe(
    "2016-04-30T11:18:25.796Z",
  );
});

test("the ID is found in what was pasted", () => {
  const id = "175928847299117063";
  expect(parseUserId(` ${id} `)).toBe(id);
  expect(parseUserId(`<@${id}>`)).toBe(id);
  expect(parseUserId(`<@!${id}>`)).toBe(id);
  expect(
    parseUserId(
      `https://discord.com/channels/81384788765712384/81384788765712385/${id}`,
    ),
  ).toBe(id);
  expect(parseUserId("")).toBeUndefined();
  expect(parseUserId("someone")).toBeUndefined();
  expect(parseUserId("12345")).toBeUndefined();
});

test("flags turn into badge names", () => {
  expect(userBadgeNames(0)).toEqual([]);
  expect(userBadgeNames((1 << 0) | (1 << 6) | (1 << 22))).toEqual([
    "Discord Staff",
    "HypeSquad Bravery",
    "Active Developer",
  ]);
  // Flags without a badge are ignored.
  expect(userBadgeNames(1 << 4)).toEqual([]);
});

test("accent colors are padded hex", () => {
  expect(accentColorHex(0x5865f2)).toBe("#5865f2");
  expect(accentColorHex(255)).toBe("#0000ff");
});

test("ages count in whole units", () => {
  const now = new Date("2026-11-10T00:00:00Z");
  expect(formatAge(new Date("2023-11-09T00:00:00Z"), now)).toBe("3 years ago");
  expect(formatAge(new Date("2026-11-08T00:00:00Z"), now)).toBe("2 days ago");
});
