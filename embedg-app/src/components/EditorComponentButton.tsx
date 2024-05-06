import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import { shallow } from "zustand/shallow";
import EditorInput from "./EditorInput";
import EditorActionSet from "./EditorActionSet";
import EditorComponentEmojiSelect from "./EditorComponentEmojiSelect";
import CheckBox from "./CheckBox";

interface Props {
  rowIndex: number;
  rowId: number;
  compIndex: number;
  compId: number;
}

const buttonBorderColors = {
  1: "border-blurple",
  2: "border-dark-7",
  3: "border-green",
  4: "border-red",
  5: "border-dark-7",
};

export default function EditorComponentButton({
  rowIndex,
  rowId,
  compIndex,
  compId,
}: Props) {
  const buttonCount = useCurrentMessageStore(
    (state) => state.components[rowIndex].components.length
  );

  const [label, setLabel] = useCurrentMessageStore(
    (state) => [
      state.getButton(rowIndex, compIndex)?.label || "",
      state.setButtonLabel,
    ],
    shallow
  );

  const [emoji, setEmoji] = useCurrentMessageStore(
    (state) => [
      state.getButton(rowIndex, compIndex)?.emoji,
      state.setButtonEmoji,
    ],
    shallow
  );

  const [url, setUrl] = useCurrentMessageStore((state) => {
    const button = state.getButton(rowIndex, compIndex);
    return [button?.style === 5 ? button.url : "", state.setButtonUrl];
  }, shallow);

  const [style, setStyle] = useCurrentMessageStore(
    (state) => [
      state.getButton(rowIndex, compIndex)?.style,
      state.setButtonStyle,
    ],
    shallow
  );

  const [disabled, setDisabled] = useCurrentMessageStore((state) => [
    state.getButton(rowIndex, compIndex)?.disabled,
    state.setButtonDisabled,
  ]);

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveButtonUp,
      state.moveButtonDown,
      state.duplicateButton,
      state.deleteButton,
    ],
    shallow
  );

  const actionSetId = useCurrentMessageStore(
    (state) => state.getButton(rowIndex, compIndex)?.action_set_id || ""
  );

  if (!style) {
    // This is not a button (shouldn't happen)
    return <div></div>;
  }

  const borderColor = buttonBorderColors[style];

  return (
    <div
      className={`bg-dark-3 px-3 md:px-4 py-3 mb-3 rounded-md shadow border-2 ${borderColor}`}
    >
      <Collapsable
        id={`components.${rowId}.buttons.${compId}`}
        valiationPathPrefix={`components.${rowIndex}.components.${compIndex}`}
        title={`Button ${compIndex + 1}`}
        extra={
          label && (
            <div className="text-gray-500 truncate flex space-x-2 pl-2">
              <div>-</div>
              <div className="truncate">{label}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {compIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(rowIndex, compIndex)}
              />
            )}
            {compIndex < buttonCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(rowIndex, compIndex)}
              />
            )}
            {buttonCount < 5 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(rowIndex, compIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(rowIndex, compIndex)}
            />
          </div>
        }
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
                value={style.toString()}
                onChange={(v) =>
                  setStyle(rowIndex, compIndex, parseInt(v.target.value) as any)
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
                checked={disabled ?? false}
                onChange={(v) => setDisabled(rowIndex, compIndex, v)}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={emoji ?? undefined}
              onChange={(v) => setEmoji(rowIndex, compIndex, v)}
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={label}
              onChange={(v) => setLabel(rowIndex, compIndex, v)}
              className="flex-auto"
              validationPath={`components.${rowIndex}.components.${compIndex}.label`}
            />
          </div>
          {style === 5 ? (
            <EditorInput
              label="URL"
              type="url"
              value={url}
              onChange={(v) => setUrl(rowIndex, compIndex, v)}
              validationPath={`components.${rowIndex}.components.${compIndex}.url`}
            />
          ) : (
            <EditorActionSet setId={actionSetId} />
          )}
        </div>
      </Collapsable>
    </div>
  );
}
