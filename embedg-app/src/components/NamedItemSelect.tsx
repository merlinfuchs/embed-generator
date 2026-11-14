import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import SelectDropdown from "./SelectDropdown";

interface Props {
  guildId: string | null;
  // Undefined while the items are loading. An empty list once loading failed.
  items: { id: string; name: string }[] | undefined;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder: string;
  emptyText: string;
}

/** Picks one of the server's saved messages, forms or the like by name. */
export default function NamedItemSelect({
  guildId,
  items,
  value,
  onChange,
  placeholder,
  emptyText,
}: Props) {
  const item = useMemo(
    () => items?.find((i) => i.id === value),
    [items, value],
  );

  // A selected item that doesn't exist anymore is cleared. Keyed on whether the items loaded, not
  // on the list, which callers may build fresh on every render.
  const loaded = items !== undefined;
  useEffect(() => {
    if (loaded && !item) onChange(null);
  }, [loaded, item]);

  const [open, setOpen] = useState(false);

  function select(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="px-3 rounded-lg bg-ink-900 relative flex items-center h-10 select-none">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex-auto text-left"
        >
          {!guildId ? (
            <div className="text-mist-300">Select server at the top</div>
          ) : item ? (
            <div className="flex items-center space-x-2 cursor-pointer w-full">
              <div></div>
              <div className="text-lg text-mist-300 flex-auto truncate">
                {item.name}
              </div>
              <ChevronDownIcon
                className={clsx(
                  "text-white w-5 h-5 flex-none transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          ) : (
            <div className="text-mist-300">{placeholder}</div>
          )}
        </button>
        {open && (
          <SelectDropdown>
            {items && items.length > 0 ? (
              items.map((i) => (
                <button
                  type="button"
                  key={i.id}
                  className="py-2 flex space-x-2 items-center hover:bg-ink-700 rounded-lg cursor-pointer px-3 w-full text-left"
                  onClick={() => select(i.id)}
                >
                  <div></div>
                  <div className="text-mist-300">{i.name}</div>
                </button>
              ))
            ) : (
              <div className="text-mist-300 p-2">{emptyText}</div>
            )}
          </SelectDropdown>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
