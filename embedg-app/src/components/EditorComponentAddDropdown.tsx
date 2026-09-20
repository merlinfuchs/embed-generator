import { ChevronUpIcon, StarIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { type NodeId, useDocumentStore } from "../state/document";
import { useCurrentMessageStore } from "../state/message";
import { useState } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { usePremiumGuildFeatures } from "../util/premium";
import { useNavigate } from "react-router-dom";

interface Props {
  context: "root" | "container";
  parentId: NodeId;
  disabled?: boolean;
  size?: "small" | "large";
}

export default function EditorComponentAddDropdown({
  context,
  parentId,
  disabled,
  size = "small",
}: Props) {
  const [open, setOpen] = useState(false);

  const { insert } = useDocumentStore.getState();

  function addComponent(node: Parameters<typeof insert>[3]) {
    setOpen(false);
    insert(parentId, "components", "end", node);
  }

  const navigate = useNavigate();

  const componentsV2Enabled = useCurrentMessageStore((state) =>
    state.getComponentsV2Enabled(),
  );

  const features = usePremiumGuildFeatures();
  const allowedComponentTypes = features?.component_types ?? [];

  function addButtonRow() {
    addComponent({ type: "actionRow" });
  }

  function addSelectMenuRow() {
    const rowId = insert(parentId, "components", "end", { type: "actionRow" });
    insert(rowId, "components", "end", { type: "selectMenu" });
    setOpen(false);
  }

  function addSection() {
    const sectionId = insert(parentId, "components", "end", {
      type: "section",
    });
    insert(sectionId, "accessory", "end", {
      type: "thumbnail",
      media: { url: "" },
    });
    setOpen(false);
  }

  function addTextDisplay() {
    addComponent({ type: "textDisplay", content: "" });
  }

  function addMediaGallery() {
    addComponent({ type: "mediaGallery" });
  }

  function addSeparator() {
    addComponent({ type: "separator", spacing: 1, divider: true });
  }

  function addFile() {
    addComponent({ type: "file", file: { url: "" } });
  }

  function addContainer() {
    addComponent({ type: "container" });
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
              : "bg-blurple hover:bg-blurple-dark",
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
