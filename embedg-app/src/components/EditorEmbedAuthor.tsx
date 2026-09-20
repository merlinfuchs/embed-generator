import {
  type EmbedNode,
  type NodeId,
  useDocumentStore,
  useNode,
} from "../state/document";
import { patchGroup } from "../util/patch";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
}

export default function EditorEmbedAuthor({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const { update } = useDocumentStore.getState();

  if (!embed) return null;

  const author = embed.author;

  function patchAuthor(patch: Partial<NonNullable<EmbedNode["author"]>>) {
    update<EmbedNode>(id, {
      author: patchGroup(author ?? { name: "" }, patch),
    });
  }

  return (
    <Collapsable
      title="Author"
      id={`embeds.${id}.author`}
      validationNodeId={id}
      validationFields={["author"]}
    >
      <div className="space-y-3">
        <EditorInput
          label="Author"
          value={author?.name || ""}
          onChange={(v) => patchAuthor({ name: v })}
          maxLength={256}
          validationNodeId={id}
          validationField="author.name"
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="Author URL"
            value={author?.url || ""}
            onChange={(v) => patchAuthor({ url: v || undefined })}
            className="w-1/2"
            validationNodeId={id}
            validationField="author.url"
          />
          <EditorInput
            type="url"
            label="Author Icon URL"
            value={author?.icon_url || ""}
            onChange={(v) => patchAuthor({ icon_url: v || undefined })}
            className="w-1/2"
            validationNodeId={id}
            validationField="author.icon_url"
            imageUpload={true}
          />
        </div>
      </div>
    </Collapsable>
  );
}
