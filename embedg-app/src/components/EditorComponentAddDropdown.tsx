import { ChevronUpIcon, StarIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { MessageComponent } from "../discord/schema";
import { usePremiumGuildFeatures } from "../util/premium";
import { useNavigate } from "react-router-dom";

interface Props {
  context: "root" | "container";
  addComponent: (component: MessageComponent) => void;
  disabled?: boolean;
  size?: "small" | "large";
}

export default function EditorComponentAddDropdown({
  context,
  addComponent,
  disabled,
  size = "small",
}: Props) {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const componentsV2Enabled = useCurrentMessageStore((state) =>
    state.getComponentsV2Enabled()
  );

  const features = usePremiumGuildFeatures();
  const allowedComponentTypes = features?.component_types ?? [];

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

  const componentTypes = [
    {
      label: "Button Row",
      type: 1,
      handler: addButtonRow,
    },
    {
      label: "Select Menu",
      type: 3,
      handler: addSelectMenuRow,
    },
    {
      label: "Section",
      type: 9,
      v2Only: true,
      handler: addSection,
    },
    {
      label: "Text Display",
      type: 10,
      v2Only: true,
      handler: addTextDisplay,
    },
    {
      label: "Media Gallery",
      type: 12,
      v2Only: true,
      handler: addMediaGallery,
    },
    {
      label: "File",
      type: 13,
      v2Only: true,
      handler: addFile,
    },
    {
      label: "Separator",
      type: 14,
      v2Only: true,
      handler: addSeparator,
    },
    {
      label: "Container",
      type: 17,
      v2Only: true,
      rootOnly: true,
      handler: addContainer,
    },
  ].filter((c) => {
    if (c.v2Only && !componentsV2Enabled) return false;
    if (c.rootOnly && context !== "root") return false;

    return true;
  });

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="relative">
        <button
          className={clsx(
            "rounded text-white flex items-center space-x-2",
            size === "large" ? "py-3 px-3" : "py-2 px-2",
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
            {componentTypes.map((componentType) => (
              <button
                key={componentType.type}
                className="px-3 py-2 rounded text-white hover:bg-dark-3 w-full text-left flex items-center gap-2"
                onClick={() => {
                  if (allowedComponentTypes.includes(componentType.type)) {
                    componentType.handler();
                  } else {
                    navigate("/premium");
                  }
                }}
              >
                {!allowedComponentTypes.includes(componentType.type) && (
                  <div className="text-yellow">
                    <StarIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  Add {componentType.label}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ClickOutsideHandler>
  );
}
