import { CloudUploadIcon, MenuIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";
import { jsonToMessage, messageToJson } from "../discord/utils";
import useAlerts from "../hooks/useAlerts";
import useAPIClient from "../hooks/useApiClient";
import useMessage from "../hooks/useMessage";
import useMessages from "../hooks/useMessages";
import MessageManageModal from "./MessageManageModal";
import MessageSelect from "./MessageSelect";

export default function MessageManager() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [messages, refreshMessages] = useMessages();
  const [visible, setVisible] = useState(false);
  const [msg, dispatch] = useMessage();
  const client = useAPIClient();

  const addAlert = useAlerts();

  useEffect(() => {
    if (!selectedMessage) return;
    const message = messages?.find((m) => m.id === selectedMessage);
    if (message) {
      const value = jsonToMessage(JSON.parse(message.payload_json));
      dispatch({ type: "replace", value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessage]);

  function updateSelectedMessage() {
    if (!selectedMessage) return;
    const message = messages?.find((m) => m.id === selectedMessage);
    const payloadJson = JSON.stringify(messageToJson(msg));
    if (message) {
      client
        .updateMessage(selectedMessage, {
          name: message.name,
          description: message.description,
          payload_json: payloadJson,
        })
        .then((resp) => {
          if (resp.success) {
            refreshMessages();
            addAlert({
              type: "success",
              title: "Message Saved",
              details: "The changes have been saved",
            });
          } else {
            addAlert({
              type: "error",
              title: "Saving Failed",
              details: resp.error.details || "No details available",
            });
          }
        });
    }
  }

  return (
    <>
      <div className="flex-shrink-0 flex space-x-2">
        <div
          className="bg-dark-2 rounded flex items-center justify-center cursor-pointer px-3 hover:bg-dark-1"
          onClick={() => setVisible(true)}
        >
          <MenuIcon className="w-5 h-5" />
          <div className="ml-3 hidden lg:block">Messages</div>
        </div>
        {!!selectedMessage && (
          <div
            className="bg-dark-2 rounded flex items-center justify-center cursor-pointer px-3 hover:bg-dark-1"
            onClick={updateSelectedMessage}
          >
            <CloudUploadIcon className="w-5 h-5" />
            <div className="ml-3 hidden lg:block">Save</div>
          </div>
        )}
        <MessageSelect value={selectedMessage} onChange={setSelectedMessage} />
      </div>
      <MessageManageModal visible={visible} setVisible={setVisible} />
    </>
  );
}
