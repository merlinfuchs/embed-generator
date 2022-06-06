import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/outline";
import { parseISO } from "date-fns";
import { Fragment, useEffect, useMemo, useState } from "react";
import { HistoryMessageWire } from "../api/wire";
import useAPIClient from "../hooks/useApiClient";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface Props {
  channelId: string | null;
  value: string | null;
  onChange: (newValue: string | null) => void;
}

export default function HistoryMessageSelect({
  channelId,
  value,
  onChange,
}: Props) {
  const [history, setHistory] = useState<HistoryMessageWire[]>([]);

  const client = useAPIClient();

  useEffect(() => {
    if (channelId && client.token) {
      client.getChannelHistory(channelId).then((resp) => {
        if (resp.success) {
          setHistory(
            resp.data.sort((a, b) =>
              parseISO(a.created_at) < parseISO(b.created_at) ? 1 : -1
            )
          );
        } else {
          setHistory([]);
        }
      });
    } else {
      setHistory([]);
    }
  }, [channelId]);

  const selectedMessage = useMemo(
    () => history.find((m) => m.id === value),
    [history, value]
  );

  function formatCreatedAt(value: string) {
    return parseISO(value).toLocaleString();
  }

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="mt-1 relative">
          <Listbox.Button className="relative w-full bg-dark-2 rounded shadow-sm pl-3 pr-8 py-2 text-left text-base no-ring cursor-pointer">
            {selectedMessage ? (
              <span className="flex items-center">
                <span className="block truncate">
                  {formatCreatedAt(selectedMessage.created_at)}{" "}
                  <span className="text-gray-400">{selectedMessage.id}</span>
                </span>
              </span>
            ) : (
              <span className="flex items-center">
                <span className="block truncate text-gray-300">
                  Select a message
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
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-dark-2 shadow-lg max-h-56 rounded-md py-1 text-sm overflow-auto no-ring sm:text-sm">
              {history.map((msg) => (
                <Listbox.Option
                  key={msg.id}
                  className={({ active }) =>
                    classNames(
                      active ? "text-white bg-blurple" : "text-gray-300",
                      "cursor-pointer select-none relative py-2 pl-3 pr-8"
                    )
                  }
                  value={msg.id}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {formatCreatedAt(msg.created_at)}{" "}
                          <span className="text-gray-400">{msg.id}</span>
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
