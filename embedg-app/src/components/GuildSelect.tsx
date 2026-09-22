import { ChevronDownIcon, PlusCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useGuildsQuery } from "../api/queries";
import { guildIconUrl } from "../discord/cdn";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";
import { useToasts } from "../util/toasts";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Props {
  guildId: string | null;
  onChange: (guildID: string | null) => void;
}

export default function GuildSelect({ guildId, onChange }: Props) {
  const { data: guilds, isPending } = useGuildsQuery();
  const toast = useToasts((state) => state.create);

  useEffect(() => {
    if (guilds?.success === false) {
      toast({
        title: "Failed to load guilds",
        message: guilds.error.message,
        type: "error",
      });
    }
  }, [guilds]);

  const guild = useMemo(
    () => guilds?.success && guilds.data.find((g) => g.id === guildId),
    [guilds, guildId],
  );

  useEffect(() => {
    if (!guildId) {
      if (guilds?.success) {
        const defaultGuild = guilds.data[0];
        if (defaultGuild) {
          onChange(defaultGuild.id);
        }
      }
    } else if (!isPending) {
      if (!guilds?.success || !guilds.data.find((g) => g.id === guildId)) {
        onChange(null);
      }
    }
  }, [guilds, guildId, isPending]);

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
      <div className="px-3 rounded-lg bg-ink-900 relative flex items-center h-10 select-none">
        <div
          onClick={() => setOpen((prev) => !prev)}
          role="button"
          className="flex-auto"
        >
          {!guilds ? (
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="h-5 w-5 text-mist-300 animate-spin" />
              <div className="text-mist-400">Loading...</div>
            </div>
          ) : guild ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <img
                alt=""
                src={guildIconUrl(guild)}
                className="guild icon url w-7 h-7 rounded-full flex-none"
              />
              <div className="text-lg text-mist-300 flex-auto truncate">
                {guild.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : (
            <div className="text-mist-300">Select server</div>
          )}
        </div>
        {open && (
          <SelectDropdown>
            {guilds?.success &&
              guilds.data.map((g) => (
                <div
                  key={g.id}
                  className="py-2 flex space-x-2 items-center rounded-lg px-3 hover:bg-ink-700 cursor-pointer"
                  role="button"
                  onClick={() => selectGuild(g.id)}
                >
                  <img
                    src={guildIconUrl(g)}
                    alt="icon"
                    className="h-7 w-7 rounded-full"
                  />
                  <div className="text-mist-300">{g.name}</div>
                </div>
              ))}
            <a
              className="py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3"
              role="button"
              href="/invite"
            >
              <PlusCircleIcon className="w-7 h-7 text-mist-300" />
              <div className="text-mist-300">Invite the bot</div>
            </a>
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
