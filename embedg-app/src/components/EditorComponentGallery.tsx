import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorComponentBaseMediaGallery from "./EditorComponentBaseMediaGallery";
import { MessageComponentMediaGalleryItem } from "../discord/schema";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentGallery({ rootIndex, rootId }: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveComponentUp,
      state.moveComponentDown,
      state.duplicateComponent,
      state.deleteComponent,
    ],
    shallow
  );

  const [
    addItem,
    clearItems,
    moveItemUp,
    moveItemDown,
    deleteItem,
    updateGalleryItem,
    duplicateItem,
  ] = useCurrentMessageStore(
    (state) => [
      state.addGalleryItem,
      state.clearGalleryItems,
      state.moveGalleryItemUp,
      state.moveGalleryItemDown,
      state.deleteGalleryItem,
      state.updateGalleryItem,
      state.duplicateGalleryItem,
    ],
    shallow
  );

  const gallery = useCurrentMessageStore(
    (state) => state.getGallery(rootIndex),
    shallow
  );

  if (!gallery) {
    return null;
  }

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <EditorComponentBaseMediaGallery
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}`}
        data={gallery}
        duplicate={() => duplicate(rootIndex)}
        moveUp={rootIndex > 0 ? () => moveUp(rootIndex) : () => {}}
        moveDown={
          rootIndex < componentCount - 1 ? () => moveDown(rootIndex) : () => {}
        }
        remove={() => remove(rootIndex)}
        addItem={(item: MessageComponentMediaGalleryItem) =>
          addItem(rootIndex, item)
        }
        clearItems={() => clearItems(rootIndex)}
        moveItemUp={(index: number) => moveItemUp(rootIndex, index)}
        moveItemDown={(index: number) => moveItemDown(rootIndex, index)}
        deleteItem={(index: number) => deleteItem(rootIndex, index)}
        onItemChange={(index: number, data: any) =>
          updateGalleryItem(rootIndex, index, data)
        }
        duplicateItem={(index: number) => duplicateItem(rootIndex, index)}
      />
    </div>
  );
}
