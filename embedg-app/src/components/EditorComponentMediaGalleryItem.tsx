import {
  type MediaGalleryItemNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeActions,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentMediaGalleryItem({
  id,
  title = "Item",
  size = "medium",
}: Props) {
  const data = useNode<MediaGalleryItemNode>(id);
  const actions = useNodeActions(id);
  const { update } = useDocumentStore.getState();

  if (!data) return null;

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<MediaGalleryItemNode>(id)}
      title={title}
      subtitle={data.description}
      size={size}
      {...actions}
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <EditorInput
            label="File URL"
            value={data.media.url}
            onChange={(v) =>
              update<MediaGalleryItemNode>(id, {
                media: {
                  url: v,
                },
              })
            }
            className="flex-auto"
            imageUpload={true}
            validationPath={nodeField<MediaGalleryItemNode>(id, "media.url")}
          />
          <div className="flex-none">
            <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
              Spoiler
            </div>
            <CheckBox
              label="Spoiler"
              checked={data.spoiler ?? false}
              onChange={(v) =>
                update<MediaGalleryItemNode>(id, {
                  spoiler: v,
                })
              }
            />
          </div>
        </div>
        <EditorInput
          label="Description"
          maxLength={80}
          value={data.description ?? ""}
          onChange={(v) =>
            update<MediaGalleryItemNode>(id, {
              description: v,
            })
          }
          className="flex-auto"
          validationPath={nodeField<MediaGalleryItemNode>(id, "description")}
        />
      </div>
    </EditorComponentCollapsable>
  );
}
