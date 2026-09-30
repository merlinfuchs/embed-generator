import { expect, test } from "vitest";
import { parseWebhookUrl } from "./util";

test("a Discord webhook URL is a Discord webhook", () => {
  expect(
    parseWebhookUrl("https://discord.com/api/webhooks/123/abc_DEF-1"),
  ).toEqual({ platform: "discord", id: "123", token: "abc_DEF-1" });
});

test("a Fluxer webhook URL is a Fluxer webhook, with or without the version", () => {
  const webhook = { platform: "fluxer", id: "123", token: "abcDEF1" };

  expect(
    parseWebhookUrl("https://api.fluxer.app/webhooks/123/abcDEF1"),
  ).toEqual(webhook);
  expect(
    parseWebhookUrl("https://api.fluxer.app/v1/webhooks/123/abcDEF1"),
  ).toEqual(webhook);
  expect(
    parseWebhookUrl("https://web.fluxer.app/api/v1/webhooks/123/abcDEF1"),
  ).toEqual(webhook);
});

test("webhook URLs from other hosts aren't webhooks", () => {
  expect(
    parseWebhookUrl("https://fluxer.example.com/api/webhooks/123/abc"),
  ).toBeNull();
  expect(parseWebhookUrl("https://media.guilded.gg/webhooks/1/abc")).toBeNull();
});
