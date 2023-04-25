import { useCurrentMessageStore } from "../state/message";
import { shallow } from "zustand/shallow";
import { useCollapsedStatesStore } from "../state/collapsed";
import clsx from "clsx";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentRow from "./EditorComponentRow";
import Collapsable from "./Collapsable";

export default function EditorComponents() {
  const components = useCurrentMessageStore(
    (state) => state.components.map((e) => e.id),
    shallow
  );
  const addRow = useCurrentMessageStore((state) => state.addComponentRow);
  const clearComponents = useCurrentMessageStore(
    (state) => state.clearComponentRows
  );

  const clearCollapsedWithPrefix = useCollapsedStatesStore(
    (state) => state.clearCollapsedWithPrefix
  );

  function clear() {
    clearComponents();
    clearCollapsedWithPrefix("components");
  }

  function addButtonRow() {
    addRow({
      id: getUniqueId(),
      type: 1,
      components: [],
    });
  }

  function addSelectMenuRow() {
    addRow({
      id: getUniqueId(),
      type: 1,
      components: [
        {
          id: getUniqueId(),
          type: 3,
          options: [],
        },
      ],
    });
  }

  return (
    <Collapsable
      id="components"
      title="Components"
      size="large"
      defaultCollapsed={true}
      valiationPathPrefix="components"
    >
      <AutoAnimate>
        {components.map((id, i) => (
          <div key={id}>
            <EditorComponentRow rowIndex={i} rowId={id} />
          </div>
        ))}
      </AutoAnimate>
      <div className="space-x-3">
        <button
          className="bg-blurple px-3 py-2 rounded text-white hover:bg-blurple-dark"
          onClick={addButtonRow}
        >
          Add Button Row
        </button>
        <button
          className="bg-blurple px-3 py-2 rounded text-white hover:bg-blurple-dark"
          onClick={addSelectMenuRow}
        >
          Add Select Menu
        </button>
        <button
          className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
          onClick={clear}
        >
          Clear Row
        </button>
      </div>
    </Collapsable>
  );
}
