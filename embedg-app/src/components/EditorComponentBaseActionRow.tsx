import { useMemo } from "react";
import {
  MessageComponentActionRow,
  MessageComponentButton,
  MessageComponentSelectMenu,
  MessageComponentSelectMenuOption,
} from "../discord/schema";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentBaseButton from "./EditorComponentBaseButton";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorComponentBaseSelectMenu from "./EditorComponentBaseSelectMenu";

interface Props {
  id: string;
  validationPathPrefix: string;
  data: MessageComponentActionRow;
  duplicate: () => void;
  moveUp: () => void;
  moveDown: () => void;
  remove: () => void;
  addSubComponent: (component: MessageComponentButton) => void;
  clearSubComponents: () => void;
  moveSubComponentUp: (index: number) => void;
  moveSubComponentDown: (index: number) => void;
  deleteSubComponent: (index: number) => void;
  onButtonChange: (
    index: number,
    data: Partial<MessageComponentButton>
  ) => void;
  duplicateButton: (index: number) => void;
  onSelectMenuChange: (
    index: number,
    data: Partial<MessageComponentSelectMenu>
  ) => void;
  onSelectMenuOptionChange: (
    index: number,
    optionIndex: number,
    data: Partial<MessageComponentSelectMenuOption>
  ) => void;
  addSelectMenuOption: (index: number) => void;
  duplicateSelectMenuOption: (index: number) => void;
  moveSelectMenuOptionUp: (index: number) => void;
  moveSelectMenuOptionDown: (index: number) => void;
  removeSelectMenuOption: (index: number) => void;
  clearSelectMenuOptions: (index: number) => void;
}

export default function EditorComponentBaseActionRow({
  id,
  validationPathPrefix,
  data,
  duplicate,
  moveUp,
  moveDown,
  remove,
  addSubComponent,
  clearSubComponents,
  moveSubComponentUp,
  moveSubComponentDown,
  deleteSubComponent,
  onButtonChange,
  duplicateButton,
  onSelectMenuChange,
  onSelectMenuOptionChange,
  addSelectMenuOption,
  duplicateSelectMenuOption,
  moveSelectMenuOptionUp,
  moveSelectMenuOptionDown,
  removeSelectMenuOption,
  clearSelectMenuOptions,
}: Props) {
  const isButtonRow = useMemo(
    () => data.components.every((c) => c.type === 2),
    [data]
  );

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <EditorComponentCollapsable
        id={id}
        validationPathPrefix={validationPathPrefix}
        title="Row"
        size="large"
        moveUp={moveUp}
        moveDown={moveDown}
        duplicate={duplicate}
        remove={remove}
        extra={
          <div className="text-gray-500 truncate flex space-x-2 pl-1">
            <div>-</div>
            <div className="truncate">
              {isButtonRow ? "Button Row" : "Select Menu Row"}
            </div>
          </div>
        }
      >
        <AutoAnimate>
          {data.components.map((child, i) =>
            child.type === 2 ? (
              <EditorComponentBaseButton
                key={child.id}
                id={`${id}.components.${child.id}`}
                validationPathPrefix={validationPathPrefix}
                data={child}
                onChange={(data) => onButtonChange(i, data)}
                duplicate={() => duplicateButton(i)}
                moveUp={() => moveSubComponentUp(i)}
                moveDown={() => moveSubComponentDown(i)}
                remove={() => deleteSubComponent(i)}
              />
            ) : (
              <EditorComponentBaseSelectMenu
                key={child.id}
                id={`${id}.components.${child.id}`}
                validationPathPrefix={validationPathPrefix}
                data={child}
                onChange={(data) => onSelectMenuChange(i, data)}
                onOptionChange={(index, data) =>
                  onSelectMenuOptionChange(i, index, data)
                }
                addOption={() => addSelectMenuOption(i)}
                duplicateOption={() => duplicateSelectMenuOption(i)}
                moveOptionUp={() => moveSelectMenuOptionUp(i)}
                moveOptionDown={() => moveSelectMenuOptionDown(i)}
                removeOption={() => removeSelectMenuOption(i)}
                clearOptions={() => clearSelectMenuOptions(i)}
              />
            )
          )}
          {isButtonRow && (
            <div>
              <div className="space-x-3 mt-3">
                {data.components.length < 5 ? (
                  <button
                    className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                    onClick={() =>
                      addSubComponent({
                        id: getUniqueId(),
                        type: 2,
                        style: 2,
                        label: "",
                        action_set_id: getUniqueId().toString(),
                      })
                    }
                  >
                    Add Button
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-dark-2 px-3 py-2 rounded transition-colors cursor-not-allowed text-gray-300"
                  >
                    Add Button
                  </button>
                )}
                <button
                  className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
                  onClick={clearSubComponents}
                >
                  Clear Buttons
                </button>
              </div>
            </div>
          )}
        </AutoAnimate>
      </EditorComponentCollapsable>
    </div>
  );
}
