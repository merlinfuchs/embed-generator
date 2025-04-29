import { MessageComponentMediaGalleryItem } from "../discord/schema";
import CheckBox from "./CheckBox";
import EditorActionSet from "./EditorActionSet";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";
import EditorInput from "./EditorInput";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentMediaGalleryItem;
  size?: "medium" | "large";
  onChange: (data: Partial<MessageComponentMediaGalleryItem>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
}

export default function EditorComponentBaseMediaGalleryItem({
  id,
  validationPathPrefix,
  title = "Gallery Item",
  size = "medium",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
}: Props) {
  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={validationPathPrefix}
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
      duplicate={duplicate}
      moveUp={moveUp}
      moveDown={moveDown}
      remove={remove}
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <EditorInput
            label="File URL"
            value={data.media.url}
            onChange={(v) =>
              onChange({
                media: {
                  url: v,
                },
              })
            }
            className="flex-auto"
            validationPath={`${validationPathPrefix}.media.url`}
          />
          <div className="flex-none">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Spoiler
            </div>
            <CheckBox
              checked={data.spoiler ?? false}
              onChange={(v) =>
                onChange({
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
            onChange({
              description: v,
            })
          }
          className="flex-auto"
          validationPath={`${validationPathPrefix}.description`}
        />
      </div>
    </EditorComponentCollapsable>
  );
}
