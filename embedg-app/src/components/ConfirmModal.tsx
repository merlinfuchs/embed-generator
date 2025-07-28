import Modal from "./Modal";

interface Props {
  title: string;
  subTitle: string;
  children?: React.ReactNode;

  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  title,
  subTitle,
  children,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal width="xs" onClose={onClose}>
      <div className="p-4">
        <div className="p-1 mb-5">
          <div className="text-white mb-2">{title}</div>
          <div className="text-gray-300 text-sm whitespace-normal">
            {subTitle}
          </div>

          {children && (
            <div className="text-gray-300 text-sm whitespace-normal mt-3">
              {children}
            </div>
          )}
        </div>
        <div className="space-x-2 flex justify-end">
          <button
            className="px-3 py-2 rounded text-white bg-dark-6 hover:bg-dark-7"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded border-2 border-red hover:bg-red transition-colors text-white"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
