import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentActionRowButton from "./EditorComponentActionRowButton";
import EditorComponentActionRowSelectMenu from "./EditorComponentActionRowSelectMenu";
import EditorComponentCollapsable from "./EditorComponentCollapsable";

interface Props {
  rootIndex: number;
  rootId: number;
}

export default function EditorComponentActionRow({ rootIndex, rootId }: Props) {
  const componentCount = useCurrentMessageStore(
    (state) => state.components.length
  );
  const children = useCurrentMessageStore(
    (state) =>
      state.getActionRow(rootIndex)?.components.map((c) => ({
        id: c.id,
        type: c.type,
      })) || [],
    shallow
  );
  const isButtonRow = useMemo(
    () => children.every((c) => c.type === 2),
    [children]
  );
  const [moveUp, moveDown, duplicate, remove] = useCurrentMessageStore(
    (state) => [
      state.moveComponentUp,
      state.moveComponentDown,
      state.duplicateActionRow,
      state.deleteComponent,
    ],
    shallow
  );

  const [addSubComponent, clearSubComponents] = useCurrentMessageStore(
    (state) => [state.addActionRowComponent, state.clearActionRowComponents],
    shallow
  );

  // TODO: Use EditorComponentBaseActionRow

  return (
    <div className="bg-dark-3 p-3 rounded-md">
      <EditorComponentCollapsable
        id={`components.${rootId}`}
        validationPathPrefix={`components.${rootIndex}.components`}
        title="Row"
        size="large"
        moveUp={rootIndex > 0 ? () => moveUp(rootIndex) : undefined}
        moveDown={
          rootIndex < componentCount - 1 ? () => moveDown(rootIndex) : undefined
        }
        duplicate={componentCount < 5 ? () => duplicate(rootIndex) : undefined}
        remove={() => remove(rootIndex)}
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
          {children.map(({ id, type }, i) =>
            type === 2 ? (
              <EditorComponentActionRowButton
                key={id}
                rootIndex={rootIndex}
                rootId={rootId}
                childIndex={i}
                childId={id}
              />
            ) : (
              <EditorComponentActionRowSelectMenu
                key={id}
                rootIndex={rootIndex}
                rootId={rootId}
                childIndex={i}
                childId={id}
              />
            )
          )}
          {isButtonRow && (
            <div>
              <div className="space-x-3 mt-3">
                {children.length < 5 ? (
                  <button
                    className="bg-blurple px-3 py-2 rounded transition-colors hover:bg-blurple-dark text-white"
                    onClick={() =>
                      addSubComponent(rootIndex, {
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
                  onClick={() => clearSubComponents(rootIndex)}
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
