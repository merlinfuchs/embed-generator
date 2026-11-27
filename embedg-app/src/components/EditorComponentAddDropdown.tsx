import { ChevronUpIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import {
  type NewNode,
  type NodeId,
  useComponentsV2Enabled,
  useDocumentStoreApi,
} from "../state/document";
import { useState } from "react";
import { useEditorCapabilities } from "../state/editorCapabilities";
import ClickOutsideHandler from "./ClickOutsideHandler";
import { ENTITY_SELECT_NAMES } from "../discord/entitySelect";

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

  const { insert } = useDocumentStoreApi().getState();

  function addComponent(node: NewNode) {
    insert(parentId, "components", "end", node);
    setOpen(false);
  }

  const componentsV2Enabled = useComponentsV2Enabled();
  const { componentTypes: allowedTypes, interactive } = useEditorCapabilities();

  /** A select menu fills an action row of its own. */
  function addSelectRow(node: NewNode) {
    const rowId = insert(parentId, "components", "end", { type: "actionRow" });
    insert(rowId, "components", "end", node);
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

  const componentTypes = [
    {
      label: "Button Row",
      type: 1,
      node: { type: "actionRow" } as NewNode,
    },
    {
      label: "Select Menu",
      type: 3,
      interactiveOnly: true,
      handler: () => addSelectRow({ type: "selectMenu" }),
    },
    ...([5, 6, 7, 8] as const).map((selectType) => ({
      label: ENTITY_SELECT_NAMES[selectType],
      type: selectType,
      interactiveOnly: true,
      handler: () => addSelectRow({ type: "entitySelect", selectType }),
    })),
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
      node: { type: "textDisplay", content: "" } as NewNode,
    },
    {
      label: "Media Gallery",
      type: 12,
      v2Only: true,
      node: { type: "mediaGallery" } as NewNode,
    },
    {
      label: "File",
      type: 13,
      v2Only: true,
      node: { type: "file", file: { url: "" } } as NewNode,
    },
    {
      label: "Separator",
      type: 14,
      v2Only: true,
      node: { type: "separator", spacing: 1, divider: true } as NewNode,
    },
    {
      label: "Container",
      type: 17,
      v2Only: true,
      rootOnly: true,
      node: { type: "container" } as NewNode,
    },
  ].filter((c) => {
    if (c.v2Only && !componentsV2Enabled) return false;
    if (c.rootOnly && context !== "root") return false;
    if (allowedTypes && !allowedTypes.includes(c.type)) return false;
    if ("interactiveOnly" in c && !interactive) return false;

    return true;
  });

  // Fluxer has no components, so there is nothing to offer.
  if (componentTypes.length === 0) return null;

  return (
    <ClickOutsideHandler onClickOutside={() => setOpen(false)}>
      <div className="relative">
        <button
          className={clsx(
            "rounded-lg text-white flex items-center space-x-2 whitespace-nowrap",
            size === "large" ? "py-3 px-3" : "py-2 px-2",
            disabled
              ? "bg-ink-700 cursor-not-allowed"
              : "bg-azure-500 hover:bg-azure-400",
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
          <div className="absolute bg-ink-900 bottom-full mb-1 left-0 rounded-lg shadow-lg border-2 border-white/10 z-10 text-white max-h-96 overflow-y-auto whitespace-nowrap">
            {componentTypes.map((componentType) => (
              <button
                key={componentType.type}
                type="button"
                aria-label={componentType.label}
                className="px-3 py-2 rounded-lg text-white hover:bg-ink-700 w-full text-left flex items-center gap-2"
                onClick={() => {
                  if (componentType.handler) {
                    componentType.handler();
                  } else if (componentType.node) {
                    addComponent(componentType.node);
                  }
                }}
              >
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
