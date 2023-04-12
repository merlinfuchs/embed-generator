import { ChevronDownIcon } from "@heroicons/react/20/solid";
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
    () => guilds && guilds.find((g) => g.id === guildId),
    [guilds, guildId]
  );

  useEffect(() => {
    if (!guildId) {
      if (guilds && guilds.length > 0) {
        onChange(guilds[0].id);
      }
    } else if (!isLoading) {
      if (!guilds || !guilds.find((g) => g.id === guildId)) {
        onChange(null);
      }
    }
  }, [guilds, guildId, isLoading]);

  function selectGuild(guildId: string) {
    onChange(guildId);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded bg-dark-2 relative flex items-center h-12">
        <div
          onClick={() => setOpen((prev) => !prev)}
          role="button"
          className="flex-auto"
        >
          {guild ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <img
                src={guildIconUrl(guild)}
                className="guild icon url w-8 h-8 rounded-full flex-none"
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
            <div className="text-gray-300">Select guild</div>
          )}
        </div>
        {open && (
          <div className="absolute bg-dark-2 top-14 left-0 rounded shadow-lg w-full border-2 border-dark-2 z-10">
            {guilds && guilds.length ? (
              guilds.map((g) => (
                <div
                  key={g.id}
                  className="py-2 flex space-x-2 items-center hover:bg-dark-3 rounded cursor-pointer px-3"
                  role="button"
                  onClick={() => selectGuild(g.id)}
                >
                  <img
                    src={guildIconUrl(g)}
                    alt="icon"
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="text-gray-300">{g.name}</div>
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-300">No servers found</div>
            )}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
