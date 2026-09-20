import clsx from "clsx";
import { NESTED_CARD, PADDED } from "./editorCard";
import { useMemo } from "react";
import {
  type ContainerNode,
  type NodeId,
  useChildIds,
  useDocumentStore,
  useNode,
  useNodeActions,
  slotLimit,
} from "../state/document";
import { nodeField, nodeScope, slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import { colorIntToHex } from "../util/discord";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import ColorPicker from "./ColorPicker";
import EditorComponentAddDropdown from "./EditorComponentAddDropdown";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentEntry from "./EditorComponentEntry";
import ValidationError from "./ValidationError";

interface Props {
  id: NodeId;
  title?: string;
}

export default function EditorComponentContainer({
  id,
  title = "Container",
}: Props) {
  const data = useNode<ContainerNode>(id);
  const childIds = useChildIds(id, "components");
  const actions = useNodeActions(id);
  const { update, removeChildren } = useDocumentStore.getState();

  const hexColor = useMemo(
    () =>
      data?.accent_color !== undefined
        ? colorIntToHex(data.accent_color)
        : "#1f2225",
    [data?.accent_color],
  );

  if (!data) return null;

  return (
    <div
      className={clsx(PADDED, "border-l-4")}
      style={{ borderColor: hexColor }}
    >
      <EditorComponentCollapsable
        id={id}
        validationPathPrefix={nodeScope<ContainerNode>(id)}
        title={title}
        size="large"
        {...actions}
        subtitle="Text"
      >
        <div className="space-y-4 mb-4">
          <div className="flex space-x-3">
            <div className="flex-auto">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Color
              </div>
              <ColorPicker
                value={data.accent_color}
                onChange={(v) => update<ContainerNode>(id, { accent_color: v })}
              />
              <ValidationError
                target={nodeField<ContainerNode>(id, "accent_color")}
              />
            </div>
            <div className="flex-none">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Spoiler
              </div>
              <CheckBox
                checked={data.spoiler ?? false}
                onChange={(v) => update<ContainerNode>(id, { spoiler: v })}
              />
            </div>
          </div>
        </div>

        <Collapsable
          id={`${id}.components`}
          validationPathPrefix={slotScope(id, "components")}
          title="Components"
          extra={
            <div className="text-sm italic font-light text-gray-400">
              {childIds.length} / {slotLimit("container", "components")}
            </div>
          }
        >
          <AutoAnimate>
            {childIds.map((childId) => (
              <div className={NESTED_CARD} key={childId}>
                <EditorComponentEntry id={childId} />
              </div>
            ))}
            <div>
              <div className="flex space-x-3 mt-3 items-center">
                <EditorComponentAddDropdown
                  context="container"
                  parentId={id}
                  disabled={
                    childIds.length >= slotLimit("container", "components")
                  }
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                  onClick={() => removeChildren(id, "components")}
                >
                  Clear Components
                </button>
              </div>
            </div>
          </AutoAnimate>
        </Collapsable>
      </EditorComponentCollapsable>
    </div>
  );
}
