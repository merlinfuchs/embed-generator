import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { useSharedMessageCreateMutation } from "../../api/mutations";
import { useEffect, useRef, useState } from "react";
import { useToasts } from "../../util/toasts";
import { getCurrentMessage } from "../../state/currentMessage";

export default function ShareView() {
  const navigate = useNavigate();

  const [shareUrl, setShareUrl] = useState("");

  const shareCreateMutation = useSharedMessageCreateMutation();

  const createToast = useToasts((state) => state.create);

  useEffect(() => {
    shareCreateMutation.mutate(
      {
        data: getCurrentMessage(),
      },
      {
        onSuccess: (resp) => {
          if (resp.success) {
            setShareUrl(resp.data.url);
          } else {
            createToast({
              title: "Failed to create share",
              message: `${resp.error}`,
              type: "error",
            });
          }
        },
      },
    );
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  function copy() {
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999);
      document.execCommand("copy");
      createToast({
        title: "Copied URL",
        message: "The URL has been copied to your clipboard",
        type: "success",
      });
    }
  }

  return (
    <Modal width="xs" onClose={() => navigate("/editor")}>
      <div className="p-4">
        <div className="text-lg mb-5 text-white">
          Copy the URL below to share your message
        </div>
        <input
          type="text"
          value={shareUrl}
          className="px-3 py-2 bg-ink-900 rounded-lg w-full focus:outline-none text-white mb-5"
          readOnly
          ref={inputRef}
        />
        <div className="space-x-2 flex justify-end">
          <button
            className="px-3 py-2 rounded-lg text-white bg-azure-500 hover:bg-azure-400"
            onClick={copy}
          >
            Copy URL
          </button>
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
