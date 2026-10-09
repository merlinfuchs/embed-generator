import type { ReactNode } from "react";
import {
  useChildIds,
  useDocumentStoreApi,
  useDocument,
  useMessageComponentBudget,
} from "../state/document";
import {
  type EditorCapabilities,
  EditorCapabilitiesContext,
  FLUXER_MESSAGE_CAPABILITIES,
  MESSAGE_CAPABILITIES,
  WEBHOOK_MESSAGE_CAPABILITIES,
} from "../state/editorCapabilities";
import { slotScope } from "../state/validationError";
import { useSendsToFluxer, useSendSettingsStore } from "../state/sendSettings";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import EditorComponentAddDropdown from "./EditorComponentAddDropdown";
import EditorComponentEntry from "./EditorComponentEntry";
import { FluxerComponentsNotice } from "./WebhookNotice";

export default function EditorComponents({
  defaultCollapsed = true,
  capabilities: fixedCapabilities,
}: {
  defaultCollapsed?: boolean;
  /** What can be added regardless of where the message is sent. */
  capabilities?: EditorCapabilities;
}) {
  const rootId = useDocument((state) => state.rootId);
  const components = useChildIds(rootId, "components");
  const { count, limit } = useMessageComponentBudget();
  const { removeChildren } = useDocumentStoreApi().getState();

  const webhook = useSendSettingsStore((state) => state.mode) === "webhook";
  // A message with fixed capabilities isn't the one sent to the webhook.
  const sendsToFluxer = useSendsToFluxer();
  const fluxer = !fixedCapabilities && sendsToFluxer;

  // Nothing to add on Fluxer, but components already there stay so they can be removed.
  if (fluxer && components.length === 0) return null;

  let capabilities = MESSAGE_CAPABILITIES;
  let notice: ReactNode = null;
  if (fixedCapabilities) {
    capabilities = fixedCapabilities;
  } else if (fluxer) {
    capabilities = FLUXER_MESSAGE_CAPABILITIES;
    notice = <FluxerComponentsNotice className="mb-3" />;
  } else if (webhook) {
    capabilities = WEBHOOK_MESSAGE_CAPABILITIES;
  }

  return (
    <EditorCapabilitiesContext.Provider value={capabilities}>
      <Collapsable
        id="components"
        title="Components"
        size="large"
        defaultCollapsed={defaultCollapsed}
        validationPathPrefix={slotScope(rootId, "components")}
        extra={
          <div className="flex space-x-2">
            <div className="text-sm italic font-light text-mist-400">
              {count} / {limit}
            </div>
            <div className="bg-azure-500 px-1 rounded-lg text-white text-xs items-center flex font-bold">
              ADVANCED
            </div>
          </div>
        }
      >
        {notice}
        <AutoAnimate className="space-y-3 mb-3">
          {components.map((id) => (
            <div key={id}>
              <EditorComponentEntry id={id} root={true} />
            </div>
          ))}
        </AutoAnimate>
        <div className="flex flex-wrap gap-3 items-center">
          <EditorComponentAddDropdown
            context="root"
            size="large"
            parentId={rootId}
            disabled={count >= limit}
          />

          <button
            className="px-3 py-2.5 rounded-lg text-white border-2 border-red/70 hover:bg-red hover:border-red transition-colors whitespace-nowrap"
            onClick={() => removeChildren(rootId, "components")}
          >
            Clear Components
          </button>
        </div>
      </Collapsable>
    </EditorCapabilitiesContext.Provider>
  );
}
