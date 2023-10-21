import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { useCurrentMessageStore } from "../../state/message";
import MessagePreview from "../../components/MessagePreview";
import { useSharedMessageQuery } from "../../api/queries";
import { useMemo } from "react";
import { useToasts } from "../../util/toasts";
import { parseMessageWithAction } from "../../discord/restoreSchema";

export default function ShareRestoreView() {
  const { sharedMessageId } = useParams();

  const navigate = useNavigate();

  const { data: sharedMessage } = useSharedMessageQuery(
    sharedMessageId || null
  );

  const createToast = useToasts((state) => state.create);

  const parsedData = useMemo(() => {
    if (!sharedMessage) return null;

    if (sharedMessage.success) {
      try {
        console.log(sharedMessage.data.data);
        const parsedData = parseMessageWithAction(sharedMessage.data.data);
        return parsedData;
      } catch (e) {
        createToast({
          type: "error",
          title: "Failed to parse shared message",
          message: `${e}`,
        });
      }
    } else {
      createToast({
        title: "Failed to load shared message",
        message: `${sharedMessage.error}`,
        type: "error",
      });
    }

    return null;
  }, [sharedMessage]);

  function save() {
    if (parsedData) {
      useCurrentMessageStore.setState(parsedData);
      navigate("/editor");
    }
  }

  return (
    <Modal width="md" onClose={() => navigate("/editor")}>
      <div className="flex flex-col">
        <div className="rounded-r-xl bg-dark-4 overflow-y-auto">
          <div className="rounded text-white h-full px-5 py-3">
            {parsedData && <MessagePreview msg={parsedData} />}
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-3">
          <button
            className="text-white px-3 py-2 rounded border-2 border-red hover:bg-red"
            onClick={() => navigate("/editor")}
          >
            Cancel
          </button>
          <button
            className="text-white px-3 py-2 rounded border-2 border-green hover:bg-green"
            onClick={save}
          >
            Restore
          </button>
        </div>
      </div>
    </Modal>
  );
}
