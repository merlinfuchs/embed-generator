import { useScheduledMessagesQuery, useUserQuery } from "../api/queries";
import LogginSuggest from "../components/LoginSuggest";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";
import ScheduledMessage from "../components/ScheduledMessage";
import ScheduledMessageCreate from "../components/ScheduledMessageCreate";
import { useMemo, useState } from "react";
import { AutoAnimate } from "../util/autoAnimate";
import LimitButton from "../components/LimitButton";
import ScheduledMessagesCalendar from "../components/ScheduledMessagesCalendar";
import SegmentedControl from "../components/SegmentedControl";

export default function ScheduledMessagesView() {
  const { data: user } = useUserQuery();

  // A new message, on the day it was started on in the calendar.
  const [create, setCreate] = useState<false | { day?: string }>(false);
  const [tab, setTab] = useState<"list" | "calendar">("list");
  // The message to open, picked in the calendar.
  const [focusId, setFocusId] = useState<string | null>(null);

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
            <div className="font-light italic text-mist-400 flex-none">
              {messageCount} / {maxMessages}
            </div>
          </div>
          <div className="text-mist-400 font-light text-sm">
            You can create scheduled messages to send a message at a specific
            time and date or periodically. This can be useful for announcements,
            reminders and a lot more.
          </div>
        </div>
        {user?.success ? (
          <div className="space-y-5 mb-8">
            {messageCount !== 0 && (
              <SegmentedControl
                options={[
                  { value: "list", label: "List" },
                  { value: "calendar", label: "Calendar" },
                ]}
                value={tab}
                onChange={(t) => {
                  setTab(t);
                  // Opened once, not again every time the list comes back.
                  setFocusId(null);
                }}
              />
            )}
            {tab === "calendar" && messageCount !== 0 ? (
              <ScheduledMessagesCalendar
                guildId={guildId}
                messages={messages}
                onOpen={(id) => {
                  setTab("list");
                  setFocusId(id);
                }}
                onCreate={(day) => {
                  setTab("list");
                  setCreate({ day });
                }}
              />
            ) : (
              <AutoAnimate className="space-y-5 overflow-y-auto">
                {messages.map((msg) => (
                  <ScheduledMessage
                    msg={msg}
                    key={msg.id}
                    focused={focusId === msg.id}
                  />
                ))}
                {(messageCount === 0 || create) && (
                  <ScheduledMessageCreate
                    initialDay={create ? create.day : undefined}
                    setCreate={(b) => setCreate(b && {})}
                    cancelable={messageCount !== 0}
                  />
                )}
              </AutoAnimate>
            )}
            <div className="flex space-x-3 justify-end">
              <LimitButton
                limit="max_scheduled_messages"
                features={guildFeatures}
                count={messageCount}
                className="px-3 py-2 rounded-lg border-2 border-white/15 hover:bg-white/5 hover:border-white/30 cursor-pointer"
                onClick={() => setCreate({})}
              >
                New Scheduled Message
              </LimitButton>
            </div>
          </div>
        ) : (
          <LogginSuggest alwaysExpanded={true} />
        )}
      </div>
    </div>
  );
}
