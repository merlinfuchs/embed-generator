import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { useSendSettingsStore } from "../state/sendSettings";
import { loadMessage, renderEditor } from "../test/editor";
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

test("a Guilded webhook can't take components", () => {
  useSendSettingsStore.setState({
    webhookUrl: "https://media.guilded.gg/webhooks/123/token",
  });
  loadMessage({
    content: "Hi",
    components: [row({ style: 5, url: "https://example.com" })],
  });
  renderEditor(<SendMenuWebhook />);

  expect(
    screen.getByText(/Guilded webhooks can't send components/),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send Message" })).toBeDisabled();
});
