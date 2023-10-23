import {
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useGuildChannelsQuery } from "../api/queries";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  guildId: string | null;
  channelId: string | null;
  onChange: (channelId: string | null) => void;
}

function canSelectChannelType(type: number) {
  // text, announcement, announcement thread, text thread, (TODO: forum?)
  return type === 0 || type === 5 || type === 10 || type === 11;
}

export function ChannelSelect({ guildId, channelId, onChange }: Props) {
  const { data } = useGuildChannelsQuery(guildId);

  function selectChannel(channelId: string) {
    onChange(channelId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  const channels = useMemo(() => {
    const rawChannels = data?.success ? data.data : [];

    // Sort channels by position, this is important for the next steps
    rawChannels.sort((a, b) =>
      a.position === b.position && a.type === 4 ? 1 : a.position - b.position
    );

    const res = [];

    // This is really inefficient but it should be fine because there are never more than 500 channels
    for (const rootChannel of rawChannels) {
      if (rootChannel.parent_id) continue;

      if (
        rootChannel.type === 0 ||
        rootChannel.type === 4 ||
        rootChannel.type === 5 ||
        rootChannel.type === 13 ||
        rootChannel.type === 15
      ) {
        // text, category, announcement, stage, forum
        res.push({
          ...rootChannel,
          level: 0,
          canSelect:
            rootChannel.user_access &&
            rootChannel.bot_access &&
            canSelectChannelType(rootChannel.type),
        });
      }

      for (const childChannel of rawChannels) {
        if (childChannel.parent_id !== rootChannel.id) continue;

        if (
          childChannel.type === 0 ||
          childChannel.type === 5 ||
          childChannel.type === 10 ||
          childChannel.type === 11 ||
          childChannel.type === 13 ||
          childChannel.type === 15
        ) {
          // text, announcement, announcement thread, text thread, stage, forum
          res.push({
            ...childChannel,
            level: 1,
            canSelect:
              childChannel.user_access &&
              childChannel.bot_access &&
              canSelectChannelType(childChannel.type),
          });
        }

        for (const childThread of rawChannels) {
          if (childThread.parent_id !== childChannel.id) continue;

          if (childThread.type === 10 || childThread.type === 11) {
            // announcement thread, text thread
            res.push({
              ...childThread,
              level: 2,
              canSelect:
                childThread.user_access &&
                childThread.bot_access &&
                canSelectChannelType(childThread.type),
            });
          }
        }
      }
    }

    return res;
  }, [data]);

  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId]
  );

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 h-10 flex items-center rounded bg-dark-2 relative">
        <div
          role="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto"
        >
          {channel ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div className="text-xl italic text-gray-400 font-light">#</div>
              <div className="text-gray-300 flex-auto truncate">
                {channel.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          ) : (
            <div className="text-gray-300">Select channel</div>
          )}
        </div>
        {open && (
          <div className="absolute bg-dark-2 top-14 left-0 rounded shadow-lg w-full border-2 border-dark-2 z-10 max-h-48 overflow-y-auto overflow-x-none">
            {channels.length ? (
              channels.map((c) => (
                <div
                  key={c.id}
                  className={clsx(
                    "py-2 flex space-x-2 items-center hover:bg-dark-3 rounded pr-3",
                    c.level === 0 ? "pl-2" : c.level === 1 ? "pl-4" : "pl-6",
                    c.canSelect ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                  role="button"
                  onClick={() => c.canSelect && selectChannel(c.id)}
                >
                  {c.type === 4 ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-300" />
                  ) : c.type === 15 ? (
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-300" />
                  ) : (
                    <div className="text-xl italic text-gray-400 font-light pl-1">
                      #
                    </div>
                  )}
                  <div
                    className={clsx(
                      "truncate",
                      c.canSelect ? "text-gray-300" : "text-gray-400"
                    )}
                  >
                    {c.name}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-300">No channels found</div>
            )}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
