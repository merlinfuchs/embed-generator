import { LinkIcon } from "@heroicons/react/outline";
import { useEffect, useMemo, useState } from "react";
import { Message } from "../discord";
import useAlerts from "../hooks/useAlerts";
import useAPIClient from "../hooks/useApiClient";
import useMessage from "../hooks/useMessage";
import useSelectedGuild from "../hooks/useSelectedGuild";
import useSelectedMode from "../hooks/useSelectedMode";
import useToken from "../hooks/useToken";
import ChannelSelect from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import HistoryMessageSelect from "./HistoryMessageSelect";
import LoginSuggest from "./LoginSuggest";

const webhookUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;
const messageUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord\.com\/channels\/[0-9]+\/([0-9]+)\/([0-9]+)/;

export default function SendMenu() {
  const client = useAPIClient();
  const [token] = useToken();
  const [msg] = useMessage();

  const [selectedGuild, setSelectedGuild] = useSelectedGuild();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useSelectedMode();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [threadId, setThreadId] = useState("");
  const [messageId, setMessageId] = useState("");

  const addAlert = useAlerts();

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
    <div className="space-y-5">
      <div className="flex items-end space-x-3">
        {!!token && (
          <div className="flex-none">
            {selectedMode === "webhook" ? (
              <div
                onClick={() => wrappedSetSelectedMode("channel")}
                className="bg-dark-2 flex items-center justify-center rounded h-10 w-10 cursor-pointer text-gray-200"
              >
                <LinkIcon className="h-7 w-7" />
              </div>
            ) : (
              <div
                onClick={() => wrappedSetSelectedMode("webhook")}
                className="bg-dark-2 flex items-center justify-center rounded h-10 w-10 cursor-pointer text-3xl text-gray-200"
              >
                #
              </div>
            )}
          </div>
        )}
        {selectedMode === "webhook" ? (
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
        ) : (
          <div className="flex-auto">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Server
            </div>
            <GuildSelect value={selectedGuild} onChange={setSelectedGuild} />
          </div>
        )}
      </div>
      {selectedMode === "channel" ? (
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
      ) : (
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
      )}
      {!token && <LoginSuggest />}
      <div className="flex justify-end">
        <button
          className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
          onClick={sendMessage}
        >
          {messageId ? "Edit Message" : "Send Message"}
        </button>
      </div>
    </div>
  );
}
