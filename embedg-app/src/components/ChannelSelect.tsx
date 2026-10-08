import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGuildChannelsQuery, useGuildsQuery } from "../api/queries";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";
import Tooltip from "./Tooltip";
import { useToasts } from "../util/toasts";
import { isThreadOnlyChannel } from "../discord/util";
import type { GuildChannelWire } from "../api/wire";
import { permissionFlags } from "./PermissionsSelect";

type Sender = "webhook" | "bot";

type ChannelAccess = Pick<
  GuildChannelWire,
  "type" | "user_access" | "bot_access" | "bot_permissions"
>;

interface Props {
  guildId: string | null;
  channelId: string | null;
  onChange: (channelId: string | null) => void;
  /**
   * Who posts in the channel. The bot can't post in forum and media channels directly and needs
   * Send Messages instead of Manage Webhooks.
   */
  sender?: Sender;
}

// text, voice, announcement, announcement thread, public thread, private thread, stage, forum, media.
// Voice and stage channels have a text chat that webhooks can post in.
const selectableChannelTypes = new Set([0, 2, 5, 10, 11, 12, 13, 15, 16]);

// Top level of the list: the selectable types plus categories, minus threads, which are listed
// under their channel.
const rootChannelTypes = new Set([0, 2, 4, 5, 13, 15, 16]);

const threadChannelTypes = new Set([10, 11, 12]);

/** What decides whether a channel can be picked, besides the channel itself. */
interface PickContext {
  sender: Sender;
  // The user's server level Manage Webhooks, which is all the bot sender checks for them.
  serverManageWebhooks: boolean;
}

function canSelectChannelType(type: number, sender: Sender) {
  if (sender === "bot" && isThreadOnlyChannel(type)) return false;
  return selectableChannelTypes.has(type);
}

// The permissions are the bot's in the channel, which are all of them for an administrator.
function hasBotAccess(channel: ChannelAccess, sender: Sender) {
  if (sender === "webhook") return channel.bot_access;
  const needed = threadChannelTypes.has(channel.type)
    ? permissionFlags.SEND_MESSAGES_IN_THREADS
    : permissionFlags.SEND_MESSAGES;
  return (BigInt(channel.bot_permissions) & needed) !== 0n;
}

function hasUserAccess(channel: ChannelAccess, ctx: PickContext) {
  return ctx.sender === "bot" ? ctx.serverManageWebhooks : channel.user_access;
}

function canSelect(channel: ChannelAccess, ctx: PickContext) {
  return (
    hasUserAccess(channel, ctx) &&
    hasBotAccess(channel, ctx.sender) &&
    canSelectChannelType(channel.type, ctx.sender)
  );
}

const channelPermissionsDocsUrl =
  "https://message.style/docs/guides/channel-permissions";

const otherChannelsDocsUrl = `${channelPermissionsDocsUrl}#actions-that-send-to-other-channels`;

// Most often a channel or category overwrite that takes Manage Webhooks away from a role, which the
// server wide role settings don't show. Administrator skips overwrites, so it "fixes" this too.
function missingAccessReason(channel: ChannelAccess, ctx: PickContext) {
  if (ctx.sender === "bot") {
    if (isThreadOnlyChannel(channel.type))
      return "The bot can't post here directly. Pick a post in this channel instead.";
    if (!canSelectChannelType(channel.type, ctx.sender)) return null;
    // The same for every channel, so it comes first to not hide behind a bot permission.
    if (!ctx.serverManageWebhooks)
      return "You need Manage Webhooks in the server's role settings to send to other channels. Click for help.";
    if (!hasBotAccess(channel, ctx.sender))
      return "The bot needs Send Messages in this channel. Click for help.";
    return null;
  }

  if (!canSelectChannelType(channel.type, ctx.sender)) return null;
  if (!channel.bot_access)
    return "The bot needs Manage Webhooks in this channel. Click for help.";
  if (!channel.user_access)
    return "You need Manage Webhooks in this channel. Click for help.";
  return null;
}

function ChannelIcon({ type }: { type: number }) {
  if (type === 4) {
    return <ChevronDownIcon className="h-5 w-5 text-mist-300" />;
  }
  if (type === 15) {
    return <ChatBubbleLeftRightIcon className="h-5 w-5 text-mist-300" />;
  }
  if (type === 16) {
    return <PhotoIcon className="h-5 w-5 text-mist-300" />;
  }
  if (type === 2 || type === 13) {
    return <SpeakerWaveIcon className="h-5 w-5 text-mist-300" />;
  }
  return <div className="text-xl italic text-mist-400 font-light pl-1">#</div>;
}

