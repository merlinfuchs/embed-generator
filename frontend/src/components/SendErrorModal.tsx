import BaseModal from "./BaseModal";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  body: any;
}

export default function SendErrorModal({ visible, setVisible, body }: Props) {
  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <div className="space-y-3">
        <div className="text-lg">Failed to send message</div>
        <div className="h-32 overflow-y-auto bg-dark-2 rounded py-1 px-2 whitespace-pre overflow-x-auto max-h-96">
          {JSON.stringify(body, undefined, 4)}
        </div>
        <div className="flex justify-end space-x-2">
          <button
            className="border-2 border-dark-7 px-3 py-2 rounded transition-colors hover:bg-dark-6"
            onClick={() => setVisible(false)}
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
