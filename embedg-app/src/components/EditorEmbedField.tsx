import {
  type EmbedFieldNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeActions,
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
  const { index } = useNodeIndex(id);
  const actions = useNodeActions(id);

  const { update } = useDocumentStore.getState();

  if (!field) return null;

  return (
    <EditorComponentCollapsable
      id={`embeds.fields.${id}`}
      validationPathPrefix={nodeScope<EmbedFieldNode>(id)}
      title={`Field ${index + 1}`}
      className="border-2 border-white/10 rounded-xl p-3"
      subtitle={field.name}
      {...actions}
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
            <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
              Inline
            </div>
            <CheckBox
              label="Inline"
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
