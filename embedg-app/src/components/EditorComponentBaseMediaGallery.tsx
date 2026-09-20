import {
  type NodeId,
  useChildIds,
  useDocumentStore,
  useNodeActions,
} from "../state/document";
import { slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentBaseMediaGalleryItem from "./EditorComponentBaseMediaGalleryItem";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: NodeId;
  title?: string;
}

export default function EditorComponentBaseMediaGallery({
  id,
  title = "Media Gallery",
}: Props) {
  const itemIds = useChildIds(id, "items");
  const actions = useNodeActions(id);
  const { insert, removeChildren } = useDocumentStore.getState();

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={slotScope(id, "items")}
      title={title}
      size="large"
      {...actions}
    >
      <AutoAnimate>
        {itemIds.map((itemId) => (
          <div
            className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5"
            key={itemId}
          >
            <EditorComponentBaseMediaGalleryItem id={itemId} />
          </div>
        ))}
        <div>
          <div className="space-x-3 mt-3">
            {itemIds.length < 10 ? (
              <button
                type="button"
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                onClick={() =>
                  insert(id, "items", "end", {
                    type: "mediaGalleryItem",
                    media: { url: "" },
                  })
                }
              >
                Add Item
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
              >
                Add Item
              </button>
            )}
            <button
              type="button"
              className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
              onClick={() => removeChildren(id, "items")}
            >
              Clear Items
            </button>
          </div>
        </div>
      </AutoAnimate>
    </EditorComponentCollapsable>
  );
}
