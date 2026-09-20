import { NESTED_CARD } from "./editorCard";
import {
  type NodeId,
  useChildIds,
  useNodeActions,
  slotLimit,
  useDocumentStoreApi,
} from "../state/document";
import { slotScope } from "../state/validationError";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentMediaGalleryItem from "./EditorComponentMediaGalleryItem";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorSlotButtons from "./EditorSlotButtons";

interface Props {
  id: NodeId;
  title?: string;
}

export default function EditorComponentMediaGallery({
  id,
  title = "Media Gallery",
}: Props) {
  const itemIds = useChildIds(id, "items");
  const actions = useNodeActions(id);
  const { insert, removeChildren } = useDocumentStoreApi().getState();

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
          <div className={NESTED_CARD} key={itemId}>
            <EditorComponentMediaGalleryItem id={itemId} />
          </div>
        ))}
        <EditorSlotButtons
          addLabel="Add Item"
          clearLabel="Clear Items"
          canAdd={itemIds.length < slotLimit("mediaGallery", "items")}
          onAdd={() =>
            insert(id, "items", "end", {
              type: "mediaGalleryItem",
              media: { url: "" },
            })
          }
          onClear={() => removeChildren(id, "items")}
        />
      </AutoAnimate>
    </EditorComponentCollapsable>
  );
}
