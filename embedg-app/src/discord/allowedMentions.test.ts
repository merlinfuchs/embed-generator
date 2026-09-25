import { expect, test } from "vitest";
import {
  isDefaultAllowedMentions,
  type MentionType,
  mentionPings,
  setMentionPings,
} from "./allowedMentions";

test("without allowed_mentions every mention pings", () => {
  expect(mentionPings(undefined, "everyone")).toBe(true);
});

test("turning a type off keeps the others pinging", () => {
  const next = setMentionPings(undefined, "everyone", false);

  expect(next).toEqual({
    parse: ["users", "roles"],
    users: [],
    roles: [],
    replied_user: false,
  });
  expect(mentionPings(next, "everyone")).toBe(false);
  expect(mentionPings(next, "users")).toBe(true);
});

test("turning every type back on goes back to Discord's default", () => {
  const off = setMentionPings(undefined, "roles", false);

  expect(setMentionPings(off, "roles", true)).toBeUndefined();
});

test("a type with specific ids counts as pinging, and toggling it either way clears them", () => {
  const imported = {
    parse: ["users"] as MentionType[],
    users: [],
    roles: ["1"],
    replied_user: false,
  };

  expect(mentionPings(imported, "roles")).toBe(true);
  for (const pings of [true, false]) {
    expect(setMentionPings(imported, "roles", pings)?.roles ?? []).toEqual([]);
  }
  expect(mentionPings(setMentionPings(imported, "roles", false), "roles")).toBe(
    false,
  );
});

test("an explicit setting that matches Discord's default counts as default", () => {
  expect(
    isDefaultAllowedMentions({
      parse: ["users", "roles", "everyone"],
      users: [],
      roles: [],
      replied_user: true,
    }),
  ).toBe(true);
});
