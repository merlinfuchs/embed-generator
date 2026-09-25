import { useNavigate } from "react-router-dom";
import EditorAllowedMentions from "../../components/EditorAllowedMentions";
import Modal from "../../components/Modal";

export default function MessageSettingsView() {
  const navigate = useNavigate();

  return (
    <Modal width="sm" onClose={() => navigate("/editor")}>
      <div className="p-4">
        <div className="text-lg mb-5 text-white">Message Settings</div>
        <EditorAllowedMentions />
        <div className="flex justify-end mt-5">
          <button
            className="px-3 py-2 rounded-lg text-white bg-ink-600 hover:bg-ink-500"
            onClick={() => navigate("/editor")}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
