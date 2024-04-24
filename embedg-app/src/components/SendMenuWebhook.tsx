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
import { messageUrlRegex, parseWebhookUrl } from "../discord/util";
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
  const webhookInfo = useMemo(() => {
    if (!webhookUrl) return null;
    return parseWebhookUrl(webhookUrl);
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

  function send(edit: boolean) {
    if (validationError || !webhookInfo) return;

    sendToWebhookMutation.mutate(
      {
        webhook_type: webhookInfo.type,
        webhook_id: webhookInfo.id,
        webhook_token: webhookInfo.token,
        message_id: edit ? messageId : null,
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
            onChange={(e) => setThreadId(e.target.value || null)}
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
      <div className="text-orange-300 font-light">
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
      <div className="flex justify-end flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 items-end md:items-center">
        <MessageRestoreButton />
        <div className="flex items-center space-x-2">
          {messageId && (
            <div
              className={`px-3 py-2 rounded text-white flex items-center space-x-3 ${
                validationError || !webhookInfo || webhookInfo.type != "discord"
                  ? "cursor-not-allowed bg-dark-2"
                  : "bg-blurple hover:bg-blurple-dark cursor-pointer"
              }`}
              role="button"
              onClick={() => send(true)}
            >
              {sendToWebhookMutation.isLoading && (
                <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
              )}
              <div>Edit Message</div>
            </div>
          )}
          <div
            className={`px-3 py-2 rounded text-white flex items-center space-x-3 ${
              validationError || !webhookInfo
                ? "cursor-not-allowed bg-dark-2"
                : "bg-blurple hover:bg-blurple-dark cursor-pointer"
            }`}
            role="button"
            onClick={() => send(false)}
          >
            {sendToWebhookMutation.isLoading && (
              <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
            )}
            <div>Send Message</div>
          </div>
        </div>
      </div>
    </div>
  );
}
