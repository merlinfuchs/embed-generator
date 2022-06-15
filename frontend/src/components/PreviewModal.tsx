import { XIcon } from "@heroicons/react/outline";
import BaseModal from "./BaseModal";
import Preview from "./Preview";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function PreviewModal({ visible, setVisible }: Props) {
  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <div className="max-h-full overflow-hidden flex flex-col">
        <div className="flex-none flex justify-end pb-2">
          <XIcon
            className="text-gray-300 w-6 h-6 cursor-pointer"
            onClick={() => setVisible(false)}
          />
        </div>
        <div className="flex-auto max-h-full overflow-y-auto px-2">
          <Preview />
        </div>
      </div>
    </BaseModal>
  );
}
