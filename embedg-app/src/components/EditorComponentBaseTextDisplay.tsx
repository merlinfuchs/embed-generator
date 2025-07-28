import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import { MessageComponentTextDisplay } from "../discord/schema";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  id: string;
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentTextDisplay;
  onChange: (data: Partial<MessageComponentTextDisplay>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  size?: "medium" | "large";
}

export default function EditorComponentBaseTextDisplay({
  id,
  validationPathPrefix,
  title = "Text Display",
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
      size={size}
      moveUp={moveUp}
      moveDown={moveDown}
      duplicate={duplicate}
      remove={remove}
      extra={
        data.content ? (
          <div className="text-gray-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">{data.content}</div>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <EditorInput
          type="textarea"
          label="Content"
          maxLength={4000}
          value={data.content}
          onChange={(v) => onChange({ content: v })}
          className="flex-auto"
          validationPath={`${validationPathPrefix}.content`}
        />
      </div>
    </EditorComponentCollapsable>
  );
}
