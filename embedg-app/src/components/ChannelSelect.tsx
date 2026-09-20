import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGuildChannelsQuery } from "../api/queries";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { useToasts } from "../util/toasts";

interface Props {
  guildId: string | null;
  channelId: string | null;
  onChange: (channelId: string | null) => void;
}

function canSelectChannelType(type: number) {
  // text, announcement, announcement thread, text thread, forum
  return (
    type === 0 ||
    type === 5 ||
    type === 10 ||
    type === 11 ||
    type === 12 ||
    type === 15
  );
}

export function ChannelSelect({ guildId, channelId, onChange }: Props) {
  const { data } = useGuildChannelsQuery(guildId);
  const toast = useToasts((state) => state.create);

  const inputRef = useRef<HTMLInputElement>(null);

  const [open, innerSetOpen] = useState(false);
  const [query, setQuery] = useState("");

  function setOpen(open: boolean) {
    innerSetOpen(open);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      inputRef.current?.blur();
      setQuery("");
    }
  }

  function selectChannel(channelId: string) {
    onChange(channelId);
    setOpen(false);
  }

  useEffect(() => {
    if (data?.success === false) {
      toast({
        title: "Failed to load channels",
        message: data.error.message,
        type: "error",
      });
    }
  }, [data]);

  const channels = useMemo(() => {
    const rawChannels = data?.success ? data.data : [];

    // Sort channels by position, this is important for the next steps
    rawChannels.sort((a, b) =>
      a.position === b.position && a.type === 4 ? 1 : a.position - b.position,
    );

    const added = new Set<string>();
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
        added.add(rootChannel.id);
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
          childChannel.type === 12 ||
          childChannel.type === 13 ||
          childChannel.type === 15
        ) {
          // text, announcement, announcement thread, text thread, stage, forum
          added.add(childChannel.id);
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

          if (
            childThread.type === 10 ||
            childThread.type === 11 ||
            childThread.type === 12
          ) {
            // announcement thread, text thread
            added.add(childThread.id);
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

    for (const channel of rawChannels) {
      if (added.has(channel.id)) continue;
      res.push({
        ...channel,
        level: 2,
        canSelect:
          channel.user_access &&
          channel.bot_access &&
          canSelectChannelType(channel.type),
      });
    }

    return res;
  }, [data]);

  const filteredChannels = useMemo(() => {
    if (!query) return channels;

    const q = query.toLowerCase();
    if (!q) return channels;

    return channels.filter(
      (c) => c.id === q || c.name.toLowerCase().includes(q),
    );
  }, [channels, query]);

  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId],
  );

  // The guild list no longer knows whether the bot can post anywhere, so say it here instead of
  // showing a list where nothing can be picked.
  const botHasNoAccess = useMemo(
    () => channels.length > 0 && !channels.some((c) => c.bot_access),
    [channels],
  );

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 h-10 flex items-center rounded-lg bg-ink-900 relative select-none">
        <div role="button" onClick={() => setOpen(!open)} className="flex-auto">
          <input
            type="text"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={clsx(
              "text-mist-300 flex-auto bg-ink-900 focus:outline-none",
              open ? "hidden md:block" : "hidden",
            )}
          />
          <div className={open ? "md:hidden" : ""}>
            {!data ? (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="h-5 w-5 text-mist-300 animate-spin" />
                <div className="text-mist-400">Loading...</div>
              </div>
            ) : channel ? (
              <div className="flex items-center space-x-2 cursor-pointer w-full">
                {channel.type === 15 ? (
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-mist-300" />
                ) : (
                  <div className="text-xl italic text-mist-400 font-light pl-1">
                    #
                  </div>
                )}
                <div className="text-mist-300 flex-auto truncate">
                  {channel.name}
                </div>
                <ChevronDownIcon className="text-white w-5 h-5 flex-none transition-transform" />
              </div>
            ) : (
              <div className="text-mist-300">Select channel</div>
            )}
          </div>
        </div>
        {open && (
          <div className="absolute bg-ink-900 top-14 left-0 rounded-lg shadow-lg w-full border-2 border-white/10 z-10 max-h-48 overflow-y-auto overflow-x-none">
            {botHasNoAccess && (
              <div className="p-2 text-mist-400 text-sm">
                The bot can't post in any channel in this server. Give it the
                Manage Webhooks permission.
              </div>
            )}
            {filteredChannels.length ? (
              filteredChannels.map((c) => (
                <div
                  key={c.id}
                  className={clsx(
                    "py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg pr-3",
                    c.level === 0 ? "pl-2" : c.level === 1 ? "pl-4" : "pl-6",
                    c.canSelect ? "cursor-pointer" : "cursor-not-allowed",
                  )}
                  role="button"
                  onClick={() => c.canSelect && selectChannel(c.id)}
                >
                  {c.type === 4 ? (
                    <ChevronDownIcon className="h-5 w-5 text-mist-300" />
                  ) : c.type === 15 ? (
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-mist-300" />
                  ) : (
                    <div className="text-xl italic text-mist-400 font-light pl-1">
                      #
                    </div>
                  )}
                  <div
                    className={clsx(
                      "truncate",
                      c.canSelect ? "text-mist-300" : "text-mist-400",
                    )}
                  >
                    {c.name}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 text-mist-300">No channels found</div>
            )}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
