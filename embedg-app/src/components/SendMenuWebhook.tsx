import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";
import { useSendMessageToWebhookMutation } from "../api/mutations";
import { useValidationErrorStore } from "../state/validationError";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { useSendSettingsStore } from "../state/sendSettings";
import { parseMessageId, parseWebhookUrl } from "../discord/util";
import MessageRestoreButton from "./MessageRestoreButton";
import { useToasts } from "../util/toasts";
import { getCurrentMessage } from "../state/currentMessage";

export default function SendMenuWebhook() {
  const validationError = useValidationErrorStore((state) =>
    state.hasAnyIssue(),
  );

  const [webhookUrl, setWebhookUrl] = useSendSettingsStore(
    useShallow((state) => [state.webhookUrl, state.setWebhookUrl]),
  );
  const webhookInfo = useMemo(() => {
    if (!webhookUrl) return null;
    return parseWebhookUrl(webhookUrl);
  }, [webhookUrl]);

  const [messageId, setMessageId] = useSendSettingsStore(
    useShallow((state) => [state.messageId, state.setMessageId]),
  );
  const [threadId, setThreadId] = useSendSettingsStore(
    useShallow((state) => [state.threadId, state.setThreadId]),
  );

  const sendToWebhookMutation = useSendMessageToWebhookMutation();

  function handleMessageId(val: string) {
    setMessageId(parseMessageId(val));
  }

  const createToast = useToasts((state) => state.create);

  // One predicate per button, used for both the styling and the disabled attribute. Only Discord
  // webhooks can edit a message they sent.
  const canSend =
    !validationError && !!webhookInfo && !sendToWebhookMutation.isPending;
  const canEdit = canSend && webhookInfo?.type === "discord";

  function send(edit: boolean) {
    if (edit ? !canEdit : !canSend) return;
    // Already covered by the predicate, repeated so webhookInfo narrows to non-null below.
    if (!webhookInfo) return;

    sendToWebhookMutation.mutate(
      {
        webhook_type: webhookInfo.type,
        webhook_id: webhookInfo.id,
        webhook_token: webhookInfo.token,
        message_id: edit ? messageId : null,
        thread_id: threadId,
        data: getCurrentMessage(),
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
      },
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex">
        <div className="flex-auto">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
            Webhook URL
          </div>
          <input
            type="url"
            className="bg-ink-900 px-3 py-2 rounded-lg w-full focus:outline-none text-white"
            onChange={(e) => setWebhookUrl(e.target.value || null)}
            value={webhookUrl || ""}
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <div className="flex-auto">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
            Thread ID
          </div>
          <input
            type="text"
            className="bg-ink-900 px-3 py-2 rounded-lg w-full focus:outline-none text-white"
            onChange={(e) => setThreadId(e.target.value || null)}
            value={threadId ?? ""}
          />
        </div>
        <div className="flex-auto">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
            Message ID or URL
          </div>
          <input
            type="text"
            className="bg-ink-900 px-3 py-2 rounded-lg w-full focus:outline-none text-white"
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
            <button
              type="button"
              className={`px-3 py-2 rounded-lg text-white flex items-center space-x-3 ${
                canEdit
                  ? "bg-azure-500 hover:bg-azure-400 cursor-pointer"
                  : "cursor-not-allowed bg-ink-900"
              }`}
              disabled={
                !!validationError ||
                !webhookInfo ||
                webhookInfo.type !== "discord"
              }
              onClick={() => send(true)}
            >
              {sendToWebhookMutation.isPending && (
                <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
              )}
              <div>Edit Message</div>
            </button>
          )}
          <button
            type="button"
            className={`px-3 py-2 rounded-lg text-white flex items-center space-x-3 ${
              canSend
                ? "bg-azure-500 hover:bg-azure-400 cursor-pointer"
                : "cursor-not-allowed bg-ink-900"
            }`}
            disabled={!!validationError || !webhookInfo}
            onClick={() => send(false)}
          >
            {sendToWebhookMutation.isPending && (
              <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
            )}
            <div>Send Message</div>
          </button>
        </div>
      </div>
    </div>
  );
}
