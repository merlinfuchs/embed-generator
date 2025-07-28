import clsx from "clsx";
import { useState } from "react";
import { useCurrentMessageStore } from "../state/message";
import ConfirmModal from "./ConfirmModal";
import { useSendSettingsStore } from "../state/sendSettings";

export default function EditorComponentsV2Toggle() {
  const componentsV2Enabled = useCurrentMessageStore((s) =>
    s.getComponentsV2Enabled()
  );
  const setComponentV2Enabled = useCurrentMessageStore(
    (s) => s.setComponentsV2Enabled
  );

  const [componentsV2EnableModal, setComponentsV2EnableModal] = useState(false);
  const [componentsV2DisableModal, setComponentsV2DisableModal] =
    useState(false);

  const toggleComponentsV2 = () => {
    setComponentsV2DisableModal(false);
    setComponentsV2EnableModal(false);

    if (componentsV2Enabled) {
      setComponentV2Enabled(false);
    } else {
      setComponentV2Enabled(true);
    }
  };

  return (
    <div>
      <div className="flex">
        <button
          className="flex bg-dark-2 p-1 rounded text-white"
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
              "py-1 px-2 rounded transition-colors",
              !componentsV2Enabled && "bg-dark-3"
            )}
          >
            Embeds V1
          </div>
          <div
            className={clsx(
              "py-1 px-2 rounded transition-colors",
              componentsV2Enabled && "bg-dark-3"
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
            className="text-blue-400 hover:underline"
            target="_blank"
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
            className="text-blue-400 hover:underline"
            target="_blank"
          >
            Learn More
          </a>
        </ConfirmModal>
      )}
    </div>
  );
}
