import { ChevronDownIcon, PlusCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useGuildsQuery } from "../api/queries";
import { guildIconUrl } from "../discord/cdn";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  guildId: string | null;
  onChange: (guildID: string | null) => void;
}

export default function GuildSelect({ guildId, onChange }: Props) {
  const { data: guilds, isLoading } = useGuildsQuery();

  const guild = useMemo(
    () => guilds?.success && guilds.data.find((g) => g.id === guildId),
    [guilds, guildId]
  );

  useEffect(() => {
    if (!guildId) {
      if (guilds?.success) {
        const defaultGuild = guilds.data.find(
          (g) => g.has_channel_with_bot_access
        );
        if (defaultGuild) {
          onChange(defaultGuild.id);
        }
      }
    } else if (!isLoading) {
      if (!guilds?.success || !guilds.data.find((g) => g.id === guildId)) {
        onChange(null);
      }
    }
  }, [guilds, guildId, isLoading]);

  function selectGuild(guildId: string) {
    onChange(guildId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (guilds?.success) {
      guilds.data.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [guilds]);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded bg-dark-2 relative flex items-center h-10 select-none">
        <div
          onClick={() => setOpen((prev) => !prev)}
          role="button"
          className="flex-auto"
        >
          {guild ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <img
                src={guildIconUrl(guild)}
                className="guild icon url w-7 h-7 rounded-full flex-none"
              />
              <div className="text-lg text-gray-300 flex-auto truncate">
                {guild.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          ) : (
            <div className="text-gray-300">Select server</div>
          )}
        </div>
        {open && (
          <div className="absolute bg-dark-2 top-14 left-0 rounded shadow-lg w-full border-2 border-dark-2 z-10">
            {guilds?.success &&
              guilds.data.map((g) => (
                <div
                  key={g.id}
                  className={clsx(
                    "py-2 flex space-x-2 items-center rounded px-3",
                    g.has_channel_with_bot_access &&
                      g.has_channel_with_user_access
                      ? "hover:bg-dark-3 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  )}
                  role="button"
                  onClick={() =>
                    g.has_channel_with_bot_access &&
                    g.has_channel_with_user_access &&
                    selectGuild(g.id)
                  }
                >
                  <img
                    src={guildIconUrl(g)}
                    alt="icon"
                    className="h-7 w-7 rounded-full"
                  />
                  <div className="text-gray-300">{g.name}</div>
                </div>
              ))}
            <a
              className="py-2 flex space-x-2 items-center hover:bg-dark-3 rounded cursor-pointer px-3"
              role="button"
              href="/invite"
            >
              <PlusCircleIcon className="w-7 h-7 text-gray-300" />
              <div className="text-gray-300">Invite the bot</div>
            </a>
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
