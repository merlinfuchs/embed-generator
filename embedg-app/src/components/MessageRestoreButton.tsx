import { useShallow } from "zustand/react/shallow";
import { useSendSettingsStore, useWebhookTarget } from "../state/sendSettings";
import {
  useRestoreMessageFromChannelMutation,
  useRestoreMessageFromWebhookMutation,
} from "../api/mutations";
import type { MessageRestoreResponseDataWire } from "../api/wire";
import { parseMessageWithAction } from "../discord/importSchema";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { getUniqueId } from "../util";
import { useToasts } from "../util/toasts";
import { setCurrentMessage } from "../state/currentMessage";

export default function MessageRestoreButton() {
  const [mode, messageId, guildId, channelId] = useSendSettingsStore(
    useShallow((state) => [
      state.mode,
      state.messageId,
      state.guildId,
      state.channelId,
    ]),
  );
  const target = useWebhookTarget();

  const restoreFromWebhookMutation = useRestoreMessageFromWebhookMutation();
  const restoreFromChannelMutation = useRestoreMessageFromChannelMutation();

  const createToast = useToasts((state) => state.create);

  function restoreData(data: MessageRestoreResponseDataWire) {
    try {
      const parsedData = parseMessageWithAction(data.data);
      setCurrentMessage(parsedData);

      if (data.attachments) {
        useCurrentAttachmentsStore.getState().replaceAttachments(
          data.attachments
            .filter((a) => !!a)
            .map((a) => ({
              id: getUniqueId(),
              ...a!,
            })),
        );
      }
    } catch (e) {
      createToast({
        type: "error",
        title: "Failed to restore message",
        message: `${e}`,
      });
    }
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
        },
      );
    } else {
      if (!target || !messageId) return;

      restoreFromWebhookMutation.mutate(
        {
          webhook_platform: target.platform,
          webhook_id: target.id,
          webhook_token: target.token,
          message_id: messageId,
          thread_id: target.threadId,
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
        },
      );
    }
  }

  const canRestore =
    !!messageId && (mode === "channel" ? !!guildId && !!channelId : !!target);

  return (
    <button
      type="button"
      className={`px-3 py-2 rounded-lg border-2 ${
        canRestore
          ? "border-white/15 hover:bg-white/5 hover:border-white/30 cursor-pointer text-mist-100"
          : "cursor-not-allowed text-mist-500 border-white/10"
      }`}
      disabled={!canRestore}
      onClick={restoreMessage}
    >
      Restore Message
    </button>
  );
}
