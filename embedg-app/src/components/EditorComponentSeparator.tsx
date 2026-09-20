import {
  type SeparatorNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeActions,
} from "../state/document";
import { nodeScope } from "../state/validationError";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentSeparator({
  id,
  title = "Separator",
  size = "medium",
}: Props) {
  const data = useNode<SeparatorNode>(id);
  const actions = useNodeActions(id);
  const { update } = useDocumentStore.getState();

  if (!data) return null;

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<SeparatorNode>(id)}
      title={title}
      {...actions}
      size={size}
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <div className="flex-auto">
            <div className="mb-1.5 flex">
              <div className="uppercase text-mist-300 text-sm font-medium">
                Spacing
              </div>
            </div>
            <select
              aria-label="Spacing"
              className="bg-ink-900 rounded-lg p-2 w-full font-light cursor-pointer text-white"
              value={data.spacing.toString()}
              onChange={(v) =>
                update<SeparatorNode>(id, {
                  spacing: parseInt(v.target.value, 10) as any,
                })
              }
            >
              <option value="1">Small</option>
              <option value="2">Large</option>
            </select>
          </div>
          <div className="flex-none">
            <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
              Divider
            </div>
            <CheckBox
              label="Divider"
              checked={data.divider ?? false}
              onChange={(v) =>
                update<SeparatorNode>(id, {
                  divider: v,
                })
              }
            />
          </div>
        </div>
      </div>
    </EditorComponentCollapsable>
  );
}
