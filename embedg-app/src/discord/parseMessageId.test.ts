import { expect, test } from "vitest";
import { parseMessageId } from "./util";

test("a message id is taken as it is", () => {
  expect(parseMessageId(" 123 ")).toBe("123");
});

test("a message link gives its message id", () => {
  expect(parseMessageId("https://ptb.discord.com/channels/1/2/3")).toBe("3");
});

test("nothing typed is no message", () => {
  expect(parseMessageId("  ")).toBeNull();
});
