import { Switch } from "@headlessui/react";
import { LinkIcon } from "@heroicons/react/outline";
import { useMemo, useState } from "react";
import { json } from "stream/consumers";
import { Message } from "../discord/types";
import useAlerts from "../hooks/useAlerts";
import useAPIClient from "../hooks/useApiClient";
import useAttachments from "../hooks/useAttachments";
import useMessage from "../hooks/useMessage";
import useSelectedGuild from "../hooks/useSelectedGuild";
import useSelectedMode from "../hooks/useSelectedMode";
import useToken from "../hooks/useToken";
import { classNames } from "../util";
import ChannelSelect from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import JsonEditorModal from "./JsonEditorModal";
import LoginSuggest from "./LoginSuggest";

const webhookUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;
const messageUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord\.com\/channels\/[0-9]+\/([0-9]+)\/([0-9]+)/;

export default function SendMenu() {
  const client = useAPIClient();
  const [token] = useToken();
  const [msg] = useMessage();
  const [attachments] = useAttachments();

  const [selectedGuild, setSelectedGuild] = useSelectedGuild();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useSelectedMode();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [threadId, setThreadId] = useState("");
  const [messageId, setMessageId] = useState("");

  const addAlert = useAlerts();

  const [jsonModal, setJsonModal] = useState(false);

  const [webhookId, webhookToken] = useMemo(() => {
    if (webhookUrl) {
      const match = webhookUrl.match(webhookUrlRegex);
      if (match) {
        return [match[1], match[2]];
      }
    }
    return [null, null];
  }, [webhookUrl]);

  function wrappedSetSelectedMode(newMode: "webhook" | "channel") {
    if (newMode === "channel" && !token) {
      setSelectedMode("webhook");
    } else {
      setSelectedMode(newMode);
    }
  }

  function wrappedSetMessageId(value: string) {
    const match = value.match(messageUrlRegex);
    if (match) {
      setMessageId(match[2]);
    } else {
      setMessageId(value);
    }
  }

  function sendMessage() {
    const msgPayload: Message = JSON.parse(JSON.stringify(msg));
    if (!msgPayload.username) {
      msgPayload.username = "Embed Generator";
    }
    if (!msgPayload.avatar_url) {
      msgPayload.avatar_url = "https://message.style/logo128.png";
    }

    if (selectedMode === "webhook") {
      if (webhookId && webhookToken) {
        client.sendMessage({
          target: {
            webhook_id: webhookId,
            webhook_token: webhookToken,
            thread_id: threadId || undefined,
            message_id: messageId || undefined,
          },
          payload_json: JSON.stringify(msgPayload),
          attachments,
        });
      }
    } else {
      client
        .sendMessage({
          target: {
            guild_id: selectedGuild!, // TODO
            channel_id: selectedChannel!,
            message_id: messageId || undefined,
          },
          payload_json: JSON.stringify(msgPayload),
          attachments,
        })
        .then((resp) => {
          if (resp.success) {
            addAlert({
              type: "success",
              title: "Message Sent",
              details: "The message has been sent to the selected channel.",
            });
          } else {
            addAlert({
              type: "error",
              title: "Sending Failed",
              details: resp.error.details || "No details available",
            });
          }
        });
    }
  }

  return (
    <>
      <div className="space-y-5">
        {!!token && (
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Send To
            </div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="bg-dark-2 rounded px-3 py-2 w-full sm:w-64 cursor-pointer"
            >
              <option value="webhook">Webhook</option>
              <option value="channel">Channel</option>
            </select>
          </div>
        )}
        {selectedMode === "channel" ? (
          <>
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Server
              </div>
              <GuildSelect value={selectedGuild} onChange={setSelectedGuild} />
            </div>
            <div className="flex space-x-3">
              <div className="flex-auto w-full">
                <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                  Channel
                </div>
                <ChannelSelect
                  value={selectedChannel}
                  onChange={setSelectedChannel}
                />
              </div>
              <div className="flex-auto w-full">
                <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                  Message ID or URL
                </div>
                <input
                  type="text"
                  className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                  value={messageId}
                  onChange={(e) => wrappedSetMessageId(e.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Webhook URL
              </div>
              <input
                type="url"
                className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <div className="flex-auto w-full">
                <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                  Thread ID
                </div>
                <input
                  type="text"
                  className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                  value={threadId}
                  onChange={(e) => setThreadId(e.target.value)}
                />
              </div>
              <div className="flex-auto w-full">
                <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                  Message ID or URL
                </div>
                <input
                  type="text"
                  className="bg-dark-2 rounded p-2 w-full no-ring font-light"
                  value={messageId}
                  onChange={(e) => wrappedSetMessageId(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
        {!token && <LoginSuggest />}
        <div className="flex justify-end space-x-3">
          {/* <button
            className="border-2 border-blurple px-3 py-2 rounded transition-colors hover:bg-blurple"
            onClick={() => setJsonModal(!jsonModal)}
          >
            View JSON
        </button> */}
          <button
            className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
            onClick={sendMessage}
          >
            {messageId ? "Edit Message" : "Send Message"}
          </button>
        </div>
      </div>
      <JsonEditorModal visible={jsonModal} setVisible={setJsonModal} />
    </>
  );
}
