import { expect, test } from "vitest";
import { COMPONENTS_V2_FLAG } from "../discord/schema";
import { parseMessageWithAction } from "../discord/importSchema";
import { hasInteractiveComponents, messageSendIssue } from "./sendMessages";

const actionButton = { type: 2, style: 1, label: "Hi" };
const linkButton = { type: 2, style: 5, label: "Hi", url: "https://a.b" };

test("action buttons and select menus are interactive at any depth", () => {
  expect(
    hasInteractiveComponents([{ type: 1, components: [linkButton] }]),
  ).toBe(false);
  expect(
    hasInteractiveComponents([
      {
        type: 17,
        components: [{ type: 9, components: [], accessory: actionButton }],
      },
    ]),
  ).toBe(true);
});

test("webhooks can't send interactive components", () => {
  const message = parseMessageWithAction({
    content: "",
    components: [{ type: 1, components: [actionButton] }],
  });

  expect(
    messageSendIssue(message, [], { mode: "webhook", edit: false }),
  ).toMatch(/only the bot/);
  expect(
    messageSendIssue(message, [], { mode: "channel", edit: false }),
  ).toBeNull();
});

test("Fluxer can't send Components V2", () => {
  const message = parseMessageWithAction({
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 10, content: "Hi" }],
  });

  expect(
    messageSendIssue(message, [], {
      mode: "webhook",
      fluxer: true,
      edit: false,
    }),
  ).toMatch(/Fluxer/);
});

test("invalid messages aren't sent", () => {
  const message = parseMessageWithAction({ content: "x".repeat(2001) });

  expect(
    messageSendIssue(message, [], { mode: "channel", edit: false }),
  ).toMatch(/errors/);
});
