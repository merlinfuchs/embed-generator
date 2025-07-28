import { MessageComponentSeparator } from "../discord/schema";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentSeparator;
  onChange: (data: Partial<MessageComponentSeparator>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  size?: "medium" | "large";
}

export default function EditorComponentBaseSeparator({
  id,
  validationPathPrefix,
  title = "Separator",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
  size = "medium",
}: Props) {
  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={validationPathPrefix}
      title={title}
      duplicate={duplicate}
      moveUp={moveUp}
      moveDown={moveDown}
      remove={remove}
      size={size}
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <div className="flex-auto">
            <div className="mb-1.5 flex">
              <div className="uppercase text-gray-300 text-sm font-medium">
                Spacing
              </div>
            </div>
            <select
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
              value={data.spacing.toString()}
              onChange={(v) =>
                onChange({
                  spacing: parseInt(v.target.value) as any,
                })
              }
            >
              <option value="1">Small</option>
              <option value="2">Large</option>
            </select>
          </div>
          <div className="flex-none">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Divider
            </div>
            <CheckBox
              checked={data.divider ?? false}
              onChange={(v) =>
                onChange({
                  divider: v,
                })
              }
            />
          </div>
        </div>
      </div>
    </EditorComponentCollapsable>
  );
}
