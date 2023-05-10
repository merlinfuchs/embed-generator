import { useMemo, useState } from "react";
import {
  useSendMessageToChannelMutation,
  useSendMessageToWebhookMutation,
} from "../api/mutations";
import { useCurrentMessageStore } from "../state/message";
import { useValidationErrorStore } from "../state/validationError";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { useSendSettingsStore } from "../state/sendSettings";
import { shallow } from "zustand/shallow";
import { messageUrlRegex, webhookUrlRegex } from "../discord/util";
import MessageRestoreButton from "./MessageRestoreButton";
import { useToasts } from "../util/toasts";

export default function SendMenuWebhook() {
  const validationError = useValidationErrorStore((state) =>
    state.checkIssueByPathPrefix("")
  );

  const [webhookUrl, setWebhookUrl] = useSendSettingsStore(
    (state) => [state.webhookUrl, state.setWebhookUrl],
    shallow
  );
  const [webhookId, webhookToken] = useMemo(() => {
    if (!webhookUrl) return [null, null];
    const match = webhookUrl.match(webhookUrlRegex);
    if (match) {
      return [match[2], match[3]];
    }
    return [null, null];
  }, [webhookUrl]);

  const [messageId, setMessageId] = useSendSettingsStore(
    (state) => [state.messageId, state.setMessageId],
    shallow
  );
  const [threadId, setThreadId] = useSendSettingsStore(
    (state) => [state.threadId, state.setThreadId],
    shallow
  );

  const sendToWebhookMutation = useSendMessageToWebhookMutation();

  function handleMessageId(val: string) {
    if (!val) {
      setMessageId(null);
      return;
    }

    const match = val.match(messageUrlRegex);
    if (match) {
      setMessageId(match[2]);
    } else {
      setMessageId(val);
    }
  }

  const createToast = useToasts((state) => state.create);

  function send() {
    if (validationError || !webhookId || !webhookToken) return;

    sendToWebhookMutation.mutate(
      {
        webhook_id: webhookId,
        webhook_token: webhookToken,
        message_id: messageId,
        thread_id: threadId,
        data: useCurrentMessageStore.getState(),
        attachments: useCurrentAttachmentsStore.getState().attachments,
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            setMessageId(resp.data.message_id);
            createToast({
              type: "success",
              title: "Message has been sent",
              message: "The message has been sent to the given webhook!",
            });
          } else {
            createToast({
              type: "error",
              title: "Failed to send message",
              message: resp.error.message,
            });
          }
        },
      }
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex">
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Webhook URL
          </div>
          <input
            type="url"
            className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
            onChange={(e) => setWebhookUrl(e.target.value || null)}
            value={webhookUrl || ""}
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Thread ID
          </div>
          <input
            type="text"
            className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
            onChange={(e) => setThreadId(e.target.value)}
            value={threadId ?? ""}
          />
        </div>
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Message ID or URL
          </div>
          <input
            type="text"
            className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
            onChange={(e) => handleMessageId(e.target.value)}
            value={messageId ?? ""}
          />
        </div>
      </div>
      <div className="text-gray-400">
        Interactive components are only available when selecting a server and
        channel instead of sending to a webhook.
      </div>
      <div>
        {validationError && (
          <div className="flex items-center text-red space-x-1">
            <ExclamationCircleIcon className="h-5 w-5" />
            <div>
              There are errors in your message, you have to fix them before
              sending the message.
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2 items-center">
        <MessageRestoreButton />
        <div
          className={`px-3 py-2 rounded text-white ${
            validationError || !webhookId || !webhookToken
              ? "cursor-not-allowed bg-dark-2"
              : "bg-blurple hover:bg-blurple-dark cursor-pointer"
          }`}
          role="button"
          onClick={send}
        >
          {messageId ? "Edit" : "Send"} Message
        </div>
      </div>
    </div>
  );
}
