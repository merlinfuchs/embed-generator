import clsx from "clsx";
import { useState } from "react";
import { useComponentsV2Enabled, useDocumentStoreApi } from "../state/document";
import ConfirmModal from "./ConfirmModal";

export default function EditorComponentsV2Toggle() {
  const store = useDocumentStoreApi();
  const componentsV2Enabled = useComponentsV2Enabled();
  const [componentsV2EnableModal, setComponentsV2EnableModal] = useState(false);
  const [componentsV2DisableModal, setComponentsV2DisableModal] =
    useState(false);

  const toggleComponentsV2 = () => {
    setComponentsV2DisableModal(false);
    setComponentsV2EnableModal(false);

    store.getState().setComponentsV2(!componentsV2Enabled);
  };

  return (
    <div>
      <div className="flex">
        <button
          className="flex bg-ink-900 p-1 rounded-lg border border-white/10 text-sm font-medium text-mist-400"
          onClick={() => {
            if (componentsV2Enabled) {
              setComponentsV2DisableModal(true);
            } else {
              setComponentsV2EnableModal(true);
            }
          }}
        >
          <div
            className={clsx(
              "py-1 px-3 rounded-md transition-colors",
              !componentsV2Enabled && "bg-ink-700 text-mist-100",
            )}
          >
            Embeds V1
          </div>
          <div
            className={clsx(
              "py-1 px-3 rounded-md transition-colors",
              componentsV2Enabled && "bg-ink-700 text-mist-100",
            )}
          >
            Components V2
          </div>
        </button>
      </div>

      {componentsV2EnableModal && (
        <ConfirmModal
          title="Are you sure that you want to enable Components V2?"
          subTitle="This will change the way the editor works and will remove all existing data."
          onClose={() => setComponentsV2EnableModal(false)}
          onConfirm={toggleComponentsV2}
        >
          <a
            href="https://message.style/docs/features/components-v2"
            aria-label="Learn more about Components V2"
            className="text-blue-400 hover:underline"
            target="_blank"
            rel="noopener"
          >
            Learn More
          </a>
        </ConfirmModal>
      )}
      {componentsV2DisableModal && (
        <ConfirmModal
          title="Are you sure that you want to disable Components V2?"
          subTitle="This will change the way the editor works and will remove all existing data."
          onClose={() => setComponentsV2DisableModal(false)}
          onConfirm={toggleComponentsV2}
        >
          <a
            href="https://message.style/docs/features/components-v2"
            aria-label="Learn more about Components V2"
            className="text-blue-400 hover:underline"
            target="_blank"
            rel="noopener"
          >
            Learn More
          </a>
        </ConfirmModal>
      )}
    </div>
  );
}
