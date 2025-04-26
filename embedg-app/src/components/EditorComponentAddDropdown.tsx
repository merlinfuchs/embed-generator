import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";

export default function EditorComponentAddDropdown() {
  const components = useCurrentMessageStore((state) => state.components);
  const addRootComponent = useCurrentMessageStore(
    (state) => state.addRootComponent
  );

  const [open, setOpen] = useState(false);

  function addButtonRow() {
    setOpen(false);
    addRootComponent({
      id: getUniqueId(),
      type: 1,
      components: [],
    });
  }

  function addSelectMenuRow() {
    setOpen(false);
    addRootComponent({
      id: getUniqueId(),
      type: 1,
      components: [
        {
          id: getUniqueId(),
          type: 3,
          options: [],
        },
      ],
    });
  }

  function addSection() {
    setOpen(false);
    addRootComponent({
      id: getUniqueId(),
      type: 9,
      components: [],
      accessory: {
        id: getUniqueId(),
        type: 2,
        label: "test",
        action_set_id: getUniqueId().toString(),
        disabled: false,
        style: 1,
        emoji: null,
      },
    });
  }

  function addTextDisplay() {
    setOpen(false);
    addRootComponent({
      id: getUniqueId(),
      type: 10,
      content: "",
    });
  }

  function addMediaGallery() {
    setOpen(false);
    addRootComponent({
      id: getUniqueId(),
      type: 12,
      items: [],
    });
  }

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="relative">
        <button
          className={clsx(
            "px-3 py-2.5 rounded text-white flex items-center space-x-2",
            components.length < 5
              ? "bg-blurple hover:bg-blurple-dark"
              : "bg-dark-3 cursor-not-allowed"
          )}
          onClick={() => {
            if (components.length >= 5) return;
            setOpen(!open);
          }}
        >
          <div>Add Component</div>
          <ChevronDownIcon className="w-5 h-5" />
        </button>
        {open && (
          <div className="absolute bg-dark-2 top-full mt-1 left-0 rounded shadow-lg border-2 border-dark-2 z-10 text-white">
            <button
              className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
              onClick={addButtonRow}
            >
              Add Button Row
            </button>
            <button
              className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
              onClick={addSelectMenuRow}
            >
              Add Select Menu
            </button>
            <button
              className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
              onClick={addSection}
            >
              Add Section
            </button>
            <button
              className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
              onClick={addTextDisplay}
            >
              Add Text Display
            </button>
            <button
              className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
              onClick={addMediaGallery}
            >
              Add Media Gallery
            </button>
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
