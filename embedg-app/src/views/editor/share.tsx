import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { useCurrentMessageStore } from "../../state/message";
import { useSharedMessageCreateMutation } from "../../api/mutations";
import { useEffect, useRef, useState } from "react";
import { useToasts } from "../../util/toasts";

export default function ShareView() {
  const navigate = useNavigate();

  const [shareUrl, setShareUrl] = useState("");

  const shareCreateMutation = useSharedMessageCreateMutation();

  const createToast = useToasts((state) => state.create);

  useEffect(() => {
    shareCreateMutation.mutate(
      {
        data: useCurrentMessageStore.getState(),
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
      }
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
          className="px-3 py-2 bg-dark-2 rounded w-full focus:outline-none text-white mb-5"
          readOnly
          ref={inputRef}
        />
        <div className="space-x-2 flex justify-end">
          <button
            className="px-3 py-2 rounded text-white bg-blurple hover:bg-blurple-dark"
            onClick={copy}
          >
            Copy URL
          </button>
          <button
            className="px-3 py-2 rounded text-white bg-dark-6 hover:bg-dark-7"
            onClick={() => navigate("/editor")}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
