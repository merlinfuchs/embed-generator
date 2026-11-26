import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { MessageSendResponseWire } from "../api/wire";
import type { Message } from "../discord/schema";
import type { MessageAttachment } from "../state/attachments";
import {
  type MessageTab,
  activateTab,
  selectSendTabs,
  setTabMessageId,
  tabAttachments,
  tabMessage,
  tabMessageId,
  tabNumber,
  toggleTabSend,
  useMessageTabsStore,
} from "../state/messageTabs";
import { useSendSettingsStore } from "../state/sendSettings";
import { type SendCheck, messageSendIssue } from "../util/sendMessages";
import { useToasts } from "../util/toasts";

/** What the send menu needs to know about the messages it's about to send. */
export function useSendTabs() {
  const activeMessageId = useSendSettingsStore((state) => state.messageId);

  return useMessageTabsStore(
    useShallow((state) => {
      const tabs = selectSendTabs(state);
      return {
        count: tabs.length,
        multiple: state.tabs.length > 1,
        // The editor's checks only cover the message that is open.
        activeIncluded: tabs.some((tab) => tab.id === state.activeId),
        allSent:
          tabs.length > 0 &&
          tabs.every((tab) =>
            tab.id === state.activeId ? !!activeMessageId : !!tab.messageId,
          ),
      };
    }),
  );
}

/** The label of the send and edit buttons. */
export function sendLabel(verb: "Send" | "Edit", count: number) {
  return count > 1 ? `${verb} ${count} Messages` : `${verb} Message`;
}

export interface SendItem {
  tab: MessageTab;
  number: number;
  message: Message;
  attachments: MessageAttachment[];
  messageId: string | null;
}

interface SendOptions {
  edit: boolean;
  check: Omit<SendCheck, "edit">;
  /** Sends one message. Later calls see what the earlier ones returned. */
  sendOne: (item: SendItem) => Promise<MessageSendResponseWire>;
  successTitle: string;
  successMessage: string;
}

/**
 * Sends the ticked messages one after the other, in tab order, and keeps the
 * id of each sent message on its tab so it can be edited later. Stops at the
 * first message that fails, and opens it when it's one the editor can fix.
 */
export function useSendTabsQueue() {
  const [sending, setSending] = useState(false);
  const createToast = useToasts((state) => state.create);

  async function send({
    edit,
    check,
    sendOne,
    successTitle,
    successMessage,
  }: SendOptions) {
    const state = useMessageTabsStore.getState();
    const tabs = selectSendTabs(state);
    const multiple = state.tabs.length > 1;
    if (tabs.length === 0) return;

    const items: SendItem[] = [];
    for (const tab of tabs) {
      const number = tabNumber(state, tab.id);
      let item: SendItem;
      try {
        item = {
          tab,
          number,
          message: tabMessage(tab),
          attachments: tabAttachments(tab),
          messageId: edit ? tabMessageId(tab) : null,
        };
      } catch (e) {
        createToast({
          type: "error",
          title: `Message ${number} can't be read`,
          message: `${e}`,
        });
        return;
      }

      // The open message is already checked by the menu itself.
      const issue =
        tab.id === state.activeId
          ? null
          : messageSendIssue(item.message, item.attachments, {
              ...check,
              edit,
            });
      if (issue) {
        createToast({
          type: "error",
          title: `Message ${number} can't be sent`,
          message: `Message ${number} ${issue}.`,
        });
        activateTab(tab.id);
        return;
      }

      items.push(item);
    }

    setSending(true);
    try {
      for (const item of items) {
        const title = multiple
          ? `Failed to send Message ${item.number}`
          : "Failed to send message";

        let resp: MessageSendResponseWire;
        try {
          resp = await sendOne(item);
        } catch (e) {
          createToast({ type: "error", title, message: `${e}` });
          return;
        }

        if (!resp.success) {
          createToast({ type: "error", title, message: resp.error.message });
          return;
        }

        setTabMessageId(item.tab.id, resp.data.message_id);
      }

      createToast({
        type: "success",
        title:
          items.length > 1 ? `${items.length} messages sent` : successTitle,
        message:
          items.length > 1
            ? `All ${items.length} messages have been sent, in order.`
            : successMessage,
      });
    } finally {
      setSending(false);
    }
  }

  return { send, sending };
}

/** Ticks which of the editor's messages are sent. Only there with more than one. */
export default function SendMenuMessages() {
  const [tabs, sendIds] = useMessageTabsStore(
    useShallow((state) => [state.tabs, state.sendIds]),
  );

  if (tabs.length <= 1) return null;

  return (
    <div>
      <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
        Messages to send
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id }, i) => {
          const checked = sendIds.includes(id);
          return (
            <button
              key={id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors",
                checked
                  ? "border-azure-500 bg-azure-500/15 text-mist-100"
                  : "border-white/10 bg-ink-900 text-mist-400 hover:text-mist-100",
              )}
              onClick={() => toggleTabSend(id)}
            >
              <span
                className={clsx(
                  "h-4 w-4 rounded flex items-center justify-center",
                  checked ? "bg-azure-500" : "bg-ink-700",
                )}
              >
                {checked && <CheckIcon className="h-3.5 w-3.5 text-white" />}
              </span>
              Message {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-mist-400 text-sm font-light">
        The ticked messages are sent one after the other, in this order. The
        Message ID above belongs to the message open in the editor.
      </div>
    </div>
  );
}
