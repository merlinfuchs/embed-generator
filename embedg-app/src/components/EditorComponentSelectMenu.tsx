import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import { AutoAnimate } from "../util/autoAnimate";
import { getUniqueId } from "../util";
import EditorComponentSelectMenuOption from "./EditorComponentSelectMenuOption";

interface Props {
  rowIndex: number;
  rowId: number;
  compIndex: number;
  compId: number;
}

export default function EditorComponentSelectMenu({
  rowIndex,
  rowId,
  compIndex,
  compId,
}: Props) {
  const selectMenu = useCurrentMessageStore(
    (state) => state.components[rowIndex].components[compIndex],
    shallow
  );
  if (selectMenu.type !== 3) {
    return <div></div>;
  }

  const options = useCurrentMessageStore(
    (state) =>
      state.getSelectMenu(rowIndex, compIndex)?.options?.map((o) => o.id) || [],
    shallow
  );

  const [add, clearOptions] = useCurrentMessageStore(
    (state) => [state.addSelectMenuOption, state.clearSelectMenuOptions],
    shallow
  );

  function addOption() {
    add(rowIndex, compIndex, { id: getUniqueId(), label: "" });
  }

  const setPlaceholder = useCurrentMessageStore(
    (state) => state.setSelectMenuPlaceholder
  );

  return (
    <div className="space-y-4">
      <EditorInput
        label="Placeholder"
        maxLength={150}
        value={selectMenu.placeholder || ""}
        onChange={(v) => setPlaceholder(rowIndex, compIndex, v || undefined)}
      />
      <Collapsable
        id={`components.${rowId}.select.${compId}.options`}
        valiationPathPrefix={`components.${rowIndex}.components.${compIndex}.options`}
        title="Options"
      >
        <AutoAnimate className="space-y-2">
          {options.map((id, i) => (
            <div key={id}>
              <EditorComponentSelectMenuOption
                rowIndex={rowIndex}
                rowId={rowId}
                compIndex={compIndex}
                compId={compId}
                optionIndex={i}
                optionId={id}
              />
            </div>
          ))}
        </AutoAnimate>
        <div className="space-x-3 mt-3">
          {options.length < 25 ? (
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
            onClick={() => clearOptions(rowIndex, compIndex)}
          >
            Clear Options
          </button>
        </div>
      </Collapsable>
    </div>
  );
}
