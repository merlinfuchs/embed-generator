import { CARD } from "./editorCard";
import clsx from "clsx";
import {
  type ButtonNode,
  type NodeId,
  useNode,
  useNodeActions,
  useDocumentStoreApi,
} from "../state/document";
import { useEditorMode } from "../state/editorMode";
import { nodeField, nodeScope } from "../state/validationError";
import CheckBox from "./CheckBox";
import EditorActionSet from "./EditorActionSet";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

const buttonBorderColors = {
  1: "border-azure-500",
  2: "border-ink-500",
  3: "border-green",
  4: "border-red",
  5: "border-ink-500",
};

export default function EditorComponentButton({
  id,
  title = "Button",
  size = "medium",
}: Props) {
  const data = useNode<ButtonNode>(id);
  const actions = useNodeActions(id);
  const { update } = useDocumentStoreApi().getState();
  const linkOnly = useEditorMode() === "componentEmbed";

  if (!data) return null;

  const borderColor = buttonBorderColors[data.style];

  return (
    <div className={clsx(CARD, "border-2", borderColor)}>
      <EditorComponentCollapsable
        id={id}
        validationPathPrefix={nodeScope<ButtonNode>(id)}
        title={title}
        subtitle={data.label}
        size={size}
        {...actions}
      >
        <div className="space-y-4">
          <div className="flex space-x-3">
            <div className={clsx("flex-auto", linkOnly && "hidden")}>
              <div className="mb-1.5 flex">
                <div className="uppercase text-mist-300 text-sm font-medium">
                  Style
                </div>
              </div>
              <select
                className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
                value={data.style.toString()}
                onChange={(v) =>
                  update<ButtonNode>(id, {
                    style: parseInt(v.target.value, 10) as any,
                  })
                }
              >
                <option value="1">Blurple</option>
                <option value="2">Grey</option>
                <option value="3">Green</option>
                <option value="4">Red</option>
                <option value="5">Direct Link</option>
              </select>
            </div>
            <div className="flex-none">
              <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
                Disabled
              </div>
              <CheckBox
                label="Disabled"
                checked={data.disabled ?? false}
                onChange={(v) =>
                  update<ButtonNode>(id, {
                    disabled: v,
                  })
                }
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={data.emoji ?? undefined}
              onChange={(v) =>
                update<ButtonNode>(id, {
                  emoji: v,
                })
              }
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={data.label}
              onChange={(v) =>
                update<ButtonNode>(id, {
                  label: v,
                })
              }
              className="flex-auto"
              validationPath={nodeField<ButtonNode>(id, "label")}
            />
          </div>
          {linkOnly || data.style === 5 ? (
            <EditorInput
              label="URL"
              type="url"
              value={data.url ?? ""}
              onChange={(v) =>
                update<ButtonNode>(id, {
                  url: v,
                })
              }
              validationPath={nodeField<ButtonNode>(id, "url")}
            />
          ) : (
            <EditorActionSet setId={data.action_set_id} />
          )}
        </div>
      </EditorComponentCollapsable>
    </div>
  );
}
