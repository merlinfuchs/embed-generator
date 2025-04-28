import { MessageComponentButton } from "../discord/schema";
import CheckBox from "./CheckBox";
import EditorActionSet from "./EditorActionSet";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";
import EditorInput from "./EditorInput";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentButton;
  size?: "medium" | "large";
  onChange: (data: Partial<MessageComponentButton>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
}

const buttonBorderColors = {
  1: "border-blurple",
  2: "border-dark-7",
  3: "border-green",
  4: "border-red",
  5: "border-dark-7",
};

export default function EditorComponentBaseButton({
  id,
  validationPathPrefix,
  title = "Button",
  size = "medium",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
}: Props) {
  const borderColor = buttonBorderColors[data.style];

  return (
    <div
      className={`bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 ${borderColor}`}
    >
      <EditorComponentCollapsable
        id={id}
        validationPathPrefix={validationPathPrefix}
        title={title}
        extra={
          data.label && (
            <div className="text-gray-500 truncate flex space-x-2 pl-1">
              <div>-</div>
              <div className="truncate">{data.label}</div>
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
            <div className="flex-auto">
              <div className="mb-1.5 flex">
                <div className="uppercase text-gray-300 text-sm font-medium">
                  Style
                </div>
              </div>
              <select
                className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
                value={data.style.toString()}
                onChange={(v) =>
                  onChange({
                    style: parseInt(v.target.value) as any,
                  })
                }
              >
                <option value="1">Blurple</option>
                <option value="2">Grey</option>
                <option value="3">Green</option>
                <option value="4">Red</option>
                <option value="5">Direct Link</option>
              </select>
            </div>
            <div className="flex-none">
              <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
                Disabled
              </div>
              <CheckBox
                checked={data.disabled ?? false}
                onChange={(v) =>
                  onChange({
                    disabled: v,
                  })
                }
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={data.emoji ?? undefined}
              onChange={(v) =>
                onChange({
                  emoji: v,
                })
              }
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={data.label}
              onChange={(v) =>
                onChange({
                  label: v,
                })
              }
              className="flex-auto"
              validationPath={`${validationPathPrefix}.label`}
            />
          </div>
          {data.style === 5 ? (
            <EditorInput
              label="URL"
              type="url"
              value={data.url}
              onChange={(v) =>
                onChange({
                  url: v,
                })
              }
              validationPath={`${validationPathPrefix}.url`}
            />
          ) : (
            <EditorActionSet setId={data.action_set_id} />
          )}
        </div>
      </EditorComponentCollapsable>
    </div>
  );
}
