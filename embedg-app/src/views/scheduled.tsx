import { useScheduledMessagesQuery, useUserQuery } from "../api/queries";
import LogginSuggest from "../components/LoginSuggest";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import ScheduledMessage from "../components/ScheduledMessage";
import ScheduledMessageCreate from "../components/ScheduledMessageCreate";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { AutoAnimate } from "../util/autoAnimate";

export default function ScheduledMessagesView() {
  const { data: user } = useUserQuery();

  const [create, setCreate] = useState(false);

  const guildId = useSendSettingsStore((s) => s.guildId);

  const messagesQuery = useScheduledMessagesQuery(guildId);
  const messageCount = messagesQuery.data?.success
    ? messagesQuery.data.data.length
    : 0;

  const guildFeatures = usePremiumGuildFeatures(guildId);
  const maxMessages = guildFeatures?.max_scheduled_messages || 0;

  const messages = useMemo(() => {
    if (!messagesQuery.data?.success) return [];

    return messagesQuery.data.data;
  }, [messagesQuery.data]);

  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 lg:my-20">
        <div className="mb-10">
          <div className="text-white font-medium mb-3 flex items-center space-x-3">
            <div className="text-2xl">Scheduled Messages</div>
            <div className="font-light italic text-gray-400 flex-none">
              {messageCount} / {maxMessages}
            </div>
          </div>
          <div className="text-gray-400 font-light text-sm">
            You can create scheduled messages to send a message at a specific
            time and date or periodically. This can be useful for announcements,
            reminders and a lot more.
          </div>
        </div>
        {user?.success ? (
          <div className="space-y-5 mb-8">
            <AutoAnimate className="space-y-5 overlfow-y-auto">
              {messages.map((msg) => (
                <ScheduledMessage msg={msg} key={msg.id} />
              ))}
              {(messageCount === 0 || create) && (
                <ScheduledMessageCreate
                  setCreate={setCreate}
                  cancelable={messageCount !== 0}
                />
              )}
            </AutoAnimate>
            <div className="flex space-x-3 justify-end">
              <button
                className={clsx(
                  "px-3 py-2 rounded border-2 text-white",
                  messageCount < maxMessages
                    ? "border-dark-7 hover:bg-dark-6 cursor-pointer"
                    : "border-dark-6 text-gray-300 cursor-not-allowed"
                )}
                onClick={() => messageCount < maxMessages && setCreate(true)}
              >
                New Scheduled Message
              </button>
            </div>
          </div>
        ) : (
          <LogginSuggest alwaysExpanded={true} />
        )}
      </div>
    </div>
  );
}
