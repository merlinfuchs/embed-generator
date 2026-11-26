import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  addTab,
  resetMessageTabs,
  useMessageTabsStore,
} from "../state/messageTabs";
import { useSendSettingsStore } from "../state/sendSettings";
import { editorUser, loadMessage, renderEditor } from "../test/editor";
import EditorMessageTabs from "./EditorMessageTabs";
import SendMenuWebhook from "./SendMenuWebhook";

const WEBHOOK_URL = "https://discord.com/api/webhooks/123/token";

afterEach(() => {
  vi.unstubAllGlobals();
  resetMessageTabs();
  useSendSettingsStore.setState({ webhookUrl: null, messageId: null });
});

function twoMessages() {
  resetMessageTabs();
  loadMessage({ content: "First" });
  addTab();
  loadMessage({ content: "Second" });
}

test("the tabs only show with more than one message", () => {
  resetMessageTabs();
  const { unmount } = renderEditor(<EditorMessageTabs />);
  expect(screen.queryByRole("tablist")).toBeNull();
  unmount();

  twoMessages();
  renderEditor(<EditorMessageTabs />);
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getByRole("tab", { name: "Message 2" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("the ticked messages are sent in order and remember their ids", async () => {
  twoMessages();
  useSendSettingsStore.setState({ webhookUrl: WEBHOOK_URL });

  const sent: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      sent.push(body.data.content);
      return new Response(
        JSON.stringify({
          success: true,
          data: { message_id: `${sent.length}00`, channel_id: "9" },
        }),
      );
    }),
  );

  renderEditor(<SendMenuWebhook />);
  await editorUser().click(
    screen.getByRole("button", { name: "Send 2 Messages" }),
  );

  await waitFor(() => expect(sent).toEqual(["First", "Second"]));
  await waitFor(() =>
    expect(useSendSettingsStore.getState().messageId).toBe("200"),
  );
  expect(useMessageTabsStore.getState().tabs[0].messageId).toBe("100");
  expect(
    await screen.findByRole("button", { name: "Edit 2 Messages" }),
  ).toBeEnabled();
});

test("unticking a message leaves it out", async () => {
  twoMessages();
  useSendSettingsStore.setState({ webhookUrl: WEBHOOK_URL });
  renderEditor(<SendMenuWebhook />);

  await editorUser().click(screen.getByRole("checkbox", { name: "Message 1" }));

  expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled();
});
