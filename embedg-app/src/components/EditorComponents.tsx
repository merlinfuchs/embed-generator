import { useCurrentMessageStore } from "../state/message";
import { shallow } from "zustand/shallow";
import { useCollapsedStatesStore } from "../state/collapsed";
import clsx from "clsx";
import { getUniqueId } from "../util";
import { AutoAnimate } from "../util/autoAnimate";
import EditorComponentRow from "./EditorComponentRootActionRow";
import Collapsable from "./Collapsable";
import { useSendSettingsStore } from "../state/sendSettings";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import EditorComponentAddDropdown from "./EditorComponentAddDropdown";
import EditorComponentRoot from "./EditorComponentRoot";

export default function EditorComponents({
  defaultCollapsed = true,
}: {
  defaultCollapsed?: boolean;
}) {
  const components = useCurrentMessageStore(
    (state) => state.components.map((e) => e.id),
    shallow
  );
  const clearRootComponents = useCurrentMessageStore(
    (state) => state.clearRootComponents
  );

  const sendMode = useSendSettingsStore((state) => state.mode);

  return (
    <Collapsable
      id="components"
      title="Components"
      size="large"
      defaultCollapsed={defaultCollapsed}
      valiationPathPrefix="components"
      extra={
        <div className="flex space-x-2">
          <div className="text-sm italic font-light text-gray-400">
            {components.length} / 5
          </div>
          <div className="bg-blurple px-1 rounded text-white text-xs items-center flex font-bold">
            ADVANCED
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
            <EditorComponentRoot rootIndex={i} rootId={id} />
          </div>
        ))}
      </AutoAnimate>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 items-start">
        <EditorComponentAddDropdown />

        <button
          className="px-3 py-2 rounded text-white border-red border-2 hover:bg-red"
          onClick={clearRootComponents}
        >
          Clear Components
        </button>
      </div>
    </Collapsable>
  );
}
