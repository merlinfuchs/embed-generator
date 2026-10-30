import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MessageRestoreModal from "../../components/MessageRestoreModal";
import Notice from "../../components/Notice";
import { parseDataLink } from "../../discord/dataLink";
import { setCurrentMessage } from "../../state/currentMessage";
import { op } from "../../util/analytics";
import { useToasts } from "../../util/toasts";

/** Opens a message from a ?data= link, ours or Discohook's. */
export default function DataRestoreView() {
  const [searchParams] = useSearchParams();
  const dataParam = searchParams.get("data");

  const navigate = useNavigate();
  const createToast = useToasts((state) => state.create);

  const parsed = useMemo(() => {
    try {
      return dataParam ? parseDataLink(dataParam) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [dataParam]);

  const close = () => navigate("/editor", { replace: true });

  useEffect(() => {
    if (parsed) return;

    createToast({
      type: "error",
      title: "Failed to open message link",
      message: "The link doesn't contain a valid message.",
    });
    close();
  }, [parsed]);

  if (!parsed) return null;

  // Actions don't show in the preview, and one from a stranger's link could hand out roles.
  const hasActions = Object.values(parsed.message.actions).some(
    (set) => set.actions.length > 0,
  );

  const restore = () => {
    setCurrentMessage(parsed.message);
    op.track("data_link_restored", { messages: parsed.messageCount });
    close();
  };

  return (
    <MessageRestoreModal
      msg={parsed.message}
      notice={
        (parsed.messageCount > 1 || hasActions) && (
          <div className="space-y-2">
            {parsed.messageCount > 1 && (
              <Notice tone="warning">
                The link contains {parsed.messageCount} messages. Only the first
                one can be opened.
              </Notice>
            )}
            {hasActions && (
              <Notice tone="warning">
                The buttons or select menus in this message have actions, like
                giving out roles. Check them before you send it.
              </Notice>
            )}
          </div>
        )
      }
      onRestore={restore}
      onClose={close}
    />
  );
}
