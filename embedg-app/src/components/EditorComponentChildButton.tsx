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
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
}

const buttonBorderColors = {
  1: "border-blurple",
  2: "border-dark-7",
  3: "border-green",
  4: "border-red",
  5: "border-dark-7",
};

export default function EditorComponentChildButton({
  rootIndex,
  rootId,
  childIndex,
  childId,
}: Props) {
  const buttonCount = useCurrentMessageStore(
    (state) => state.getSubComponents(rootIndex).length || 0
  );

  const [label, setLabel] = useCurrentMessageStore(
    (state) => [
      state.getButton(rootIndex, childIndex)?.label || "",
      state.setSubComponentLabel,
    ],
    shallow
  );

  const [emoji, setEmoji] = useCurrentMessageStore(
    (state) => [
      state.getButton(rootIndex, childIndex)?.emoji,
      state.setSubComponentEmoji,
    ],
    shallow
  );

  const [url, setUrl] = useCurrentMessageStore((state) => {
    const button = state.getButton(rootIndex, childIndex);
    return [button?.style === 5 ? button.url : "", state.setSubComponentUrl];
  }, shallow);

  const [style, setStyle] = useCurrentMessageStore(
    (state) => [
      state.getButton(rootIndex, childIndex)?.style,
      state.setSubComponentStyle,
    ],
    shallow
  );

  const [disabled, setDisabled] = useCurrentMessageStore((state) => [
    state.getButton(rootIndex, childIndex)?.disabled,
    state.setSubComponentDisabled,
  ]);

  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveSubComponentUp,
      state.moveSubComponentDown,
      state.duplicateSubComponent,
      state.deleteSubComponent,
    ],
    shallow
  );

  const actionSetId = useCurrentMessageStore(
    (state) => state.getButton(rootIndex, childIndex)?.action_set_id || ""
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
        id={`components.${rootId}.buttons.${childId}`}
        valiationPathPrefix={`components.${rootIndex}.components.${childIndex}`}
        title={`Button ${childIndex + 1}`}
        extra={
          label && (
            <div className="text-gray-500 truncate flex space-x-2 pl-1">
              <div>-</div>
              <div className="truncate">{label}</div>
            </div>
          )
        }
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {childIndex > 0 && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveUp(rootIndex, childIndex)}
              />
            )}
            {childIndex < buttonCount - 1 && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={() => moveDown(rootIndex, childIndex)}
              />
            )}
            {buttonCount < 5 && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={() => duplicate(rootIndex, childIndex)}
              />
            )}
            <TrashIcon
              className="h-5 w-5 flex-none"
              role="button"
              onClick={() => remove(rootIndex, childIndex)}
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
                  setStyle(
                    rootIndex,
                    childIndex,
                    parseInt(v.target.value) as any
                  )
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
                onChange={(v) => setDisabled(rootIndex, childIndex, v)}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <EditorComponentEmojiSelect
              emoji={emoji ?? undefined}
              onChange={(v) => setEmoji(rootIndex, childIndex, v)}
            />
            <EditorInput
              label="Label"
              maxLength={80}
              value={label}
              onChange={(v) => setLabel(rootIndex, childIndex, v)}
              className="flex-auto"
              validationPath={`components.${rootIndex}.components.${childIndex}.label`}
            />
          </div>
          {style === 5 ? (
            <EditorInput
              label="URL"
              type="url"
              value={url}
              onChange={(v) => setUrl(rootIndex, childIndex, v)}
              validationPath={`components.${rootIndex}.components.${childIndex}.url`}
            />
          ) : (
            <EditorActionSet setId={actionSetId} />
          )}
        </div>
      </Collapsable>
    </div>
  );
}
