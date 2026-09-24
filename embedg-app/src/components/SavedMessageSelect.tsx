import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useSavedMessagesQuery } from "../api/queries";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";

interface Props {
  guildId: string | null;
  messageId: string | null;
  onChange: (messageId: string | null) => void;
}

export default function SavedMessageSelect({
  guildId,
  messageId,
  onChange,
}: Props) {
  const { data: messages, isPending } = useSavedMessagesQuery(guildId);

  const message = useMemo(
    () => messages?.success && messages.data.find((m) => m.id === messageId),
    [messages, messageId],
  );

  useEffect(() => {
    if (!isPending) {
      if (
        !messages?.success ||
        !messages.data.find((m) => m.id === messageId)
      ) {
        onChange(null);
      }
    }
  }, [messages, messageId, isPending]);

  function selectMessage(messageId: string) {
    onChange(messageId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded-lg bg-ink-900 relative flex items-center h-10 select-none">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto text-left"
        >
          {!guildId ? (
            <div className="text-mist-300">Select server at the top</div>
          ) : message ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div></div>
              <div className="text-lg text-mist-300 flex-auto truncate">
                {message.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : (
            <div className="text-mist-300">Select saved message</div>
          )}
        </button>
        {open && (
          <SelectDropdown>
            {messages?.success && messages.data.length > 0 ? (
              messages.data.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className="py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left"
                  onClick={() => selectMessage(m.id)}
                >
                  <div></div>
                  <div className="text-mist-300">{m.name}</div>
                </button>
              ))
            ) : (
              <div className="text-mist-300 p-2">No saved messages</div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
