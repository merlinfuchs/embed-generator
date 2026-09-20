import {
  type EmbedNode,
  type NodeId,
  useDocumentStore,
  useNode,
} from "../state/document";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

const IMAGE_FIELDS = ["image", "thumbnail"];

interface Props {
  id: NodeId;
}

export default function EditorEmbedImages({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { update } = useDocumentStore.getState();

  if (!embed) return null;

  return (
    <Collapsable
      title="Images"
      id={`embeds.${id}.images`}
      validationPathPrefix={{ nodeId: id, fields: IMAGE_FIELDS }}
    >
      <div className="space-y-3">
        <EditorInput
          label="Image URL"
          type="url"
          value={embed.image?.url || ""}
          onChange={(v) =>
            update<EmbedNode>(id, { image: v ? { url: v } : undefined })
          }
          validationPath={{ nodeId: id, field: "image.url" }}
          imageUpload={true}
        />
        <EditorInput
          label="Thumbnail URL"
          type="url"
          value={embed.thumbnail?.url || ""}
          onChange={(v) =>
            update<EmbedNode>(id, { thumbnail: v ? { url: v } : undefined })
          }
          validationPath={{ nodeId: id, field: "thumbnail.url" }}
          imageUpload={true}
        />
      </div>
    </Collapsable>
  );
}
