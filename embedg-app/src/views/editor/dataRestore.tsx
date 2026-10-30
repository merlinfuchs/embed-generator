import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MessageRestoreModal from "../../components/MessageRestoreModal";
import Notice from "../../components/Notice";
import { parseDataLink } from "../../discord/dataLink";
import { setCurrentMessage } from "../../state/currentMessage";
import { op } from "../../util/analytics";
import { useToasts } from "../../util/toasts";

/** Opens a message from a ?data= link, the format Discohook uses for its links. */
export default function DataRestoreView() {
  const [searchParams] = useSearchParams();
  const dataParam = searchParams.get("data");

  const navigate = useNavigate();
  const createToast = useToasts((state) => state.create);

  const parsed = useMemo(() => {
    if (!dataParam) return null;

    try {
      return parseDataLink(dataParam);
    } catch (e) {
      console.error(e);
      return "invalid" as const;
    }
  }, [dataParam]);

  useEffect(() => {
    if (parsed !== "invalid") return;

    createToast({
      type: "error",
      title: "Failed to open message link",
      message: "The link doesn't contain a valid message.",
    });
    navigate("/editor", { replace: true });
  }, [parsed]);

  if (!parsed || parsed === "invalid") return null;

  function restore() {
    if (!parsed || parsed === "invalid") return;

    setCurrentMessage(parsed.message);
    op.track("data_link_restored", { messages: parsed.messageCount });
    navigate("/editor", { replace: true });
  }

  return (
    <MessageRestoreModal
      msg={parsed.message}
      notice={
        parsed.messageCount > 1 && (
          <Notice tone="warning">
            The link contains {parsed.messageCount} messages. Only the first one
            can be opened.
          </Notice>
        )
      }
      onRestore={restore}
      onClose={() => navigate("/editor", { replace: true })}
    />
  );
}
