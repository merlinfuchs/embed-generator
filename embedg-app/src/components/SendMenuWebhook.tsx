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
import PollAttachmentsNotice from "./PollAttachmentsNotice";
import SendMenuMessages, {
  sendLabel,
  useSendTabs,
  useSendTabsQueue,
} from "./SendMenuMessages";
import {
  useHasComponents,
  useHasInteractiveComponents,
  usePoll,
  usePollWithAttachments,
} from "../state/document";

export default function SendMenuWebhook() {
  const sendTabs = useSendTabs();
  // The checks on the open message only matter while it's one of those sent.
  const activeIncluded = sendTabs.activeIncluded;
  const validationError =
    useValidationErrorStore((state) => state.hasAnyIssue()) && activeIncluded;
  const interactive = useHasInteractiveComponents() && activeIncluded;
  const hasComponents = useHasComponents() && activeIncluded;
  const hasPoll = !!usePoll() && activeIncluded;
  const hasAttachments = useCurrentAttachmentsStore(
    (state) => state.attachments.length > 0,
  );
  const pollWithAttachments = usePollWithAttachments() && activeIncluded;

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
  const { send: sendQueue, sending } = useSendTabsQueue();

  // One predicate per button, used for both the styling and the disabled attribute. An edit
  // leaves the poll out, so only a new message can't have both a poll and files.
  const ready =
    !validationError &&
    !interactive &&
    !(fluxer && hasComponents) &&
    !(fluxer && hasPoll) &&
    !!target &&
    sendTabs.count > 0 &&
    !sending;
  const canSend = ready && !pollWithAttachments;
  // Each message is edited in place, so every one of them needs its message ID.
  const canEdit = ready && sendTabs.allSent;

  function send(edit: boolean) {
    if (edit ? !canEdit : !canSend) return;
    // Already covered by the predicate, repeated so target narrows to non-null below.
    if (!target) return;

    const webhook = target;

    sendQueue({
      edit,
      check: { mode: "webhook", fluxer },
      sendOne: (item) =>
        sendToWebhookMutation.mutateAsync({
          webhook_platform: webhook.platform,
          webhook_id: webhook.id,
          webhook_token: webhook.token,
          message_id: item.messageId,
          thread_id: webhook.threadId,
          data: item.message,
          // Fluxer's edits can't change the files.
          attachments: fluxer && edit ? [] : item.attachments,
        }),
      successTitle: "Message has been sent",
      successMessage: "The message has been sent to the given webhook!",
    });
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
      <SendMenuMessages />
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
          {(sendTabs.multiple ? sendTabs.allSent : !!messageId) && (
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
              {sending && (
                <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
              )}
              <div>{sendLabel("Edit", sendTabs.count)}</div>
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
            {sending && (
              <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
            )}
            <div>{sendLabel("Send", sendTabs.count)}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
