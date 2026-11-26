import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultMessage } from "../discord/defaultMessage";
import { parseMessageWithAction } from "../discord/importSchema";
import type { Message } from "../discord/schema";
import {
  type MessageAttachment,
  useCurrentAttachmentsStore,
} from "./attachments";
import { getCurrentMessage, setCurrentMessage } from "./currentMessage";
import { messageDocumentStore } from "./document";
import { useSendSettingsStore } from "./sendSettings";
import { localStorageJSON } from "./storage";

/** How many messages the editor holds at once. */
export const MAX_MESSAGE_TABS = 10;

export interface MessageTab {
  id: number;
  /**
   * Null for the active tab: its message is the one in the document store, and
   * only goes in here when another tab is opened.
   */
  message: Message | null;
  /** The sent message this one edits. The active tab's is the send menu's. */
  messageId: string | null;
  /** Kept in memory only, like the active message's attachments. */
  attachments: MessageAttachment[];
}

export interface MessageTabsStore {
  tabs: MessageTab[];
  activeId: number;
  /** The tabs the send menu sends, kept in tab order. */
  sendIds: number[];
}

const initialTabs = (): MessageTabsStore => ({
  tabs: [{ id: 1, message: null, messageId: null, attachments: [] }],
  activeId: 1,
  sendIds: [1],
});

export const useMessageTabsStore = create<MessageTabsStore>()(
  persist(initialTabs, {
    name: "message-tabs",
    version: 0,
    storage: localStorageJSON,
    // Files can be large data URLs, and the active message doesn't keep its own either.
    partialize: (state) => ({
      ...state,
      tabs: state.tabs.map((tab) => ({ ...tab, attachments: [] })),
    }),
    // Whatever was stored has to leave exactly one active tab without a message.
    merge: (persisted, current) => {
      const stored = persisted as Partial<MessageTabsStore> | undefined;
      const tabs = (stored?.tabs ?? []).map((tab) => ({
        ...tab,
        attachments: [],
      }));
      const active = tabs.find((tab) => tab.id === stored?.activeId);
      if (!active) return current;

      active.message = null;
      return {
        ...current,
        tabs,
        activeId: active.id,
        sendIds: (stored?.sendIds ?? []).filter((id) =>
          tabs.some((tab) => tab.id === id),
        ),
      };
    },
  }),
);

function nextTabId(tabs: MessageTab[]): number {
  return Math.max(0, ...tabs.map((tab) => tab.id)) + 1;
}

function inTabOrder(tabs: MessageTab[], ids: number[]): number[] {
  return tabs.filter((tab) => ids.includes(tab.id)).map((tab) => tab.id);
}

/** Loads a message without leaving it on the undo stack of the message before. */
function loadIntoEditor(message: Message) {
  const history = messageDocumentStore.temporal.getState();
  history.pause();
  setCurrentMessage(message);
  history.clear();
  messageDocumentStore.temporal.getState().resume();
}

/** The message of a tab, from the editor for the active one. */
export function tabMessage(tab: MessageTab): Message {
  const { activeId } = useMessageTabsStore.getState();
  if (tab.id === activeId) return getCurrentMessage();

  return parseMessageWithAction(tab.message ?? defaultMessage);
}

export function tabAttachments(tab: MessageTab): MessageAttachment[] {
  const { activeId } = useMessageTabsStore.getState();
  return tab.id === activeId
    ? useCurrentAttachmentsStore.getState().attachments
    : tab.attachments;
}

export function tabMessageId(tab: MessageTab): string | null {
  const { activeId } = useMessageTabsStore.getState();
  return tab.id === activeId
    ? useSendSettingsStore.getState().messageId
    : tab.messageId;
}

export function setTabMessageId(id: number, messageId: string | null) {
  const { activeId } = useMessageTabsStore.getState();
  if (id === activeId) {
    useSendSettingsStore.getState().setMessageId(messageId);
    return;
  }

  useMessageTabsStore.setState((state) => ({
    tabs: state.tabs.map((tab) =>
      tab.id === id ? { ...tab, messageId } : tab,
    ),
  }));
}

