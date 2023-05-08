import { shallow } from "zustand/shallow";
import { useSendSettingsStore } from "../state/sendSettings";
import { useMemo } from "react";
import {
  useRestoreMessageFromChannelMutation,
  useRestoreMessageFromWebhookMutation,
} from "../api/mutations";
import { webhookUrlRegex } from "../discord/util";
import { MessageRestoreResponseDataWire } from "../api/wire";
import { parseMessageWithAction } from "../discord/schema";
import { useCurrentMessageStore } from "../state/message";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { getUniqueId } from "../util";
import { useToasts } from "../util/toasts";

export default function MessageRestoreButton() {
  const [mode, webhookUrl, messageId, threadId, guildId, channelId] =
    useSendSettingsStore(
      (state) => [
        state.mode,
        state.webhookUrl,
        state.messageId,
        state.threadId,
        state.guildId,
        state.channelId,
      ],
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

  const restoreFromWebhookMutation = useRestoreMessageFromWebhookMutation();
  const restoreFromChannelMutation = useRestoreMessageFromChannelMutation();

  const createToast = useToasts((state) => state.create);

  function restoreData(data: MessageRestoreResponseDataWire) {
    const parsedData = parseMessageWithAction(data.data);
    useCurrentMessageStore.getState().replace(parsedData);

    useCurrentAttachmentsStore.getState().replaceAttachments(
      data.attachments
        .filter((a) => !!a)
        .map((a) => ({
          id: getUniqueId(),
          ...a!,
        }))
    );
  }

  function restoreMessage() {
    if (mode === "channel") {
      if (!guildId || !channelId || !messageId) return;

      restoreFromChannelMutation.mutate(
        {
          guild_id: guildId,
          channel_id: channelId,
          message_id: messageId,
        },
        {
          onSuccess: (resp) => {
            if (resp.success) {
              restoreData(resp.data);
            } else {
              createToast({
                type: "error",
                title: "Failed to restore message",
                message: resp.error.message,
              });
            }
          },
        }
      );
    } else {
      if (!webhookId || !webhookToken || !messageId) return;

      restoreFromWebhookMutation.mutate(
        {
          webhook_id: webhookId,
          webhook_token: webhookToken,
          message_id: messageId,
          thread_id: threadId,
        },
        {
          onSuccess: (resp) => {
            if (resp.success) {
              restoreData(resp.data);
            } else {
              createToast({
                type: "error",
                title: "Failed to restore message",
                message: resp.error.message,
              });
            }
          },
        }
      );
    }
  }

  const canRestore =
    !!messageId &&
    (mode === "channel"
      ? !!guildId && !!channelId
      : !!webhookId && !!webhookToken);

  return (
    <div
      className={`px-3 py-2 rounded border-2 ${
        canRestore
          ? "border-dark-7 hover:bg-dark-6 cursor-pointer text-white"
          : "cursor-not-allowed text-gray-300 border-dark-6"
      }`}
      role="button"
      onClick={restoreMessage}
    >
      Restore Message
    </div>
  );
}
