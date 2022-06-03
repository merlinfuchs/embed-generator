import { LinkIcon } from "@heroicons/react/outline";
import { ChangeEvent, useEffect, useState } from "react";
import useChannels from "../hooks/useChannels";
import useGuilds from "../hooks/useGuilds";
import useSelectedGuild from "../hooks/useSelectedGuild";
import useSelectedMode from "../hooks/useSelectedMode";
import useToken from "../hooks/useToken";
import ChannelSelect from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import LoginSuggest from "./LoginSuggest";

export default function SendMenu() {
  const [selectedGuild, setSelectedGuild] = useSelectedGuild();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState("");
  const [selectedMode, setSelectedMode] = useSelectedMode();

  const [token] = useToken();
  const guilds = useGuilds();
  const channels = useChannels();

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
        <button className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark">
          Send Message
        </button>
      </div>
    </div>
  );
}
