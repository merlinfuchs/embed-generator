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

interface Props {
  rowIndex: number;
  rowId: number;
  compIndex: number;
  compId: number;
  optionIndex: number;
  optionId: number;
}

export default function EditorComponentSelectMenuOption({
  rowIndex,
  rowId,
  compIndex,
  compId,
  optionIndex,
  optionId,
}: Props) {
  const optionCount = useCurrentMessageStore(
    (state) => state.getSelectMenu(rowIndex, compIndex)?.options?.length || 0
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveSelectMenuOptionUp,
      state.moveSelectMenuOptionDown,
      state.duplicateSelectMenuOption,
      state.deleteSelectMenuOption,
    ],
    shallow
  );

  const setLabel = useCurrentMessageStore(
    (state) => state.setSelectMenuOptionLabel
  );

  const setDescription = useCurrentMessageStore(
    (state) => state.setSelectMenuOptionDescription
  );

  const setEmoji = useCurrentMessageStore(
    (state) => state.setSelectMenuOptionEmoji
  );

  const option = useCurrentMessageStore(
    (state) => state.getSelectMenu(rowIndex, compIndex)?.options?.[optionIndex],
    shallow
  );
  if (!option) {
    return <div></div>;
  }

  return (
    <div className="p-3 border-2 border-dark-6 rounded-md">
      <Collapsable
        id={`components.${rowId}.select.${compId}.options.${optionId}`}
        valiationPathPrefix={`components.${rowIndex}.components.${compIndex}.options.${optionIndex}`}
        title={`Option ${compIndex + 1}`}
        extra={
          option.label && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{option.label}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {optionIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(rowIndex, compIndex, optionIndex)}
              />
            )}
            {optionIndex < optionCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(rowIndex, compIndex, optionIndex)}
              />
            )}
            {optionCount < 25 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(rowIndex, compIndex, optionIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(rowIndex, compIndex, optionIndex)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={option.emoji ?? null}
              onChange={(v) => setEmoji(rowIndex, compIndex, optionIndex, v)}
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={option.label}
              onChange={(v) => setLabel(rowIndex, compIndex, optionIndex, v)}
              className="flex-auto"
              validationPath={`components.${rowIndex}.components.${compIndex}.options.${optionIndex}.label`}
            />
          </div>
          <EditorInput
            label="Description"
            maxLength={100}
            value={option.description || ""}
            onChange={(v) =>
              setDescription(rowIndex, compIndex, optionIndex, v || undefined)
            }
            className="flex-auto"
            validationPath={`components.${rowIndex}.components.${compIndex}.options.${optionIndex}.description`}
          />
          <EditorComponentActions setId={option.action_set_id} />
        </div>
      </Collapsable>
    </div>
  );
}
