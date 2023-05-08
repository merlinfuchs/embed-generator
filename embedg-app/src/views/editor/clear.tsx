import { useNavigate } from "react-router-dom";
import EditorModal from "../../components/EditorModal";
import { defaultMessage, useCurrentMessageStore } from "../../state/message";

export default function ClearView() {
  const navigate = useNavigate();

  function clear() {
    useCurrentMessageStore.setState(defaultMessage);
    navigate("/");
  }

  return (
    <EditorModal width="xs">
      <div className="p-4">
        <div className="p-1 mb-5">
          <div className="text-white mb-2">
            Are you sure that you want to clear everything from the editor?
          </div>
          <div className="text-gray-300 text-sm">
            All your progress will be lost if you haven't saved the message.
          </div>
        </div>
        <div className="space-x-2 flex justify-end">
          <button
            className="px-3 py-2 rounded text-white bg-dark-6 hover:bg-dark-7"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
            onClick={clear}
          >
            Clear Message
          </button>
        </div>
      </div>
    </EditorModal>
  );
}
