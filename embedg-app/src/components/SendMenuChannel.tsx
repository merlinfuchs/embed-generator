import { useState } from "react";
import { useSendMessageToChannelMutation } from "../api/mutations";
import { useUserQuery } from "../api/queries";
import { useCurrentMessageStore } from "../state/message";
import { ChannelSelect } from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import LoginSuggest from "./LoginSuggest";
import { useValidationErrorStore } from "../state/validationError";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { useSendSettingsStore } from "../state/sendSettings";
import { shallow } from "zustand/shallow";
import { messageUrlRegex } from "../discord/util";
import MessageRestoreButton from "./MessageRestoreButton";
import { useToasts } from "../util/toasts";

export default function SendMenuChannel() {
  const validationError = useValidationErrorStore((state) =>
    state.checkIssueByPathPrefix("")
  );

  const [selectedGuildId, setSelectedGuildId] = useSendSettingsStore(
    (state) => [state.guildId, state.setGuildId],
    shallow
  );

  const [selectedChannnelId, setSelectedChannelId] = useSendSettingsStore(
    (state) => [state.channelId, state.setChannelId],
    shallow
  );

  const [messageId, setMessageId] = useSendSettingsStore(
    (state) => [state.messageId, state.setMessageId],
    shallow
  );

  const { data: user } = useUserQuery();

  const sendToChannelMutation = useSendMessageToChannelMutation();

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
    if (validationError) return;

    if (!selectedGuildId || !selectedChannnelId) {
      return;
    }

    sendToChannelMutation.mutate(
      {
        guild_id: selectedGuildId,
        channel_id: selectedChannnelId,
        message_id: messageId,
        data: useCurrentMessageStore.getState(),
        attachments: useCurrentAttachmentsStore.getState().attachments,
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            setMessageId(resp.data.message_id);
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

  return !!user?.success ? (
    <div className="space-y-5">
      <div className="flex">
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Server
          </div>
          <GuildSelect
            guildId={selectedGuildId}
            onChange={setSelectedGuildId}
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Channel
          </div>
          <ChannelSelect
            guildId={selectedGuildId}
            channelId={selectedChannnelId}
            onChange={setSelectedChannelId}
          />
        </div>
        <div className="flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Message ID or URL
          </div>
          <input
            type="text"
            className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
            value={messageId ?? ""}
            onChange={(e) => handleMessageId(e.target.value)}
          />
        </div>
      </div>
      <div>
        {validationError && (
          <div className="flex items-center text-red space-x-1">
            <ExclamationCircleIcon className="h-5 w-5 flex-none" />
            <div>
              There are errors in your message, you have to fix them before
              sending the message.
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-3 items-center">
        <MessageRestoreButton />
        <div
          className={`px-3 py-2 rounded text-white ${
            validationError || !selectedChannnelId
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
  ) : (
    <LoginSuggest />
  );
}
