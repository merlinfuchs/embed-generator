import {
  type EmbedFieldNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeIndex,
} from "../state/document";
import CheckBox from "./CheckBox";
import { nodeField, nodeScope } from "../state/validationError";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

export default function EditorEmbedField({ id }: Props) {
  const field = useNode<EmbedFieldNode>(id);
  const { index, count } = useNodeIndex(id);

  const { move, duplicate, remove, update } = useDocumentStore.getState();

  if (!field) return null;

  return (
    <EditorComponentCollapsable
      id={`embeds.fields.${id}`}
      validationPathPrefix={nodeScope<EmbedFieldNode>(id)}
      title={`Field ${index + 1}`}
      className="border-2 border-dark-6 rounded-md p-3"
      extra={
        field.name && (
          <div className="text-gray-500 truncate flex space-x-2 pl-2">
            <div>-</div>
            <div className="truncate">{field.name}</div>
          </div>
        )
      }
      moveUp={index > 0 ? () => move(id, -1) : undefined}
      moveDown={index < count - 1 ? () => move(id, 1) : undefined}
      duplicate={count < 25 ? () => duplicate(id) : undefined}
      remove={() => remove(id)}
    >
      <div className="space-y-3">
        <div className="flex space-x-3">
          <EditorInput
            label="Name"
            value={field.name}
            onChange={(v) => update<EmbedFieldNode>(id, { name: v })}
            maxLength={256}
            className="w-full"
            validationPath={nodeField<EmbedFieldNode>(id, "name")}
          />
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Inline
            </div>
            <CheckBox
              checked={field.inline ?? false}
              height={10}
              onChange={(v) => update<EmbedFieldNode>(id, { inline: v })}
            />
          </div>
        </div>
        <EditorInput
          type="textarea"
          label="Value"
          value={field.value}
          onChange={(v) => update<EmbedFieldNode>(id, { value: v })}
          maxLength={1024}
          validationPath={nodeField<EmbedFieldNode>(id, "value")}
          controls={true}
        />
      </div>
    </EditorComponentCollapsable>
  );
}
