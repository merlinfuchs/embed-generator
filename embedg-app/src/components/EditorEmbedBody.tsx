import {
  type EmbedNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodePath,
} from "../state/document";
import Collapsable from "./Collapsable";
import ColorPicker from "./ColorPicker";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

interface Props {
  id: NodeId;
}

export default function EditorEmbedBody({ id }: Props) {
  const embed = useNode<EmbedNode>(id);
  const path = useNodePath(id);
  const update = useDocumentStore((state) => state.update);

  if (!embed) return null;

  return (
    <Collapsable
      id={`embeds.${id}.content`}
      title="Body"
      validationPathPrefix={[
        `${path}.title`,
        `${path}.description`,
        `${path}.url`,
        `${path}.color`,
      ]}
    >
      <div className="space-y-3">
        <EditorInput
          label="Title"
          value={embed.title || ""}
          onChange={(v) => update<EmbedNode>(id, { title: v || undefined })}
          maxLength={256}
          validationPath={`${path}.title`}
        />
        <EditorInput
          type="textarea"
          label="Description"
          value={embed.description || ""}
          onChange={(v) =>
            update<EmbedNode>(id, { description: v || undefined })
          }
          maxLength={4096}
          validationPath={`${path}.description`}
          controls={true}
        />
        <div className="flex space-x-3">
          <EditorInput
            type="url"
            label="URL"
            value={embed.url || ""}
            onChange={(v) => update<EmbedNode>(id, { url: v || undefined })}
            className="w-full"
            validationPath={`${path}.url`}
          />
          <div>
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Color
            </div>
            <ColorPicker
              value={embed.color}
              onChange={(v) => update<EmbedNode>(id, { color: v })}
            />
            <ValidationError path={`${path}.color`} />
          </div>
        </div>
      </div>
    </Collapsable>
  );
}
