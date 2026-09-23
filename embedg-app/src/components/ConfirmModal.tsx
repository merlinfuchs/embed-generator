import Modal from "./Modal";

interface Props {
  title: string;
  subTitle: string;
  children?: React.ReactNode;

  /** Disables Confirm while the action it starts is in flight, so it can't be started twice. */
  pending?: boolean;

  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  title,
  subTitle,
  children,
  pending,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal width="xs" onClose={onClose}>
      <div className="p-4">
        <div className="p-1 mb-5">
          <div className="text-white mb-2">{title}</div>
          <div className="text-mist-300 text-sm whitespace-normal">
            {subTitle}
          </div>

          {children && (
            <div className="text-mist-300 text-sm whitespace-normal mt-3">
              {children}
            </div>
          )}
        </div>
        <div className="space-x-2 flex justify-end">
          <button
            className="px-3 py-2 rounded-lg text-mist-100 border-2 border-white/15 hover:bg-white/5 hover:border-white/30 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-red/90 hover:bg-red transition-colors text-white font-medium disabled:bg-ink-900 disabled:hover:bg-ink-900"
            disabled={pending}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
