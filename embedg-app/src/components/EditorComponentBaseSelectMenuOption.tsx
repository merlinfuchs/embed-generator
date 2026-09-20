import {
  type SelectOptionNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeActions,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";
import EditorComponentActions from "./EditorActionSet";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";

interface Props {
  id: NodeId;
  title?: string;
}

export default function EditorComponentBaseSelectMenuOption({
  id,
  title = "Option",
}: Props) {
  const data = useNode<SelectOptionNode>(id);
  const actions = useNodeActions(id, 25);
  const { update } = useDocumentStore.getState();

  if (!data) return null;

  return (
    <EditorComponentCollapsable
      id={id}
      className="p-3 border-2 border-dark-6 rounded-md"
      validationPathPrefix={nodeScope<SelectOptionNode>(id)}
      title={title}
      extra={
        data.label && (
          <div className="text-gray-500 truncate flex space-x-2 pl-2">
            <div>-</div>
            <div className="truncate">{data.label}</div>
          </div>
        )
      }
      {...actions}
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <EditorComponentEmojiSelect
            emoji={data.emoji ?? undefined}
            onChange={(v) => update<SelectOptionNode>(id, { emoji: v })}
          />
          <EditorInput
            label="Label"
            maxLength={80}
            value={data.label}
            onChange={(v) => update<SelectOptionNode>(id, { label: v })}
            className="flex-auto"
            validationPath={nodeField<SelectOptionNode>(id, "label")}
          />
        </div>
        <EditorInput
          label="Description"
          maxLength={100}
          value={data.description || ""}
          onChange={(v) =>
            update<SelectOptionNode>(id, { description: v || undefined })
          }
          className="flex-auto"
          validationPath={nodeField<SelectOptionNode>(id, "description")}
        />
        <EditorComponentActions setId={data.action_set_id} />
      </div>
    </EditorComponentCollapsable>
  );
}
