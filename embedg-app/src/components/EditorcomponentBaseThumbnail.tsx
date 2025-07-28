import { MessageComponentThumbnail } from "../discord/schema";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentThumbnail;
  size?: "medium" | "large";
  onChange: (data: Partial<MessageComponentThumbnail>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
}

export default function EditorComponentBaseThumbnail({
  id,
  validationPathPrefix,
  title = "Thumbnail",
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
      size={size}
      duplicate={duplicate}
      moveUp={moveUp}
      moveDown={moveDown}
      remove={remove}
      extra={
        data.description ? (
          <div className="text-gray-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">{data.description}</div>
          </div>
        ) : null
      }
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
