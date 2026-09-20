import {
  type EmbedNode,
  type NodeId,
  useDocumentStore,
  useNode,
} from "../state/document";
import Collapsable from "./Collapsable";
import ColorPicker from "./ColorPicker";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

const BODY_FIELDS = ["title", "description", "url", "color"];

interface Props {
  id: NodeId;
}

export default function EditorEmbedBody({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { update } = useDocumentStore.getState();

  if (!embed) return null;

  return (
    <Collapsable
      id={`embeds.${id}.content`}
      title="Body"
      validationPathPrefix={{ nodeId: id, fields: BODY_FIELDS }}
    >
      <div className="space-y-3">
        <EditorInput
          label="Title"
          value={embed.title || ""}
          onChange={(v) => update<EmbedNode>(id, { title: v || undefined })}
          maxLength={256}
          validationPath={{ nodeId: id, field: "title" }}
        />
        <EditorInput
          type="textarea"
          label="Description"
          value={embed.description || ""}
          onChange={(v) =>
            update<EmbedNode>(id, { description: v || undefined })
          }
          maxLength={4096}
          validationPath={{ nodeId: id, field: "description" }}
          controls={true}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="URL"
            value={embed.url || ""}
            onChange={(v) => update<EmbedNode>(id, { url: v || undefined })}
            className="w-full"
            validationPath={{ nodeId: id, field: "url" }}
          />
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Color
            </div>
            <ColorPicker
              value={embed.color}
              onChange={(v) => update<EmbedNode>(id, { color: v })}
            />
            <ValidationError target={{ nodeId: id, field: "color" }} />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}
