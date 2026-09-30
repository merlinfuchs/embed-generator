import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { COMPONENTS_V2_FLAG } from "../state/document";
import { useSendSettingsStore } from "../state/sendSettings";
import { loadMessage, renderEditor, targetFluxerWebhook } from "../test/editor";
import SendMenuWebhook from "./SendMenuWebhook";

const WEBHOOK_URL = "https://discord.com/api/webhooks/123/token";

function row(button: object) {
  return { type: 1, components: [{ type: 2, label: "Go", ...button }] };
}

test("a message with a button that has actions can't go to a webhook", () => {
  useSendSettingsStore.setState({ webhookUrl: WEBHOOK_URL });
  loadMessage({ content: "Hi", components: [row({ style: 1 })] });
  renderEditor(<SendMenuWebhook />);

  expect(
    screen.getByText(/Buttons with actions and select menus/),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled();
});

test("link buttons go to a webhook", () => {
  useSendSettingsStore.setState({ webhookUrl: WEBHOOK_URL });
  loadMessage({
    content: "Hi",
    components: [row({ style: 5, url: "https://example.com" })],
  });
  renderEditor(<SendMenuWebhook />);

  expect(
    screen.queryByText(/Buttons with actions and select menus/),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled();
});

test("a Fluxer webhook takes content and embeds, without a thread", () => {
  targetFluxerWebhook();
  loadMessage({ content: "Hi", embeds: [{ title: "Title" }] });
  renderEditor(<SendMenuWebhook />);

  expect(screen.queryByText("Thread ID")).toBeNull();
  expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled();
});

test("a message with components can't go to a Fluxer webhook", () => {
  targetFluxerWebhook();
  loadMessage({
    content: "Hi",
    components: [row({ style: 5, url: "https://example.com" })],
  });
  renderEditor(<SendMenuWebhook />);

  expect(screen.getByText(/Fluxer doesn't support components/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled();
});

test("a Components V2 message can't go to a Fluxer webhook", () => {
  targetFluxerWebhook();
  loadMessage({
    flags: COMPONENTS_V2_FLAG,
    components: [{ type: 10, content: "Hi" }],
  });
  renderEditor(<SendMenuWebhook />);

  expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled();
});
