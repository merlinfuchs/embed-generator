import { useShallow } from "zustand/react/shallow";
import { useSendMessageToChannelMutation } from "../api/mutations";
import { useGuildChannelsQuery, useUserQuery } from "../api/queries";
import { ChannelSelect } from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import LoginSuggest from "./LoginSuggest";
import { useValidationErrorStore } from "../state/validationError";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { useSendSettingsStore } from "../state/sendSettings";
import { parseMessageId } from "../discord/util";
import MessageRestoreButton from "./MessageRestoreButton";
import { useToasts } from "../util/toasts";
import { getCurrentMessage } from "../state/currentMessage";

export default function SendMenuChannel() {
  const validationError = useValidationErrorStore((state) =>
    state.hasAnyIssue(),
  );

  const [selectedGuildId, setSelectedGuildId] = useSendSettingsStore(
    useShallow((state) => [state.guildId, state.setGuildId]),
  );

  const [selectedChannnelId, setSelectedChannelId] = useSendSettingsStore(
    useShallow((state) => [state.channelId, state.setChannelId]),
  );

  const [messageId, setMessageId] = useSendSettingsStore(
    useShallow((state) => [state.messageId, state.setMessageId]),
  );

  const [threadName, setThreadName] = useSendSettingsStore(
    useShallow((state) => [state.threadName, state.setThreadName]),
  );

  const { data: channels } = useGuildChannelsQuery(selectedGuildId);
  const { data: user } = useUserQuery();

  const selectedChannel = channels?.success
    ? channels.data.find((c) => c.id === selectedChannnelId)
    : null;

  const sendToChannelMutation = useSendMessageToChannelMutation();

  function handleMessageId(val: string) {
    setMessageId(parseMessageId(val));
  }

  const createToast = useToasts((state) => state.create);

  // One predicate per button, used for both the styling and the disabled attribute. A forum
  // channel needs a thread name, and can't have an existing message edited in it.
  const ready =
    !validationError &&
    !!selectedGuildId &&
    !!selectedChannnelId &&
    !sendToChannelMutation.isPending;
  const canSend = ready && !(selectedChannel?.type === 15 && !threadName);
  const canEdit = ready && selectedChannel?.type !== 15;

  function send(edit: boolean) {
    if (edit ? !canEdit : !canSend) return;
    // Already covered by the predicate, repeated so the ids narrow to non-null below.
    if (!selectedGuildId || !selectedChannnelId) return;

    sendToChannelMutation.mutate(
      {
        guild_id: selectedGuildId,
        channel_id: selectedChannnelId,
        thread_name: selectedChannel?.type === 15 ? threadName : null,
        message_id: edit ? messageId : null,
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
      },
    );
  }

  return user?.success ? (
    <div className="space-y-5">
      <div className="flex">
        <div className="flex-auto">
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
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
          <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
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
              <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
                Thread Name
              </div>
              <input
                type="text"
                maxLength={100}
                className="bg-ink-900 px-3 py-2 rounded-lg w-full focus:outline-none text-white"
                value={threadName ?? ""}
                onChange={(e) => setThreadName(e.target.value || null)}
              />
              <div className="mt-2 text-mist-400 text-sm font-light">
                When sending to a Forum Channel you have to set a name for the
                thread that is being created.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-auto sm:w-1/2">
            <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
              Message ID or URL
            </div>
            <input
              type="text"
              className="bg-ink-900 px-3 py-2 rounded-lg w-full focus:outline-none text-white"
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
            <button
              type="button"
              className={`px-3 py-2 rounded-lg text-white flex items-center space-x-3 ${
                canEdit
                  ? "bg-azure-500 hover:bg-azure-400 cursor-pointer"
                  : "cursor-not-allowed bg-ink-900"
              }`}
              disabled={
                !!validationError ||
                !selectedChannnelId ||
                selectedChannel?.type === 15
              }
              onClick={() => send(true)}
            >
              {sendToChannelMutation.isPending && (
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
            disabled={
              !!validationError ||
              !selectedChannnelId ||
              (selectedChannel?.type === 15 && !threadName)
            }
            onClick={() => send(false)}
          >
            {sendToChannelMutation.isPending && (
              <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
            )}
            <div>Send Message</div>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <LoginSuggest />
  );
}
