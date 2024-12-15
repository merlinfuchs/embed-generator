import { useState } from "react";
import { useSendMessageToChannelMutation } from "../api/mutations";
import { useGuildChannelsQuery, useUserQuery } from "../api/queries";
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

  const [threadName, setThreadName] = useSendSettingsStore(
    (state) => [state.threadName, state.setThreadName],
    shallow
  );

  const { data: channels } = useGuildChannelsQuery(selectedGuildId);
  const { data: user } = useUserQuery();

  const selectedChannel = channels?.success
    ? channels.data.find((c) => c.id === selectedChannnelId)
    : null;

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

  function send(edit: boolean) {
    if (validationError) return;

    if (!selectedGuildId || !selectedChannnelId) {
      return;
    }

    if (edit && selectedChannel?.type === 15) {
      return;
    }

    sendToChannelMutation.mutate(
      {
        guild_id: selectedGuildId,
        channel_id: selectedChannnelId,
        thread_name: selectedChannel?.type === 15 ? threadName : null,
        message_id: edit ? messageId : null,
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
              message: "The message has been sent to the selected channel!",
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
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="flex-auto sm:w-1/2">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Channel
          </div>
          <ChannelSelect
            guildId={selectedGuildId}
            channelId={selectedChannnelId}
            onChange={setSelectedChannelId}
          />
        </div>

        {selectedChannel?.type === 15 ? (
          <div className="flex-auto sm:w-1/2">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Thread Name
              </div>
              <input
                type="text"
                maxLength={100}
                className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
                value={threadName ?? ""}
                onChange={(e) => setThreadName(e.target.value || null)}
              />
              <div className="mt-2 text-gray-400 text-sm font-light">
                When sending to a Forum Channel you have to set a name for the
                thread that is being created.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-auto sm:w-1/2">
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
        )}
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
      <div className="flex justify-end flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 items-end md:items-center">
        <MessageRestoreButton />
        <div className="flex items-center space-x-2">
          {messageId && (
            <div
              className={`px-3 py-2 rounded text-white flex items-center space-x-3 ${
                validationError ||
                !selectedChannnelId ||
                selectedChannel?.type === 15
                  ? "cursor-not-allowed bg-dark-2"
                  : "bg-blurple hover:bg-blurple-dark cursor-pointer"
              }`}
              role="button"
              onClick={() => send(true)}
            >
              {sendToChannelMutation.isLoading && (
                <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
              )}
              <div>Edit Message</div>
            </div>
          )}
          <div
            className={`px-3 py-2 rounded text-white flex items-center space-x-3 ${
              validationError ||
              !selectedChannnelId ||
              (selectedChannel?.type === 15 && !threadName)
                ? "cursor-not-allowed bg-dark-2"
                : "bg-blurple hover:bg-blurple-dark cursor-pointer"
            }`}
            role="button"
            onClick={() => send(false)}
          >
            {sendToChannelMutation.isLoading && (
              <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
            )}
            <div>Send Message</div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <LoginSuggest />
  );
}
