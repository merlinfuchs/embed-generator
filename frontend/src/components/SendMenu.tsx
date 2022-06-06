import { LinkIcon } from "@heroicons/react/outline";
import { useEffect, useMemo, useState } from "react";
import useAlerts from "../hooks/useAlerts";
import useAPIClient from "../hooks/useApiClient";
import useMessage from "../hooks/useMessage";
import useSelectedGuild from "../hooks/useSelectedGuild";
import useSelectedMode from "../hooks/useSelectedMode";
import useToken from "../hooks/useToken";
import ChannelSelect from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import LoginSuggest from "./LoginSuggest";

const webhookUrlRegex =
  /https?:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/;

export default function SendMenu() {
  const client = useAPIClient();
  const [token] = useToken();
  const [msg] = useMessage();

  const [selectedGuild, setSelectedGuild] = useSelectedGuild();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState("");
  const [selectedMode, setSelectedMode] = useSelectedMode();

  const [webhookUrl, setWebhookUrl] = useState("");
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

  useEffect(() => {
    setSelectedChannel("");
  }, [selectedGuild]);

  function wrappedSetSelectedMode(newMode: "webhook" | "channel") {
    if (newMode === "channel" && !token) {
      setSelectedMode("webhook");
    } else {
      setSelectedMode(newMode);
    }
  }

  function sendMessage() {
    if (selectedMode === "webhook") {
      if (webhookId && webhookToken) {
        client.sendMessage({
          target: { webhook_id: webhookId, webhook_token: webhookToken },
          payload_json: JSON.stringify(msg),
        });
      }
    } else {
      client
        .sendMessage({
          target: { guild_id: selectedGuild!, channel_id: selectedChannel! },
          payload_json: JSON.stringify(msg),
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
              Edit Message
            </div>
            <select
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer font-light cursor-pointer"
              value={selectedMessage}
              onChange={(e) => setSelectedMessage(e.target.value)}
            >
              <option value="" disabled>
                Select Message
              </option>
              <option>Some Message</option>
            </select>
          </div>
        </div>
      ) : undefined}
      {!token && <LoginSuggest />}
      <div className="flex justify-end">
        <button
          className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark"
          onClick={sendMessage}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
