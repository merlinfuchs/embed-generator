import { slotLimit, useChildIds, useDocumentStore } from "../state/document";
import { slotScope } from "../state/validationError";
import { useSendSettingsStore } from "../state/sendSettings";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorComponentAddDropdown from "./EditorComponentAddDropdown";
import EditorComponentEntry from "./EditorComponentEntry";

export default function EditorComponents({
  defaultCollapsed = true,
}: {
  defaultCollapsed?: boolean;
}) {
  const rootId = useDocumentStore((state) => state.rootId);
  const components = useChildIds(rootId, "components");
  const { removeChildren } = useDocumentStore.getState();

  const sendMode = useSendSettingsStore((state) => state.mode);

  return (
    <Collapsable
      id="components"
      title="Components"
      size="large"
      defaultCollapsed={defaultCollapsed}
      validationPathPrefix={slotScope(rootId, "components")}
      extra={
        <div className="flex space-x-2">
          <div className="text-sm italic font-light text-gray-400">
            {components.length} / {slotLimit("message", "components")}
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
        {components.map((id) => (
          <div key={id}>
            <EditorComponentEntry id={id} root={true} />
          </div>
        ))}
      </AutoAnimate>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 items-center">
        <EditorComponentAddDropdown
          context="root"
          size="large"
          parentId={rootId}
          disabled={components.length >= slotLimit("message", "components")}
        />

        <button
          className="px-3 py-2.5 rounded text-white border-red border-2 hover:bg-red"
          onClick={() => removeChildren(rootId, "components")}
        >
          Clear Components
        </button>
      </div>
    </Collapsable>
  );
}
