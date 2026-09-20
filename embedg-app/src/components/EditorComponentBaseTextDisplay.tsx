import {
  type TextDisplayNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeActions,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import EditorInput from "./EditorInput";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentBaseTextDisplay({
  id,
  title = "Text Display",
  size = "medium",
}: Props) {
  const data = useNode<TextDisplayNode>(id);
  const actions = useNodeActions(id);
  const { update } = useDocumentStore.getState();

  if (!data) return null;

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<TextDisplayNode>(id)}
      title={title}
      size={size}
      {...actions}
      extra={
        data.content ? (
          <div className="text-gray-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">{data.content}</div>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <EditorInput
          type="textarea"
          label="Content"
          maxLength={4000}
          value={data.content}
          onChange={(v) => update<TextDisplayNode>(id, { content: v })}
          className="flex-auto"
          validationPath={nodeField<TextDisplayNode>(id, "content")}
        />
      </div>
    </EditorComponentCollapsable>
  );
}
