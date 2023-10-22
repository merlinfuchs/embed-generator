import { useEffect, useMemo, useState } from "react";
import GuildOrUserSelect from "../components/GuildOrUserSelect";
import { useSavedMessagesQuery, useUserQuery } from "../api/queries";
import EditorInput from "../components/EditorInput";
import clsx from "clsx";
import LoginSuggest from "../components/LoginSuggest";
import { useCreatedSavedMessageMutation } from "../api/mutations";
import { useCurrentMessageStore } from "../state/message";
import MessageExportImport from "../components/MessageExportImport";
import { useToasts } from "../util/toasts";
import {
  usePremiumGuildFeatures,
  usePremiumUserFeatures,
} from "../util/premium";
import { useSendSettingsStore } from "../state/sendSettings";
import SavedMessage from "../components/SavedMessage";

export default function MessagesView() {
  const selectedGuildId = useSendSettingsStore((s) => s.guildId);

  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    if (selectedGuildId) {
      setSource(selectedGuildId);
    }
  }, [selectedGuildId]);

  const { data: user } = useUserQuery();

  const guildId = useMemo(() => (source === "user" ? null : source), [source]);
  const messagesQuery = useSavedMessagesQuery(guildId);
  const messageCount = messagesQuery.data?.success
    ? messagesQuery.data.data.length
    : 0;

  const guildFeatures = usePremiumGuildFeatures(guildId);
  const userFeatures = usePremiumUserFeatures();
  const maxMessages =
    (source === "user"
      ? userFeatures?.max_saved_messages
      : guildFeatures?.max_saved_messages) || 0;

  const [newMessageName, setNewMessageName] = useState("");

  const createToast = useToasts((state) => state.create);

  const createMessageMutation = useCreatedSavedMessageMutation();

  function createMessage() {
    if (messageCount >= maxMessages) {
      createToast({
        title: "Failed to save message",
        message: `You have reached the maximum number of saved messages (${maxMessages})`,
        type: "error",
      });
      return;
    }

    if (!newMessageName) {
      return;
    }

    createMessageMutation.mutate(
      {
        guildId: guildId,
        req: {
          name: newMessageName,
          description: "",
          data: useCurrentMessageStore.getState(),
        },
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            messagesQuery.refetch();
            setNewMessageName("");
          } else {
            createToast({
              title: "Failed to save message",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 lg:my-20">
        <div className="mb-10">
          <div className="flex space-x-4 items-center mb-3">
            <div className="text-white text-2xl">Saved Messages</div>
            <div className="font-light italic text-gray-400">
              {messageCount} / {maxMessages}
            </div>
          </div>
          <div className="text-gray-400 font-light text-sm">
            You can save the message that you are currently working on in the
            editor to continue working on it later. Saved Messages are stored in
            the cloud and can be accessed from any device.
          </div>
        </div>
        {user?.success ? (
          <>
            <div className="mb-8">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Show Messages For
              </div>
              <div className="w-full max-w-md">
                <GuildOrUserSelect value={source} onChange={setSource} />
              </div>
            </div>
            {messagesQuery.isSuccess && messagesQuery.data.success && (
              <div className="space-y-5 mb-8">
                {messagesQuery.data.data.map((message) => (
                  <SavedMessage
                    message={message}
                    guildId={guildId}
                    key={message.id}
                  />
                ))}
                {messagesQuery.data.data.length === 0 && (
                  <div className="text-gray-400 font-light">
                    There are no saved messages yet. Enter a name below and
                    click on "Save Message"
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 items-end flex-none mb-5">
              <EditorInput
                label="New Message Name"
                maxLength={25}
                value={newMessageName}
                onChange={setNewMessageName}
                className="w-full"
              ></EditorInput>
              <button
                className={clsx(
                  "px-3 py-2 rounded text-white flex-none",
                  newMessageName
                    ? "bg-blurple hover:bg-blurple-dark"
                    : "bg-dark-2 cursor-not-allowed"
                )}
                onClick={createMessage}
              >
                Save Message
              </button>
            </div>
            <MessageExportImport
              guildId={guildId}
              messages={
                messagesQuery.data?.success ? messagesQuery.data.data : []
              }
            />
          </>
        ) : (
          <div className="pb-10">
            <LoginSuggest alwaysExpanded={true} />
          </div>
        )}
      </div>
    </div>
  );
}