/** The active tab with what the editor and send menu hold for it put in. */
function storeActive(tabs: MessageTab[], activeId: number): MessageTab[] {
  return tabs.map((tab) =>
    tab.id === activeId
      ? {
          ...tab,
          message: getCurrentMessage(),
          messageId: useSendSettingsStore.getState().messageId,
          attachments: useCurrentAttachmentsStore.getState().attachments,
        }
      : tab,
  );
}

/**
 * Opens a tab in the editor. Its message is parsed before anything is swapped,
 * so a broken stored message leaves the editor on the tab it was on.
 */
export function activateTab(id: number) {
  const { tabs, activeId } = useMessageTabsStore.getState();
  const target = tabs.find((tab) => tab.id === id);
  if (!target || id === activeId) return;

  const message = parseMessageWithAction(target.message ?? defaultMessage);
  const stored = storeActive(tabs, activeId);

  loadIntoEditor(message);
  useCurrentAttachmentsStore.getState().replaceAttachments(target.attachments);
  useSendSettingsStore.getState().setMessageId(target.messageId);

  useMessageTabsStore.setState({
    tabs: stored.map((tab) =>
      tab.id === id ? { ...tab, message: null, attachments: [] } : tab,
    ),
    activeId: id,
  });
}

/**
 * Adds a tab after the active one and opens it. It's sent along with the
 * others until it's unticked in the send menu.
 */
export function addTab(
  message: Message = defaultMessage,
  attachments: MessageAttachment[] = [],
): number | null {
  const { tabs, activeId, sendIds } = useMessageTabsStore.getState();
  if (tabs.length >= MAX_MESSAGE_TABS) return null;

  const id = nextTabId(tabs);
  const index = tabs.findIndex((tab) => tab.id === activeId);
  const newTabs = [...tabs];
  newTabs.splice(index + 1, 0, { id, message, messageId: null, attachments });

  useMessageTabsStore.setState({
    tabs: newTabs,
    sendIds: inTabOrder(newTabs, [...sendIds, id]),
  });
  activateTab(id);
  return id;
}

/** A copy of the active message, files included, that hasn't been sent yet. */
export function duplicateActiveTab(): number | null {
  return addTab(
    getCurrentMessage(),
    useCurrentAttachmentsStore.getState().attachments,
  );
}

/** Removes a tab, opening its neighbour first when it's the active one. */
export function removeTab(id: number) {
  const { tabs, activeId } = useMessageTabsStore.getState();
  if (tabs.length <= 1) return;

  const index = tabs.findIndex((tab) => tab.id === id);
  if (index === -1) return;

  if (id === activeId) {
    const neighbour = tabs[index + 1] ?? tabs[index - 1];
    activateTab(neighbour.id);
  }

  useMessageTabsStore.setState((state) => ({
    tabs: state.tabs.filter((tab) => tab.id !== id),
    sendIds: state.sendIds.filter((sendId) => sendId !== id),
  }));
}

export function moveTab(id: number, direction: -1 | 1) {
  useMessageTabsStore.setState((state) => {
    const index = state.tabs.findIndex((tab) => tab.id === id);
    const to = index + direction;
    if (index === -1 || to < 0 || to >= state.tabs.length) return state;

    const tabs = [...state.tabs];
    [tabs[index], tabs[to]] = [tabs[to], tabs[index]];
    return { tabs, sendIds: inTabOrder(tabs, state.sendIds) };
  });
}

export function toggleTabSend(id: number) {
  useMessageTabsStore.setState((state) => ({
    sendIds: state.sendIds.includes(id)
      ? state.sendIds.filter((sendId) => sendId !== id)
      : inTabOrder(state.tabs, [...state.sendIds, id]),
  }));
}

/**
 * What the send menu sends: the ticked tabs in order, or just the message in
 * the editor while there is only one.
 */
export function selectSendTabs(state: MessageTabsStore): MessageTab[] {
  if (state.tabs.length <= 1) {
    return state.tabs.filter((tab) => tab.id === state.activeId);
  }
  return state.tabs.filter((tab) => state.sendIds.includes(tab.id));
}

/** The 1-based position of a tab, which is what the editor calls it by. */
export function tabNumber(state: MessageTabsStore, id: number): number {
  return state.tabs.findIndex((tab) => tab.id === id) + 1;
}

/** Back to a single tab holding the message in the editor. Used by tests. */
export function resetMessageTabs() {
  useMessageTabsStore.setState(initialTabs());
}
