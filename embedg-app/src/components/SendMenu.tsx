import clsx from "clsx";
import { useState } from "react";
import { useSendMessageToChannelMutation } from "../api/mutations";
import { useUserQuery } from "../api/queries";
import { useCurrentMessageStore } from "../state/message";
import { useSelectedGuildStore } from "../state/selectedGuild";
import { ChannelSelect } from "./ChannelSelect";
import GuildSelect from "./GuildSelect";
import LoginPrompt from "./LoginPrompt";
import { useValidationErrorStore } from "../state/validationError";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

export default function SendMenu() {
  const validationError = useValidationErrorStore((state) =>
    state.checkIssueByPathPrefix("")
  );

  const [mode, setMode] = useState<"webhook" | "channel">("channel");

  const selectedGuildId = useSelectedGuildStore((state) => state.guildId);
  const setSelectedGuildId = useSelectedGuildStore((state) => state.setGuildId);

  const [selectedChannnelId, setSelectedChannelId] = useState<string | null>(
    null
  );

  const { data: user } = useUserQuery();

  function toggleMode() {
    setMode((prev) => (prev === "webhook" ? "channel" : "webhook"));
  }

  const sendToChannelMutation = useSendMessageToChannelMutation();
  const sendToWebhookMutation = useSendMessageToChannelMutation();

  function send() {
    if (validationError) return;

    if (mode === "channel") {
      if (!selectedGuildId || !selectedChannnelId) {
        return;
      }

      sendToChannelMutation.mutate({
        guild_id: selectedGuildId,
        channel_id: selectedChannnelId,
        message_id: null,
        data: useCurrentMessageStore.getState(),
        attachments: [],
      });
    } else {
    }
  }

  return (
    <div>
      <div className="flex mb-5">
        <button
          className="flex bg-dark-2 p-1 rounded text-white"
          onClick={toggleMode}
        >
          <div
            className={clsx(
              "py-1 px-2 rounded transition-colors",
              mode === "webhook" && "bg-dark-3"
            )}
          >
            Webhook
          </div>
          <div
            className={clsx(
              "py-1 px-2 rounded transition-colors",
              mode === "channel" && "bg-dark-3"
            )}
          >
            Channel
          </div>
        </button>
      </div>
      {mode === "webhook" ? (
        <div>
          <div className="flex mb-5">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Webhook URL
              </div>
              <input
                type="text"
                className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Thread ID
              </div>
              <input
                type="text"
                className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
              />
            </div>
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Message ID or URL
              </div>
              <input
                type="text"
                className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
              />
            </div>
          </div>
        </div>
      ) : !!user ? (
        <div className="space-y-5">
          <div className="flex">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Server
              </div>
              <GuildSelect
                guildId={selectedGuildId}
                onChange={setSelectedGuildId}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Channel
              </div>
              <ChannelSelect
                guildId={selectedGuildId}
                channelId={selectedChannnelId}
                onChange={setSelectedChannelId}
              />
            </div>
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Message ID or URL
              </div>
              <input
                type="text"
                className="bg-dark-2 px-3 py-2 rounded w-full focus:outline-none text-white"
              />
            </div>
          </div>
          <div>
            {validationError && (
              <div className="flex items-center text-red space-x-1">
                <ExclamationCircleIcon className="h-5 w-5" />
                <div>
                  There are errors in your message. You have to fix them before
                  sending the message.
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <div
              className={`px-3 py-2 rounded text-white ${
                validationError
                  ? "cursor-not-allowed bg-dark-2"
                  : "bg-blurple hover:bg-blurple-dark cursor-pointer"
              }`}
              role="button"
              onClick={send}
            >
              Send Message
            </div>
          </div>
        </div>
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}
