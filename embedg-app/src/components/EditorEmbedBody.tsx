import {
  type EmbedNode,
  type FieldPath,
  type NodeId,
  useNode,
  useDocumentStoreApi,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import Collapsable from "./Collapsable";
import ColorPicker from "./ColorPicker";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

const BODY_FIELDS: FieldPath<EmbedNode>[] = [
  "title",
  "description",
  "url",
  "color",
];

interface Props {
  id: NodeId;
}

export default function EditorEmbedBody({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { update } = useDocumentStoreApi().getState();

  if (!embed) return null;

  return (
    <Collapsable
      id={`embeds.${id}.content`}
      title="Body"
      validationPathPrefix={nodeScope<EmbedNode>(id, BODY_FIELDS)}
    >
      <div className="space-y-3">
        <EditorInput
          label="Title"
          value={embed.title || ""}
          onChange={(v) => update<EmbedNode>(id, { title: v || undefined })}
          maxLength={256}
          validationPath={nodeField<EmbedNode>(id, "title")}
        />
        <EditorInput
          type="textarea"
          label="Description"
          value={embed.description || ""}
          onChange={(v) =>
            update<EmbedNode>(id, { description: v || undefined })
          }
          maxLength={4096}
          validationPath={nodeField<EmbedNode>(id, "description")}
          controls={true}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="URL"
            value={embed.url || ""}
            onChange={(v) => update<EmbedNode>(id, { url: v || undefined })}
            className="w-full"
            validationPath={nodeField<EmbedNode>(id, "url")}
          />
          <div>
            <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
              Color
            </div>
            <ColorPicker
              value={embed.color}
              onChange={(v) => update<EmbedNode>(id, { color: v })}
            />
            <ValidationError target={nodeField<EmbedNode>(id, "color")} />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}
