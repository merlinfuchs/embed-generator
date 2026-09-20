import {
  type EmbedNode,
  type FieldPath,
  type NodeId,
  useDocumentStore,
  useNode,
} from "../state/document";
import { patchGroup } from "../util/patch";
import { nodeField, nodeScope } from "../state/validationError";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";

const AUTHOR_FIELDS: FieldPath<EmbedNode>[] = ["author"];

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
      validationPathPrefix={nodeScope<EmbedNode>(id, AUTHOR_FIELDS)}
    >
      <div className="space-y-3">
        <EditorInput
          label="Author"
          value={author?.name || ""}
          onChange={(v) => patchAuthor({ name: v })}
          maxLength={256}
          validationPath={nodeField<EmbedNode>(id, "author.name")}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="Author URL"
            value={author?.url || ""}
            onChange={(v) => patchAuthor({ url: v || undefined })}
            className="w-1/2"
            validationPath={nodeField<EmbedNode>(id, "author.url")}
          />
          <EditorInput
            type="url"
            label="Author Icon URL"
            value={author?.icon_url || ""}
            onChange={(v) => patchAuthor({ icon_url: v || undefined })}
            className="w-1/2"
            validationPath={nodeField<EmbedNode>(id, "author.icon_url")}
            imageUpload={true}
          />
        </div>
      </div>
    </Collapsable>
  );
}
