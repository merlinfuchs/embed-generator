import { useNavigate, useParams } from "react-router-dom";
import MessageRestoreModal from "../../components/MessageRestoreModal";
import { useSharedMessageQuery } from "../../api/queries";
import { useMemo } from "react";
import { useToasts } from "../../util/toasts";
import { parseMessageWithAction } from "../../discord/importSchema";
import { setCurrentMessage } from "../../state/currentMessage";

export default function ShareRestoreView() {
  const { sharedMessageId } = useParams();

  const navigate = useNavigate();

  const { data: sharedMessage } = useSharedMessageQuery(
    sharedMessageId || null,
  );

  const createToast = useToasts((state) => state.create);

  const parsedData = useMemo(() => {
    if (!sharedMessage) return null;

    if (sharedMessage.success) {
      try {
        const parsedData = parseMessageWithAction(sharedMessage.data.data);
        return parsedData;
      } catch (e) {
        createToast({
          type: "error",
          title: "Failed to parse shared message",
          message: `${e}`,
        });
        console.error(e);
      }
    } else {
      createToast({
        title: "Failed to load shared message",
        message: `${sharedMessage.error.message}`,
        type: "error",
      });
    }

    return null;
  }, [sharedMessage]);

  function save() {
    if (parsedData) {
      setCurrentMessage(parsedData);
      navigate("/editor");
    }
  }

  return (
    <MessageRestoreModal
      msg={parsedData}
      onRestore={save}
      onClose={() => navigate("/editor")}
    />
  );
}
