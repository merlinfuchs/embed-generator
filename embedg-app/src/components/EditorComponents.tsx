import { useCurrentMessageStore } from "../state/message";
import { shallow } from "zustand/shallow";
import { useCollapsedStatesStore } from "../state/collapsed";
import clsx from "clsx";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentRow from "./EditorComponentRow";
import Collapsable from "./Collapsable";
import { useSendSettingsStore } from "../state/sendSettings";

export default function EditorComponents() {
  const components = useCurrentMessageStore(
    (state) => state.components.map((e) => e.id),
    shallow
  );
  const addRow = useCurrentMessageStore((state) => state.addComponentRow);
  const clearComponents = useCurrentMessageStore(
    (state) => state.clearComponentRows
  );

  function addButtonRow() {
    if (components.length >= 5) return;
    addRow({
      id: getUniqueId(),
      type: 1,
      components: [],
    });
  }

  function addSelectMenuRow() {
    if (components.length >= 5) return;
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

  const sendMode = useSendSettingsStore((state) => state.mode);

  return (
    <Collapsable
      id="components"
      title="Components"
      size="large"
      defaultCollapsed={true}
      valiationPathPrefix="components"
      extra={
        <div className="flex space-x-2">
          <div className="text-sm italic font-light text-gray-400">
            {components.length} / 5
          </div>
          <div className="bg-blurple px-1 rounded text-white text-xs items-center flex items-center font-bold">
            EARLY ACCESS
          </div>
        </div>
      }
    >
      {sendMode === "webhook" && (
        <div className="text-orange-300 mb-3 text-sm font-light">
          Interactive components are only available when selecting a server and
          channel at the top instead of sending to a webhook.
        </div>
      )}
      <AutoAnimate className="space-y-3 mb-3">
        {components.map((id, i) => (
          <div key={id}>
            <EditorComponentRow rowIndex={i} rowId={id} />
          </div>
        ))}
      </AutoAnimate>
      <div className="space-x-3">
        <button
          className={clsx(
            "px-3 py-2 rounded text-white",
            components.length < 5
              ? "bg-blurple hover:bg-blurple-dark"
              : "bg-dark-3 cursor-not-allowed"
          )}
          onClick={addButtonRow}
        >
          Add Button Row
        </button>
        <button
          className={clsx(
            "px-3 py-2 rounded text-white",
            components.length < 5
              ? "bg-blurple hover:bg-blurple-dark"
              : "bg-dark-3 cursor-not-allowed"
          )}
          onClick={addSelectMenuRow}
        >
          Add Select Menu
        </button>
        <button
          className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
          onClick={clearComponents}
        >
          Clear Rows
        </button>
      </div>
    </Collapsable>
  );
}