export function ChannelSelect({
  guildId,
  channelId,
  onChange,
  sender = "webhook",
}: Props) {
  const { data } = useGuildChannelsQuery(guildId);
  const { data: guilds } = useGuildsQuery();
  const serverManageWebhooks =
    (guilds?.success &&
      guilds.data.find((g) => g.id === guildId)?.can_manage_webhooks) ||
    false;
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
    const ctx: PickContext = { sender, serverManageWebhooks };
    // Already sorted by position in the query, which the tree building below depends on.
    const rawChannels = data?.success ? data.data : [];

    const added = new Set<string>();
    const res = [];
    const ids = new Set(rawChannels.map((c) => c.id));

    // This is really inefficient but it should be fine because there are never more than 500 channels
    for (const rootChannel of rawChannels) {
      // Discord leaves out categories the bot can't view, so their children become root channels.
      if (rootChannel.parent_id && ids.has(rootChannel.parent_id)) continue;

      if (rootChannelTypes.has(rootChannel.type)) {
        added.add(rootChannel.id);
        res.push({
          ...rootChannel,
          level: 0,
          canSelect: canSelect(rootChannel, ctx),
        });
      }

      for (const childChannel of rawChannels) {
        if (childChannel.parent_id !== rootChannel.id) continue;

        // A channel in a category, or a thread of a channel outside one.
        // Forum and media channels stay listed for the bot, as the parents of their posts.
        if (selectableChannelTypes.has(childChannel.type)) {
          added.add(childChannel.id);
          res.push({
            ...childChannel,
            level: 1,
            canSelect: canSelect(childChannel, ctx),
          });
        }

        for (const childThread of rawChannels) {
          if (childThread.parent_id !== childChannel.id) continue;

          if (threadChannelTypes.has(childThread.type)) {
            added.add(childThread.id);
            res.push({
              ...childThread,
              level: 2,
              canSelect: canSelect(childThread, ctx),
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
        canSelect: canSelect(channel, ctx),
      });
    }

    return res;
  }, [data, sender, serverManageWebhooks]);

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

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 h-10 flex items-center rounded-lg bg-ink-900 relative select-none">
        {/* Not a button itself: it holds the filter input, which may not be nested inside one. */}
        <div className="flex-auto">
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
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={clsx("w-full text-left", open && "md:hidden")}
          >
            {!data ? (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="h-5 w-5 text-mist-300 animate-spin" />
                <div className="text-mist-400">Loading...</div>
              </div>
            ) : channel ? (
              <div className="flex items-center space-x-2 cursor-pointer w-full">
                <ChannelIcon type={channel.type} />
                <div className="text-mist-300 flex-auto truncate">
                  {channel.name}
                </div>
                <ChevronDownIcon className="text-white w-5 h-5 flex-none transition-transform" />
              </div>
            ) : (
              <div className="text-mist-300">Select channel</div>
            )}
          </button>
        </div>
        {open && (
          <SelectDropdown>
            {filteredChannels.length ? (
              filteredChannels.map((c) => {
                const reason = c.canSelect
                  ? null
                  : missingAccessReason(c, { sender, serverManageWebhooks });
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={clsx(
                      "py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg pr-3",
                      c.level === 0 ? "pl-2" : c.level === 1 ? "pl-4" : "pl-6",
                      c.canSelect ? "cursor-pointer" : "cursor-not-allowed",
                      "w-full text-left",
                    )}
                    // Not disabled: a disabled button swallows the hover the reason tooltip needs.
                    aria-disabled={!c.canSelect}
                    onClick={() => c.canSelect && selectChannel(c.id)}
                  >
                    <ChannelIcon type={c.type} />
                    <div
                      className={clsx(
                        "truncate",
                        c.canSelect ? "text-mist-300" : "text-mist-400",
                      )}
                    >
                      {c.name}
                    </div>
                    {reason && (
                      // Not a link: an anchor can't be nested in the row's button.
                      <div
                        className="ml-auto flex-none cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            sender === "bot"
                              ? otherChannelsDocsUrl
                              : channelPermissionsDocsUrl,
                            "_blank",
                            "noopener",
                          );
                        }}
                      >
                        <Tooltip text={reason}>
                          <ExclamationCircleIcon className="h-5 w-5 text-mist-400 hover:text-mist-100" />
                        </Tooltip>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-2 text-mist-300">
                {data?.success === false
                  ? data.error.message
                  : "No channels found"}
              </div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
