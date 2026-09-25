import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { listTimezones } from "../util/time";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";

interface Props {
  value: string;
  onChange: (timezone: string) => void;
}

export default function TimezoneSelect({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, innerSetOpen] = useState(false);
  const [query, setQuery] = useState("");

  function setOpen(open: boolean) {
    innerSetOpen(open);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }

  function select(timezone: string) {
    onChange(timezone);
    setOpen(false);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().replaceAll(" ", "_");
    return listTimezones().filter((tz) => tz.toLowerCase().includes(q));
  }, [query]);

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
            placeholder={value}
            className={clsx(
              "text-mist-300 w-full bg-ink-900 focus:outline-none",
              !open && "hidden",
            )}
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={clsx(
              "flex items-center space-x-2 w-full text-left",
              open && "hidden",
            )}
          >
            <div className="text-mist-300 flex-auto truncate">{value}</div>
            <ChevronDownIcon className="text-white w-5 h-5 flex-none" />
          </button>
        </div>
        {open && (
          <SelectDropdown>
            {filtered.length ? (
              filtered.map((tz) => (
                <button
                  type="button"
                  key={tz}
                  className="py-2 hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left text-mist-300"
                  onClick={() => select(tz)}
                >
                  {tz}
                </button>
              ))
            ) : (
              <div className="text-mist-300 p-2">No timezones found</div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
