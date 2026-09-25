import { expect, test } from "vitest";
import {
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

test("a type with specific ids counts as pinging, and toggling it clears them", () => {
  const imported = {
    parse: [] as MentionType[],
    users: [],
    roles: ["1"],
    replied_user: false,
  };

  expect(mentionPings(imported, "roles")).toBe(true);
  expect(setMentionPings(imported, "roles", true)?.roles).toEqual([]);
});

test("unchecking a type that pings only specific ids stops those too", () => {
  const imported = {
    parse: ["users"] as MentionType[],
    users: [],
    roles: ["1"],
    replied_user: false,
  };

  const next = setMentionPings(imported, "roles", false);

  expect(next?.roles).toEqual([]);
  expect(mentionPings(next, "roles")).toBe(false);
});
