import { useMemo, useState } from "react";
import EditorModal from "../../components/EditorModal";
import GuildOrUserSelect from "../../components/GuildOrUserSelect";
import { useSavedMessagesQuery, useUserQuery } from "../../api/queries";
import EditorInput from "../../components/EditorInput";
import clsx from "clsx";
import LoginSuggest from "../../components/LoginSuggest";
import {
  useCreatedSavedMessageMutation,
  useDeleteSavedMessageMutation,
  useUpdateSavedMessageMutation,
} from "../../api/mutations";
import { useCurrentMessageStore } from "../../state/message";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { SavedMessageWire } from "../../api/wire";
import { parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import MessageExportImport from "../../components/MessageExportImport";
import { useToasts } from "../../util/toasts";
import { parseMessageWithAction } from "../../discord/restoreSchema";
import { usePremiumStatus } from "../../util/premium";
import Tooltip from "../../components/Tooltip";

function formatUpdatedAt(updatedAt: string): string {
  return parseISO(updatedAt).toLocaleString();
}

export default function MessagesView() {
  const [source, setSource] = useState<string | null>(null);

  const { data: user } = useUserQuery();

  const guildId = useMemo(() => (source === "user" ? null : source), [source]);
  const messagesQuery = useSavedMessagesQuery(guildId);
  const messageCount = messagesQuery.data?.success
    ? messagesQuery.data.data.length
    : 0;

  const maxMessages = usePremiumStatus(guildId).benefits.maxSavedMessages;

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

  const updateMessageMutation = useUpdateSavedMessageMutation();

  function updateMessage(message: SavedMessageWire) {
    updateMessageMutation.mutate(
      {
        messageId: message.id,
        guildId: guildId,
        req: {
          name: message.name,
          description: message.description,
          data: useCurrentMessageStore.getState(),
        },
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            messagesQuery.refetch();
          } else {
            createToast({
              title: "Failed to update message",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  const navigate = useNavigate();

  function restoreMessage(message: SavedMessageWire) {
    try {
      const data = parseMessageWithAction(message.data);
      useCurrentMessageStore.setState(data);
      navigate("/app");
    } catch (e) {
      createToast({
        title: "Failed to restore message",
        message: `${e}`,
        type: "error",
      });
    }
  }

  const deleteMessageMutation = useDeleteSavedMessageMutation();

  function deleteMessage(message: SavedMessageWire) {
    deleteMessageMutation.mutate(
      {
        messageId: message.id,
        guildId: guildId,
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            messagesQuery.refetch();
          } else {
            createToast({
              title: "Failed to delete message",
              message: resp.error.message,
              type: "error",
            });
          }
        },
      }
    );
  }

  return (
    <EditorModal width="md">
      <div className="p-4 space-y-5 flex flex-col h-full overflow-hidden">
        <div className="flex space-x-2 items-center">
          <div className="text-white text-lg">Saved Messages</div>
          <div className="font-light italic text-gray-400">
            {messageCount} / {maxMessages}
          </div>
        </div>
        {user?.success ? (
          <>
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Show Messages For
              </div>
              <div className="w-full max-w-md">
                <GuildOrUserSelect value={source} onChange={setSource} />
              </div>
            </div>
            {messagesQuery.isSuccess && messagesQuery.data.success && (
              <div className="space-y-3 flex-auto overflow-y-auto">
                {messagesQuery.data.data.map((message) => (
                  <div
                    key={message.id}
                    className="bg-dark-2 p-3 rounded flex justify-between truncate space-x-3"
                  >
                    <div className="flex-auto truncate">
                      <div className="flex items-center space-x-1 truncate">
                        <div className="text-white truncate">
                          {message.name}
                        </div>
                        <div className="text-gray-500 text-xs hidden md:block">
                          {message.id}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatUpdatedAt(message.updated_at)}
                      </div>
                    </div>
                    <div className="flex flex-none items-center space-x-4">
                      <Tooltip text="Restore Message">
                        <ArrowDownTrayIcon
                          className="text-gray-300 h-5 w-5 hover:text-white cursor-pointer"
                          role="button"
                          onClick={() => restoreMessage(message)}
                        />
                      </Tooltip>
                      <Tooltip text="Overwrite Message">
                        <ArrowUpTrayIcon
                          className="text-gray-300 h-5 w-5 hover:text-white cursor-pointer"
                          role="button"
                          onClick={() => updateMessage(message)}
                        />
                      </Tooltip>
                      <Tooltip text="Delete Message">
                        <TrashIcon
                          className="text-gray-300 h-5 w-5 hover:text-white cursor-pointer"
                          role="button"
                          onClick={() => deleteMessage(message)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                ))}
                {messagesQuery.data.data.length === 0 && (
                  <div className="text-gray-400">
                    There are no saved messages yet. Enter a name below and
                    click on "Save Message"
                  </div>
                )}
              </div>
            )}
            <div className="flex space-x-3 items-end flex-none">
              <EditorInput
                label="Message Name"
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
          <LoginSuggest alwaysExpanded={true} />
        )}
      </div>
    </EditorModal>
  );
}
