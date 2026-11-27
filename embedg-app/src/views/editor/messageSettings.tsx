import { closeEditorDialog } from "../../state/editorPanels";
import EditorAllowedMentions from "../../components/EditorAllowedMentions";
import EditorSilentSetting from "../../components/EditorSilentSetting";
import Modal from "../../components/Modal";

export default function MessageSettingsView() {
  return (
    <Modal width="sm" onClose={() => closeEditorDialog()}>
      <div className="p-4">
        <div className="text-lg mb-5 text-white">Message Settings</div>
        <EditorAllowedMentions />
        <div className="mt-5">
          <EditorSilentSetting />
        </div>
        <div className="flex justify-end mt-5">
          <button
            className="px-3 py-2 rounded-lg text-white bg-ink-600 hover:bg-ink-500"
            onClick={() => closeEditorDialog()}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
