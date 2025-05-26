import {
  MessageComponentMediaGallery,
  MessageComponentMediaGalleryItem,
  MessageComponentTextDisplay,
} from "../discord/schema";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentBaseMediaGalleryItem from "./EditorComponentBaseMediaGalleryItem";
import EditorComponentBaseTextDisplay from "./EditorComponentBaseTextDisplay";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentMediaGallery;
  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  addItem: (item: MessageComponentMediaGalleryItem) => void;
  clearItems: () => void;
  moveItemUp: (index: number) => void;
  moveItemDown: (index: number) => void;
  deleteItem: (index: number) => void;
  onItemChange: (
    index: number,
    data: Partial<MessageComponentMediaGalleryItem>
  ) => void;
  duplicateItem: (index: number) => void;
}

export default function EditorComponentBaseMediaGallery({
  id,
  validationPathPrefix,
  title = "Media Gallery",
  data,
  duplicate,
  moveUp,
  moveDown,
  remove,
  addItem,
  clearItems,
  moveItemUp,
  moveItemDown,
  deleteItem,
  onItemChange,
  duplicateItem,
}: Props) {
  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={validationPathPrefix}
      title={title}
      size="large"
      moveUp={moveUp}
      moveDown={moveDown}
      duplicate={duplicate}
      remove={remove}
    >
      <AutoAnimate>
        {data.items.map((child, i) => (
          <div
            className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5"
            key={child.id}
          >
            <EditorComponentBaseMediaGalleryItem
              id={`${id}.items.${child.id}`}
              validationPathPrefix={`${validationPathPrefix}.items.${i}`}
              data={child}
              onChange={(data) => onItemChange(i, data)}
              duplicate={
                data.items.length < 10 ? () => duplicateItem(i) : undefined
              }
              moveUp={i > 0 ? () => moveItemUp(i) : undefined}
              moveDown={
                i < data.items.length - 1 ? () => moveItemDown(i) : undefined
              }
              remove={() => deleteItem(i)}
            />
          </div>
        ))}
        <div>
          <div className="space-x-3 mt-3">
            {data.items.length < 10 ? (
              <button
                className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                onClick={() =>
                  addItem({
                    id: getUniqueId(),
                    media: {
                      url: "",
                    },
                  })
                }
              >
                Add Item
              </button>
            ) : (
              <button
                disabled
                className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
              >
                Add Item
              </button>
            )}
            <button
              className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
              onClick={clearItems}
            >
              Clear Items
            </button>
          </div>
        </div>
      </AutoAnimate>
    </EditorComponentCollapsable>
  );
}
