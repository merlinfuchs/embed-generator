import { useState } from "react";
import { useCurrentMessageStore } from "../state/message";
import EditorIconButton from "./EditorIconButton";
import { SquaresPlusIcon } from "@heroicons/react/20/solid";
import ConfirmModal from "./ConfirmModal";

export default function EditorComponentsV2Button() {
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
      <EditorIconButton
        onClick={() => {
          if (componentsV2Enabled) {
            setComponentsV2DisableModal(true);
          } else {
            setComponentsV2EnableModal(true);
          }
        }}
        label={
          componentsV2Enabled ? "Disable Components V2" : "Enable Components V2"
        }
        highlight={componentsV2Enabled}
      >
        <SquaresPlusIcon />
      </EditorIconButton>

      {componentsV2EnableModal && (
        <ConfirmModal
          title="Are you sure that you want to enable Components V2?"
          subTitle="This will change the way the editor works and will remove all existing data."
          onClose={() => setComponentsV2EnableModal(false)}
          onConfirm={toggleComponentsV2}
        />
      )}
      {componentsV2DisableModal && (
        <ConfirmModal
          title="Are you sure that you want to disable Components V2?"
          subTitle="This will change the way the editor works and will remove all existing data."
          onClose={() => setComponentsV2DisableModal(false)}
          onConfirm={toggleComponentsV2}
        />
      )}
    </div>
  );
}
