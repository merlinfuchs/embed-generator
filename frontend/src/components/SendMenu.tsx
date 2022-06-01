import { ChangeEvent, useState } from "react";
import useSelectedGuild from "../hooks/useSelectedGuild";
import useSelectedMode from "../hooks/useSelectedMode";
import useToken from "../hooks/useToken";

export default function SendMenu() {
  const [selectedGuild, setSelectedGuild] = useSelectedGuild();
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedMessage, setSelectedMessage] = useState("");
  const [selectedMode, setSelectedMode] = useSelectedMode();

  const [token] = useToken();

  function handleModeChange(e: ChangeEvent<HTMLSelectElement>) {
    const newMode = e.target.value;
    if (newMode === "channel" && !token) {
      // TODO: open login popup
      setSelectedMode("webhook");
    } else {
      setSelectedMode(newMode as "webhook" | "channel");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex space-x-3">
        <div className="flex-none">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Mode
          </div>
          <select
            className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer font-light"
            onChange={handleModeChange}
            value={selectedMode}
          >
            <option value="webhook">Webhook URL</option>
            <option value="channel">Select Channel</option>
          </select>
        </div>
        {selectedMode === "webhook" ? (
          <div className="flex-auto">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Webhook URL
            </div>
            <input
              type="text"
              className="bg-dark-2 rounded p-2 w-full no-ring font-light"
            />
          </div>
        ) : (
          <div className="flex-auto">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Server
            </div>
            <select
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointe font-light cursor-pointer"
              value={selectedGuild || ""}
              onChange={(e) => setSelectedGuild(e.target.value)}
            >
              <option>Some Server</option>
            </select>
          </div>
        )}
      </div>
      {selectedMode === "channel" ? (
        <div className="flex space-x-3">
          <div className="flex-auto">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Channel
            </div>
            <select
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer font-light cursor-pointer"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
            >
              <option>Some Channel</option>
            </select>
          </div>
          <div className="flex-auto">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Edit Message
            </div>
            <select
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer font-light cursor-pointer"
              value={selectedMessage}
              onChange={(e) => setSelectedMessage(e.target.value)}
            >
              <option>Some Message</option>
            </select>
          </div>
        </div>
      ) : undefined}
    </div>
  );
}
