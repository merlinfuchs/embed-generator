import { MessageComponentFile } from "../discord/schema";
import { useCurrentAttachmentsStore } from "../state/attachments";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";
import ValidationError from "./ValidationError";

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
  const attachments = useCurrentAttachmentsStore((state) => state.attachments);

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
          <div className="flex-auto">
            <div className="mb-1.5 flex">
              <div className="uppercase text-gray-300 text-sm font-medium">
                Attachment
              </div>
            </div>
            <select
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
              value={data.file.url}
              onChange={(e) => onChange({ file: { url: e.target.value } })}
            >
              {attachments.map((attachment) => (
                <option value={`attachment://${attachment.name}`}>
                  {attachment.name}
                </option>
              ))}
              <option value="">Select Attachment</option>
            </select>
            <ValidationError path={`${validationPathPrefix}.file.url`} />
          </div>
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
