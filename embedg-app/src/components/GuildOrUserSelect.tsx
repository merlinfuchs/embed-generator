import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useGuildsQuery, useUserQuery } from "../api/queries";
import { guildIconUrl, userAvatarUrl } from "../discord/cdn";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";

interface Props {
  value: string | null;
  onChange: (guildID: string | null) => void;
}

export default function GuildOrUserSelect({ value, onChange }: Props) {
  const { data: user } = useUserQuery();
  const { data: guilds } = useGuildsQuery();

  const guild = useMemo(
    () => guilds && guilds.success && guilds.data.find((g) => g.id === value),
    [guilds, value],
  );

  useEffect(() => {
    if (!value) {
      onChange("user");
    }
  }, [value, onChange]);

  function selectValue(value: string) {
    onChange(value);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded-lg bg-ink-900 relative flex items-center h-12 select-none">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto text-left"
        >
          {value === "user" && user?.success ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <img
                alt=""
                src={userAvatarUrl(user.data)}
                className="guild icon url w-8 h-8 rounded-full flex-none"
              />
              <div className="text-lg text-mist-300 flex-auto truncate">
                {user.data.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : guild ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <img
                alt=""
                src={guildIconUrl(guild)}
                className="guild icon url w-8 h-8 rounded-full flex-none"
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
            <div className="text-mist-300">Select guild</div>
          )}
        </button>
        {open && (
          <SelectDropdown>
            {user?.success && (
              <button
                type="button"
                className="py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left"
                onClick={() => selectValue("user")}
              >
                <img
                  src={userAvatarUrl(user.data)}
                  alt="icon"
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div className="text-mist-300 leading-tight">
                    {user.data.name}
                  </div>
                  <div className="text-mist-400 text-xs leading-tight">
                    your personal account
                  </div>
                </div>
              </button>
            )}
            {guilds?.success && guilds.data.length ? (
              guilds.data.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  className="py-2 flex space-x-2 items-center rounded-lg px-3 hover:bg-ink-700 cursor-pointer w-full text-left"
                  onClick={() => selectValue(g.id)}
                >
                  <img
                    src={guildIconUrl(g)}
                    alt="icon"
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="text-mist-300">{g.name}</div>
                </button>
              ))
            ) : (
              <div className="p-2 text-mist-300">No servers found</div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
