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
  title?: string;
  data: MessageComponentActionRow;
  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  addSubComponent: (
    component: MessageComponentButton | MessageComponentSelectMenu
  ) => void;
  clearSubComponents: () => void;
  moveSubComponentUp: (index: number) => void;
  moveSubComponentDown: (index: number) => void;
  deleteSubComponent: (index: number) => void;
  onSubComponentChange: (
    index: number,
    data: Partial<MessageComponentButton | MessageComponentSelectMenu>
  ) => void;
  duplicateSubComponent: (index: number) => void;
  onSelectMenuOptionChange: (
    a: number,
    o: number,
    data: Partial<MessageComponentSelectMenuOption>
  ) => void;
  addSelectMenuOption: (k: number) => void;
  duplicateSelectMenuOption: (k: number, o: number) => void;
  moveSelectMenuOptionUp: (k: number, o: number) => void;
  moveSelectMenuOptionDown: (k: number, o: number) => void;
  removeSelectMenuOption: (k: number, o: number) => void;
  clearSelectMenuOptions: (k: number) => void;
}

export default function EditorComponentBaseActionRow({
  id,
  validationPathPrefix,
  title = "Action Row",
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
  onSubComponentChange,
  duplicateSubComponent,
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
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={validationPathPrefix}
      title={title}
      size="large"
      moveUp={moveUp}
      moveDown={moveDown}
      duplicate={duplicate}
      remove={remove}
      extra={
        <div className="text-gray-500 truncate flex space-x-2 pl-1">
          <div>-</div>
          <div className="truncate">
            {isButtonRow ? "Buttons" : "Select Menu"}
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
              validationPathPrefix={`${validationPathPrefix}.components.${i}`}
              data={child}
              onChange={(data) => onSubComponentChange(i, data)}
              duplicate={
                data.components.length < 5
                  ? () => duplicateSubComponent(i)
                  : undefined
              }
              moveUp={i > 0 ? () => moveSubComponentUp(i) : undefined}
              moveDown={
                i < data.components.length - 1
                  ? () => moveSubComponentDown(i)
                  : undefined
              }
              remove={() => deleteSubComponent(i)}
            />
          ) : (
            <EditorComponentBaseSelectMenu
              key={child.id}
              id={`${id}.components.${child.id}`}
              validationPathPrefix={`${validationPathPrefix}.components.${i}`}
              data={child}
              onChange={(data) => onSubComponentChange(i, data)}
              onOptionChange={(index, data) =>
                onSelectMenuOptionChange(i, index, data)
              }
              addOption={() => addSelectMenuOption(i)}
              duplicateOption={(o) => duplicateSelectMenuOption(i, o)}
              moveOptionUp={(o) => moveSelectMenuOptionUp(i, o)}
              moveOptionDown={(o) => moveSelectMenuOptionDown(i, o)}
              removeOption={(o) => removeSelectMenuOption(i, o)}
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
  );
}
