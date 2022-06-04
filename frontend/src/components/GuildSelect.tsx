import { Fragment, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import useGuilds from "../hooks/useGuilds";
import { guildIconUrl } from "../discord";
import { GuildWire } from "../api/wire";
import useSelectedGuild from "../hooks/useSelectedGuild";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

function abbrivateName(name: string) {
  return name
    .split(" ")
    .map((s) => s.substring(0, 1))
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase();
}

interface Props {
  value: string | null;
  onChange: (newValue: string | null) => void;
}

export default function GuildSelect({ value, onChange }: Props) {
  const guilds = useGuilds();

  const selectedGuild = useMemo(
    () => guilds?.find((g) => g.id === value),
    [value, guilds]
  );

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="mt-1 relative">
          <Listbox.Button className="relative w-full bg-dark-2 rounded shadow-sm pl-3 pr-10 py-2 text-left no-ring cursor-pointer">
            {selectedGuild ? (
              <span className="flex items-center">
                {selectedGuild.icon ? (
                  <img
                    src={guildIconUrl(selectedGuild)}
                    alt=""
                    className="flex-shrink-0 h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-dark-4 flex items-center justify-center text-xs">
                    {abbrivateName(selectedGuild.name)}
                  </div>
                )}
                <span className="ml-3 block truncate">
                  {selectedGuild.name}
                </span>
              </span>
            ) : (
              <span className="flex items-center">
                <span className="block truncate text-gray-300">
                  Select a server
                </span>
              </span>
            )}
            <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <SelectorIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-dark-2 shadow-lg max-h-56 rounded-md py-1 text-base overflow-auto no-ring sm:text-sm">
              {(guilds || []).map((guild) => (
                <Listbox.Option
                  key={guild.id}
                  className={({ active }) =>
                    classNames(
                      active ? "text-white bg-blurple" : "text-gray-300",
                      "cursor-pointer select-none relative py-2 pl-3 pr-9"
                    )
                  }
                  value={guild.id}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        {guild.icon ? (
                          <img
                            src={guildIconUrl(guild)}
                            alt=""
                            className="flex-shrink-0 h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-dark-4 flex items-center justify-center text-xs">
                            {abbrivateName(guild.name)}
                          </div>
                        )}
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "ml-3 block truncate"
                          )}
                        >
                          {guild.name}
                        </span>
                      </div>

                      {selected ? (
                        <span
                          className={classNames(
                            active ? "text-white" : "text-blurple",
                            "absolute inset-y-0 right-0 flex items-center pr-4"
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
