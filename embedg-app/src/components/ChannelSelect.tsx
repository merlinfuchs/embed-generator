import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useGuildChannelsQuery } from "../api/queries";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  guildId: string | null;
  channelId: string | null;
  onChange: (channelId: string | null) => void;
}

export function ChannelSelect({ guildId, channelId, onChange }: Props) {
  const { data: channels } = useGuildChannelsQuery(guildId);

  const channel = useMemo(
    () => channels?.success && channels.data.find((c) => c.id === channelId),
    [channels, channelId]
  );

  function selectChannel(channelId: string) {
    onChange(channelId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

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
            {channels?.success && channels.data.length ? (
              channels.data.map((c) => (
                <div
                  key={c.id}
                  className="py-2 flex space-x-2 items-center hover:bg-dark-3 rounded cursor-pointer px-3"
                  role="button"
                  onClick={() => selectChannel(c.id)}
                >
                  <div className="text-xl italic text-gray-400 font-light">
                    #
                  </div>
                  <div className="text-gray-300 truncate">{c.name}</div>
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
