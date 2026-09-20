import {
  type MediaGalleryItemNode,
  type NodeId,
  useDocumentStore,
  useNode,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import { useNodeActions } from "./useNodeActions";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentBaseMediaGalleryItem({
  id,
  title = "Item",
  size = "medium",
}: Props) {
  const data = useNode<MediaGalleryItemNode>(id);
  const actions = useNodeActions(id, 10);
  const { update } = useDocumentStore.getState();

  if (!data) return null;

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<MediaGalleryItemNode>(id)}
      title={title}
      extra={
        data.description && (
          <div className="text-gray-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">{data.description}</div>
          </div>
        )
      }
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
            validationPath={nodeField<MediaGalleryItemNode>(id, "media.url")}
          />
          <div className="flex-none">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Spoiler
            </div>
            <CheckBox
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
