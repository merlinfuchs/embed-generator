import type { ReactNode } from "react";
import Modal from "./Modal";
import MessagePreview from "./MessagePreview";
import type { Message } from "../discord/schema";

interface Props {
  msg: Message | null;
  notice?: ReactNode;
  onRestore: () => void;
  onClose: () => void;
}

/** Previews a message from a link and asks before it replaces the draft. */
export default function MessageRestoreModal({
  msg,
  notice,
  onRestore,
  onClose,
}: Props) {
  return (
    <Modal width="md" onClose={onClose}>
      <div className="flex flex-col overflow-y-hidden">
        <div className="rounded-r-xl bg-ink-800 overflow-y-scroll flex-auto max-h-[300px] sm:max-h-[500px]">
          <div className="rounded-lg text-white h-full px-5 py-3">
            {msg && <MessagePreview msg={msg} />}
          </div>
        </div>
        {notice && <div className="px-3 pt-3">{notice}</div>}
        <div className="flex flex-none justify-end space-x-3 p-3">
          <button
            className="text-white px-3 py-2 rounded-lg border-2 border-red/70 hover:bg-red hover:border-red transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="text-white px-3 py-2 rounded-lg border-2 border-green/70 hover:bg-green hover:border-green hover:text-ink-900 transition-colors"
            onClick={onRestore}
          >
            Restore
          </button>
        </div>
      </div>
    </Modal>
  );
}
