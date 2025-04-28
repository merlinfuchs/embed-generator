import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { MessageComponent } from "../discord/schema";

interface Props {
  context: "root" | "container";
  v2Enabled: boolean;
  addComponent: (component: MessageComponent) => void;
  disabled?: boolean;
}

export default function EditorComponentAddDropdown({
  context,
  v2Enabled,
  addComponent,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  function addButtonRow() {
    setOpen(false);
    addComponent({
      id: getUniqueId(),
      type: 1,
      components: [],
    });
  }

  function addSelectMenuRow() {
    setOpen(false);
    addComponent({
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
    addComponent({
      id: getUniqueId(),
      type: 9,
      components: [],
      accessory: {
        id: getUniqueId(),
        type: 11,
        media: {
          url: "",
        },
      },
    });
  }

  function addTextDisplay() {
    setOpen(false);
    addComponent({
      id: getUniqueId(),
      type: 10,
      content: "",
    });
  }

  function addMediaGallery() {
    setOpen(false);
    addComponent({
      id: getUniqueId(),
      type: 12,
      items: [],
    });
  }

  function addSeparator() {
    setOpen(false);
    addComponent({
      id: getUniqueId(),
      type: 14,
      spacing: 1,
      divider: true,
    });
  }

  function addFile() {
    setOpen(false);
    addComponent({
      id: getUniqueId(),
      type: 13,
      file: {
        url: "",
      },
    });
  }

  function addContainer() {
    setOpen(false);
    addComponent({
      id: getUniqueId(),
      type: 17,
      components: [],
    });
  }

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="relative">
        <button
          className={clsx(
            "px-3 py-2.5 rounded text-white flex items-center space-x-2",
            disabled
              ? "bg-dark-3 cursor-not-allowed"
              : "bg-blurple hover:bg-blurple-dark"
          )}
          onClick={() => {
            if (disabled) return;
            setOpen(!open);
          }}
          disabled={disabled}
        >
          <div>Add Component</div>
          <ChevronUpIcon className="w-5 h-5" />
        </button>
        {open && (
          <div className="absolute bg-dark-2 bottom-full mb-1 left-0 rounded shadow-lg border-2 border-dark-2 z-10 text-white">
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
            {v2Enabled && (
              <>
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
                <button
                  className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
                  onClick={addFile}
                >
                  Add File
                </button>
                <button
                  className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
                  onClick={addSeparator}
                >
                  Add Separator
                </button>
                <button
                  className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left"
                  onClick={addContainer}
                >
                  Add Container
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
