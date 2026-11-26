import { beforeEach, expect, test } from "vitest";
import { parseMessageWithAction } from "../discord/importSchema";
import { useCurrentAttachmentsStore } from "./attachments";
import { getCurrentMessage, setCurrentMessage } from "./currentMessage";
import { messageDocumentStore } from "./document";
import {
  MAX_MESSAGE_TABS,
  activateTab,
  addTab,
  duplicateActiveTab,
  moveTab,
  removeTab,
  resetMessageTabs,
  selectSendTabs,
  tabMessage,
  toggleTabSend,
  useMessageTabsStore,
} from "./messageTabs";
import { useSendSettingsStore } from "./sendSettings";

const attachment = {
  id: 1,
  name: "a.png",
  description: null,
  data_url: "data:image/png;base64,",
  size: 1,
};

beforeEach(() => {
  resetMessageTabs();
  setCurrentMessage(parseMessageWithAction({ content: "first" }));
  useCurrentAttachmentsStore.getState().clearAttachments();
  useSendSettingsStore.setState({ messageId: null });
});

function tabIds() {
  return useMessageTabsStore.getState().tabs.map((tab) => tab.id);
}

test("a new tab opens empty and the first keeps its message", () => {
  const id = addTab();

  expect(useMessageTabsStore.getState().activeId).toBe(id);
  expect(getCurrentMessage().content).toBe("");

  activateTab(1);
  expect(getCurrentMessage().content).toBe("first");
});

test("switching swaps the attachments and the message id", () => {
  useCurrentAttachmentsStore.getState().addAttachment(attachment);
  useSendSettingsStore.getState().setMessageId("111");

  const id = addTab()!;
  expect(useCurrentAttachmentsStore.getState().attachments).toEqual([]);
  expect(useSendSettingsStore.getState().messageId).toBeNull();

  useSendSettingsStore.getState().setMessageId("222");
  activateTab(1);
  expect(useCurrentAttachmentsStore.getState().attachments).toEqual([
    attachment,
  ]);
  expect(useSendSettingsStore.getState().messageId).toBe("111");

  activateTab(id);
  expect(useSendSettingsStore.getState().messageId).toBe("222");
});

test("switching doesn't leave the other message on the undo stack", () => {
  addTab();

  expect(messageDocumentStore.temporal.getState().pastStates).toEqual([]);
});

test("a duplicate copies the message but not the sent message id", () => {
  useSendSettingsStore.getState().setMessageId("111");
  duplicateActiveTab();

  expect(getCurrentMessage().content).toBe("first");
  expect(useSendSettingsStore.getState().messageId).toBeNull();
});

test("new tabs go after the open one and are sent", () => {
  const second = addTab()!;
  activateTab(1);
  const third = addTab()!;

  expect(tabIds()).toEqual([1, third, second]);
  expect(useMessageTabsStore.getState().sendIds).toEqual([1, third, second]);
});

test("the send selection follows the tab order", () => {
  const second = addTab()!;
  toggleTabSend(1);
  expect(
    selectSendTabs(useMessageTabsStore.getState()).map((t) => t.id),
  ).toEqual([second]);

  toggleTabSend(1);
  moveTab(second, -1);
  expect(useMessageTabsStore.getState().sendIds).toEqual([second, 1]);
});

test("with one tab, it's sent even when unticked", () => {
  toggleTabSend(1);

  expect(selectSendTabs(useMessageTabsStore.getState())).toHaveLength(1);
});

test("removing the open tab opens its neighbour", () => {
  const second = addTab()!;
  setCurrentMessage(parseMessageWithAction({ content: "second" }));
  activateTab(1);
  activateTab(second);

  removeTab(second);
  expect(tabIds()).toEqual([1]);
  expect(getCurrentMessage().content).toBe("first");
});

test("the last tab can't be removed", () => {
  removeTab(1);

  expect(tabIds()).toEqual([1]);
});

test("tabs stop at the limit", () => {
  for (let i = 1; i < MAX_MESSAGE_TABS; i++) addTab();

  expect(addTab()).toBeNull();
  expect(tabIds()).toHaveLength(MAX_MESSAGE_TABS);
});

test("the other tabs' messages are read from the store", () => {
  addTab(parseMessageWithAction({ content: "second" }));
  const first = useMessageTabsStore.getState().tabs[0];

  expect(tabMessage(first).content).toBe("first");
});
