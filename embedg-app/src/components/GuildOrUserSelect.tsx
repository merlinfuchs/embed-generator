import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useGuildsQuery, useUserQuery } from "../api/queries";
import { guildIconUrl, userAvatarUrl } from "../discord/cdn";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  value: string | null;
  onChange: (guildID: string | null) => void;
}

export default function GuildOrUserSelect({ value, onChange }: Props) {
  const { data: user } = useUserQuery();
  const { data: guilds, isLoading } = useGuildsQuery();

  const guild = useMemo(
    () => guilds && guilds.success && guilds.data.find((g) => g.id === value),
    [guilds, value]
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

  useEffect(() => {
    if (guilds?.success) {
      guilds.data.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [guilds]);

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded bg-dark-2 relative flex items-center h-12 select-none">
        <div
          onClick={() => setOpen((prev) => !prev)}
          role="button"
          className="flex-auto"
        >
          {value === "user" && user?.success ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <img
                src={userAvatarUrl(user.data)}
                className="guild icon url w-8 h-8 rounded-full flex-none"
              />
              <div className="text-lg text-gray-300 flex-auto truncate">
                {user.data.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          ) : guild ? (
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
            {user?.success && (
              <div
                className="py-2 flex space-x-2 items-center hover:bg-dark-3 rounded cursor-pointer px-3"
                role="button"
                onClick={() => selectValue("user")}
              >
                <img
                  src={userAvatarUrl(user.data)}
                  alt="icon"
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div className="text-gray-300 leading-tight">
                    {user.data.name}
                  </div>
                  <div className="text-gray-400 text-xs leading-tight">
                    your personal account
                  </div>
                </div>
              </div>
            )}
            {guilds?.success && guilds.data.length ? (
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
                    selectValue(g.id)
                  }
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
