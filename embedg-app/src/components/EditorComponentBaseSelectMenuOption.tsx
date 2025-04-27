import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import Collapsable from "./Collapsable";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import EditorInput from "./EditorInput";
import EditorComponentActions from "./EditorActionSet";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";
import { MessageComponentSelectMenuOption } from "../discord/schema";

interface Props {
  validationPathPrefix: string;
  title?: string;
  data: MessageComponentSelectMenuOption;
  onChange: (data: Partial<MessageComponentSelectMenuOption>) => void;

  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
}

export default function EditorComponentBaseSelectMenuOption({
  validationPathPrefix,
  title = "Option",
  data,
  onChange,
  duplicate,
  moveUp,
  moveDown,
  remove,
}: Props) {
  return (
    <div className="p-3 border-2 border-dark-6 rounded-md">
      <Collapsable
        id={validationPathPrefix}
        validationPathPrefix={validationPathPrefix}
        title={title}
        extra={
          data.label && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{data.label}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {moveUp && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveUp}
              />
            )}
            {moveDown && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveDown}
              />
            )}
            {duplicate && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={duplicate}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={remove}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={data.emoji ?? undefined}
              onChange={(v) => onChange({ emoji: v })}
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={data.label}
              onChange={(v) => onChange({ label: v })}
              className="flex-auto"
              validationPath={`${validationPathPrefix}.label`}
            />
          </div>
          <EditorInput
            label="Description"
            maxLength={100}
            value={data.description || ""}
            onChange={(v) => onChange({ description: v || undefined })}
            className="flex-auto"
            validationPath={`${validationPathPrefix}.description`}
          />
          <EditorComponentActions setId={data.action_set_id} />
        </div>
      </Collapsable>
    </div>
  );
}
