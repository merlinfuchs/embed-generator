import { useShallow } from "zustand/react/shallow";
import { useSendMessageToWebhookMutation } from "../api/mutations";
import { useValidationErrorStore } from "../state/validationError";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { useSendSettingsStore, useWebhookTarget } from "../state/sendSettings";
import { parseMessageId } from "../discord/util";
import {
  FluxerComponentsNotice,
  FluxerPollNotice,
  InteractiveWebhookNotice,
} from "./WebhookNotice";
import MessageRestoreButton from "./MessageRestoreButton";
import MessageErrorNotice from "./MessageErrorNotice";
import PollAttachmentsNotice, {
  usePollWithAttachments,
} from "./PollAttachmentsNotice";
import { useToasts } from "../util/toasts";
import { getCurrentMessage } from "../state/currentMessage";
import {
  useHasComponents,
  useHasInteractiveComponents,
  usePoll,
} from "../state/document";

export default function SendMenuWebhook() {
  const validationError = useValidationErrorStore((state) =>
    state.hasAnyIssue(),
  );
  const interactive = useHasInteractiveComponents();
  const hasComponents = useHasComponents();
  const hasPoll = !!usePoll();
  const hasAttachments = useCurrentAttachmentsStore(
    (state) => state.attachments.length > 0,
  );
  const pollWithAttachments = usePollWithAttachments();

  const [webhookUrl, setWebhookUrl] = useSendSettingsStore(
    useShallow((state) => [state.webhookUrl, state.setWebhookUrl]),
  );
  const target = useWebhookTarget();
  const fluxer = target?.platform === "fluxer";

  const [messageId, setMessageId] = useSendSettingsStore(
    useShallow((state) => [state.messageId, state.setMessageId]),
  );
  const [threadId, setThreadId] = useSendSettingsStore(
    useShallow((state) => [state.threadId, state.setThreadId]),
  );

  const sendToWebhookMutation = useSendMessageToWebhookMutation();

  const createToast = useToasts((state) => state.create);

  // One predicate per button, used for both the styling and the disabled attribute. An edit
  // leaves the poll out, so only a new message can't have both a poll and files.
  const canEdit =
    !validationError &&
    !interactive &&
    !(fluxer && hasComponents) &&
    !(fluxer && hasPoll) &&
    !!target &&
    !sendToWebhookMutation.isPending;
  const canSend = canEdit && !pollWithAttachments;

  function send(edit: boolean) {
    if (edit ? !canEdit : !canSend) return;
    // Already covered by the predicate, repeated so target narrows to non-null below.
    if (!target) return;

    sendToWebhookMutation.mutate(
      {
        webhook_platform: target.platform,
        webhook_id: target.id,
        webhook_token: target.token,
        message_id: edit ? messageId : null,
        thread_id: target.threadId,
        data: getCurrentMessage(),
        // Fluxer's edits can't change the files.
        attachments:
          fluxer && edit
            ? []
            : useCurrentAttachmentsStore.getState().attachments,
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
        {!fluxer && (
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
        )}
        <div className="flex-auto">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
            Message ID or URL
          </div>
          <input
            type="text"
            className="bg-ink-900 px-3 py-2 rounded-lg w-full focus:outline-none text-white"
            onChange={(e) => setMessageId(parseMessageId(e.target.value))}
            value={messageId ?? ""}
          />
        </div>
      </div>
      {fluxer && hasComponents && <FluxerComponentsNotice />}
      {fluxer && hasPoll && <FluxerPollNotice />}
      {!fluxer && interactive && <InteractiveWebhookNotice />}
      {!fluxer && pollWithAttachments && <PollAttachmentsNotice />}
      {fluxer && messageId && hasAttachments && (
        <div className="text-mist-400 font-light text-sm">
          Editing a Fluxer message keeps the files it was sent with, as Fluxer
          can't change them.
        </div>
      )}
      <div>
        <MessageErrorNotice />
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
              disabled={!canEdit}
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
            disabled={!canSend}
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
