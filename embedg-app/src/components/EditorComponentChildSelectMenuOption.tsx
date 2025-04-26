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
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
  optionIndex: number;
  optionId: number;
}

export default function EditorComponentChildSelectMenuOption({
  rootIndex,
  rootId,
  childIndex,
  childId,
  optionIndex,
  optionId,
}: Props) {
  const optionCount = useCurrentMessageStore(
    (state) => state.getSelectMenu(rootIndex, childIndex)?.options?.length || 0
  );

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveSubComponentOptionUp,
      state.moveSubComponentOptionDown,
      state.duplicateSubComponentOption,
      state.deleteSubComponentOption,
    ],
    shallow
  );

  const setLabel = useCurrentMessageStore(
    (state) => state.setSubComponentOptionLabel
  );

  const setDescription = useCurrentMessageStore(
    (state) => state.setSubComponentOptionDescription
  );

  const setEmoji = useCurrentMessageStore(
    (state) => state.setSubComponentOptionEmoji
  );

  const option = useCurrentMessageStore(
    (state) =>
      state.getSelectMenu(rootIndex, childIndex)?.options?.[optionIndex],
    shallow
  );
  if (!option) {
    return <div></div>;
  }

  return (
    <div className="p-3 border-2 border-dark-6 rounded-md">
      <Collapsable
        id={`components.${rootId}.select.${childId}.options.${optionId}`}
        valiationPathPrefix={`components.${rootIndex}.components.${childIndex}.options.${optionIndex}`}
        title={`Option ${optionIndex + 1}`}
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
                onClick={() => moveUp(rootIndex, childIndex, optionIndex)}
              />
            )}
            {optionIndex < optionCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(rootIndex, childIndex, optionIndex)}
              />
            )}
            {optionCount < 25 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(rootIndex, childIndex, optionIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(rootIndex, childIndex, optionIndex)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={option.emoji ?? undefined}
              onChange={(v) => setEmoji(rootIndex, childIndex, optionIndex, v)}
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={option.label}
              onChange={(v) => setLabel(rootIndex, childIndex, optionIndex, v)}
              className="flex-auto"
              validationPath={`components.${rootIndex}.components.${childIndex}.options.${optionIndex}.label`}
            />
          </div>
          <EditorInput
            label="Description"
            maxLength={100}
            value={option.description || ""}
            onChange={(v) =>
              setDescription(rootIndex, childIndex, optionIndex, v || undefined)
            }
            className="flex-auto"
            validationPath={`components.${rootIndex}.components.${childIndex}.options.${optionIndex}.description`}
          />
          <EditorComponentActions setId={option.action_set_id} />
        </div>
      </Collapsable>
    </div>
  );
}
