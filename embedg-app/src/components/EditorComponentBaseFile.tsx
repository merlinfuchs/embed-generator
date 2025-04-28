import { MessageComponentFile } from "../discord/schema";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentFile;
  size?: "medium" | "large";
  onChange: (data: Partial<MessageComponentFile>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
}

export default function EditorComponentBaseFile({
  id,
  validationPathPrefix,
  title = "File",
  size = "medium",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
}: Props) {
  // TODO: Allow selecting files from attachment

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
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <EditorInput
            label="File URL"
            maxLength={80}
            value={data.file.url}
            onChange={(v) =>
              onChange({
                file: {
                  url: v,
                },
              })
            }
            className="flex-auto"
            validationPath={`${validationPathPrefix}.file.url`}
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
      </div>
    </EditorComponentCollapsable>
  );
}
