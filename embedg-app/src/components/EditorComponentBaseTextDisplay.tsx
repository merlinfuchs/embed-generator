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
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentTextDisplay;
  onChange: (data: Partial<MessageComponentTextDisplay>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
}

export default function EditorComponentBaseTextDisplay({
  validationPathPrefix,
  title = "Text Display",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
}: Props) {
  return (
    <div className="bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 border-dark-5">
      <EditorComponentCollapsable
        id={validationPathPrefix}
        validationPathPrefix={validationPathPrefix}
        title={title}
        size="large"
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
    </div>
  );
}
