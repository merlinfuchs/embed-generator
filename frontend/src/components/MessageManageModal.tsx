import {
  CloudDownloadIcon,
  CloudUploadIcon,
  TrashIcon,
  XIcon,
} from "@heroicons/react/outline";
import { parseISO } from "date-fns";
import { useState } from "react";
import { MessageWire } from "../api/wire";
import { jsonToMessage, messageToJson } from "../discord/utils";
import useAPIClient from "../hooks/useApiClient";
import useMessage from "../hooks/useMessage";
import useMessages from "../hooks/useMessages";
import BaseModal from "./BaseModal";
import StyledInput from "./StyledInput";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function MessageManageModal({ visible, setVisible }: Props) {
  const [messages, refreshMessages] = useMessages();
  const [msg, dispatch] = useMessage();
  const client = useAPIClient();

  const [newName, setNewName] = useState("");

  function saveMessage() {
    if (!client.token || !newName) return;

    const payloadJson = JSON.stringify(messageToJson(msg));
    client
      .createMessage({
        name: newName,
        description: null,
        payload_json: payloadJson,
      })
      .then((resp) => {
        setNewName("");
        if (resp.success) {
          refreshMessages();
        } else {
        }
      });
  }

  function updateMessage(message: MessageWire) {
    if (!client.token) return;
    const payloadJson = JSON.stringify(messageToJson(msg));
    client
      .updateMessage(message.id, {
        name: message.name,
        description: message.description,
        payload_json: payloadJson,
      })
      .then((resp) => {
        if (resp.success) {
          refreshMessages();
        } else {
        }
      });
  }

  function deleteMessage(messageId: string) {
    if (!client.token) return;

    client.deleteMessage(messageId).then((resp) => {
      if (resp) {
        refreshMessages();
      }
    });
  }

  function loadMessage(payloadJson: string) {
    const value = jsonToMessage(JSON.parse(payloadJson));
    dispatch({ type: "replace", value });
  }

  function formatUpdatedAt(updatedAt: string): string {
    return parseISO(updatedAt).toLocaleString();
  }

  return (
    <BaseModal visible={visible} setVisible={setVisible} size="medium">
      <div className="space-y-4">
        <div>
          <div className="flex items-center mb-1">
            <div className="flex items-center flex-auto">
              <div className="font-medium text-lg mr-2">Saved Messages</div>
              <div className="text-gray-400 text-light italic text-sm">
                {messages?.length || 0} / 25
              </div>
            </div>
            <XIcon
              className="flex-none w-6 h-6 text-gray-300 hover:text-gray-100 cursor-pointer"
              onClick={() => setVisible(false)}
            />
          </div>
          <div className="text-sm text-gray-300">
            Saved messages are synchronized across all your devices where you
            are logged in to your Discord account.
          </div>
        </div>
        {messages?.length ? (
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className="bg-dark-3 px-3 py-2 rounded flex items-center"
              >
                <div className="flex-auto truncate">
                  <div>
                    {m.name}{" "}
                    <span className="text-xs text-gray-500">{m.id}</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    {formatUpdatedAt(m.updated_at)}
                  </div>
                </div>
                <div className="flex-none flex items-center space-x-4 pl-3">
                  <CloudDownloadIcon
                    className="w-5 h-5 text-gray-300 hover:text-gray-100 cursor-pointer"
                    onClick={() => loadMessage(m.payload_json)}
                  />
                  <CloudUploadIcon
                    className="w-5 h-5 text-gray-300 hover:text-gray-100 cursor-pointer"
                    onClick={() => updateMessage(m)}
                  />
                  <TrashIcon
                    className="w-5 h-5 text-gray-300 hover:text-gray-100 cursor-pointer"
                    onClick={() => deleteMessage(m.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-300">
            You haven't saved any messages yet. Enter a name below and click on
            "Save".
          </div>
        )}
        <div className="flex space-x-2 items-end">
          <StyledInput
            className="flex-auto"
            type="text"
            label="Message Name"
            value={newName}
            onChange={setNewName}
            maxLength={25}
          />
          {newName.length >= 3 ? (
            <button
              className="px-3 py-2 bg-blurple rounded hover:bg-blurple-dark flex items-center space-x-2"
              onClick={saveMessage}
            >
              <div>Save</div>
              <CloudUploadIcon className="w-5 h-5" />
            </button>
          ) : (
            <button className="px-3 py-2 bg-dark-3 text-gray-300 rounded cursor-not-allowed flex items-center space-x-2">
              <div>Save</div>
              <CloudUploadIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
