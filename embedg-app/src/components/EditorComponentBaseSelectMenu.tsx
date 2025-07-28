import {
  MessageComponentSelectMenu,
  MessageComponentSelectMenuOption,
} from "../discord/schema";
import { AutoAnimate } from "../util/autoAnimate";
import CheckBox from "./CheckBox";
import Collapsable from "./Collapsable";
import EditorComponentBaseSelectMenuOption from "./EditorComponentBaseSelectMenuOption";
import EditorInput from "./EditorInput";

interface Props {
  id: string;
  validationPathPrefix: string;
  data: MessageComponentSelectMenu;
  onChange: (data: Partial<MessageComponentSelectMenu>) => void;

  addOption: () => void;
  moveOptionUp: (o: number) => void;
  moveOptionDown: (o: number) => void;
  duplicateOption: (o: number) => void;
  removeOption: (o: number) => void;
  clearOptions: () => void;
  onOptionChange: (
    o: number,
    data: Partial<MessageComponentSelectMenuOption>
  ) => void;
}

export default function EditorComponentBaseSelectMenu({
  id,
  validationPathPrefix,
  data,
  onChange,
  addOption,
  onOptionChange,
  moveOptionUp,
  moveOptionDown,
  duplicateOption,
  removeOption,
  clearOptions,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex space-x-3">
        <EditorInput
          label="Placeholder"
          maxLength={150}
          value={data.placeholder || ""}
          onChange={(v) =>
            onChange({
              placeholder: v || undefined,
            })
          }
          className="flex-auto"
        />
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
      <Collapsable
        id={`${validationPathPrefix}.options`}
        validationPathPrefix={`${validationPathPrefix}.options`}
        title="Options"
      >
        <AutoAnimate className="space-y-2">
          {data.options.map((option, i) => (
            <div key={option.id}>
              <EditorComponentBaseSelectMenuOption
                validationPathPrefix={`${validationPathPrefix}.options.${i}`}
                title={`Option ${i + 1}`}
                data={option}
                onChange={(v) => onOptionChange(i, v)}
                moveUp={i > 0 ? () => moveOptionUp(i) : undefined}
                moveDown={
                  i < data.options.length - 1
                    ? () => moveOptionDown(i)
                    : undefined
                }
                duplicate={
                  data.options.length < 25
                    ? () => duplicateOption(i)
                    : undefined
                }
                remove={() => removeOption(i)}
              />
            </div>
          ))}
        </AutoAnimate>
        <div className="space-x-3 mt-3">
          {data.options.length < 25 ? (
            <button
              className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
              onClick={addOption}
            >
              Add Option
            </button>
          ) : (
            <button
              disabled
              className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
            >
              Add Option
            </button>
          )}
          <button
            className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
            onClick={clearOptions}
          >
            Clear Options
          </button>
        </div>
      </Collapsable>
    </div>
  );
}
