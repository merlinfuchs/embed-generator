import { useMemo, useState } from "react";
import EditorModal from "../../components/EditorModal";
import GuildOrUserSelect from "../../components/GuildOrUserSelect";
import { useSavedMessagesQuery, useUserQuery } from "../../api/queries";
import EditorInput from "../../components/EditorInput";
import clsx from "clsx";
import LoginPrompt from "../../components/LoginPrompt";

export default function MessagesView() {
  const [source, setSource] = useState<string | null>(null);

  const { data: user } = useUserQuery();

  const guildId = useMemo(() => (source === "user" ? null : source), [source]);
  const messagesQuery = useSavedMessagesQuery(guildId);

  const [newMessageName, setNewMessageName] = useState("");

  function saveNewMessage() {
    if (!newMessageName) {
      return;
    }
  }

  function overwriteExistingMessage(id: string) {}

  function restoreMessage(id: string) {}

  function deleteMessage(id: string) {}

  return (
    <EditorModal>
      <div className="p-4 space-y-5">
        {user ? (
          <>
            <div>
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Show Messages For
              </div>
              <div className="w-full max-w-md">
                <GuildOrUserSelect value={source} onChange={setSource} />
              </div>
            </div>
            <div className="space-y-3">
              {messagesQuery?.data?.map((message) => (
                <div key={message.id}></div>
              ))}
            </div>
            <div className="flex space-x-3 items-end">
              <EditorInput
                label="Message Name"
                maxLength={25}
                value={newMessageName}
                onChange={setNewMessageName}
              ></EditorInput>
              <button
                className={clsx(
                  "px-3 py-2 rounded text-white",
                  newMessageName
                    ? "bg-blurple hover:bg-blurple-dark"
                    : "bg-dark-2 cursor-not-allowed"
                )}
                onClick={saveNewMessage}
              >
                Save Message
              </button>
            </div>
          </>
        ) : (
          <LoginPrompt />
        )}
      </div>
    </EditorModal>
  );
}
