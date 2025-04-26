import { shallow } from "zustand/shallow";
import { useCurrentMessageStore } from "../state/message";
import Collapsable from "./Collapsable";
import EditorInput from "./EditorInput";
import { AutoAnimate } from "../util/autoAnimate";
import { getUniqueId } from "../util";
import EditorComponentChildSelectMenuOption from "./EditorComponentChildSelectMenuOption";
import CheckBox from "./CheckBox";

interface Props {
  rootIndex: number;
  rootId: number;
  childIndex: number;
  childId: number;
}

export default function EditorComponentChildSelectMenu({
  rootIndex,
  rootId,
  childIndex,
  childId,
}: Props) {
  const selectMenu = useCurrentMessageStore(
    (state) => state.getSelectMenu(rootIndex, childIndex),
    shallow
  );
  if (selectMenu?.type !== 3) {
    return <div></div>;
  }

  const options = useCurrentMessageStore(
    (state) =>
      state.getSelectMenu(rootIndex, childIndex)?.options?.map((o) => o.id) ||
      [],
    shallow
  );

  const [add, clearOptions] = useCurrentMessageStore(
    (state) => [state.addSubComponentOption, state.clearSubComponentOptions],
    shallow
  );

  function addOption() {
    add(rootIndex, childIndex, {
      id: getUniqueId(),
      label: "",
      action_set_id: getUniqueId().toString(),
    });
  }

  const setPlaceholder = useCurrentMessageStore(
    (state) => state.setSubComponentPlaceholder
  );

  const setDisabled = useCurrentMessageStore(
    (state) => state.setSubComponentDisabled
  );

  return (
    <div className="space-y-4">
      <div className="flex space-x-3">
        <EditorInput
          label="Placeholder"
          maxLength={150}
          value={selectMenu.placeholder || ""}
          onChange={(v) =>
            setPlaceholder(rootIndex, childIndex, v || undefined)
          }
          className="flex-auto"
        />
        <div className="flex-none">
          <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
            Disabled
          </div>
          <CheckBox
            checked={selectMenu.disabled ?? false}
            onChange={(v) => setDisabled(rootIndex, childIndex, v)}
          />
        </div>
      </div>
      <Collapsable
        id={`components.${rootId}.select.${childId}.options`}
        valiationPathPrefix={`components.${rootIndex}.components.${childIndex}.options`}
        title="Options"
      >
        <AutoAnimate className="space-y-2">
          {options.map((id, i) => (
            <div key={id}>
              <EditorComponentChildSelectMenuOption
                rootIndex={rootIndex}
                rootId={rootId}
                childIndex={childIndex}
                childId={childId}
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
            onClick={() => clearOptions(rootIndex, childIndex)}
          >
            Clear Options
          </button>
        </div>
      </Collapsable>
    </div>
  );
}
