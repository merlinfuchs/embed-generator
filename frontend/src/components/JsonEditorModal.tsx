import BaseModal from "./BaseModal";
import JsonEditor from "./JsonEditor";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function JsonEditorModal({ visible, setVisible }: Props) {
  return (
    <BaseModal visible={visible} setVisible={setVisible}>
      <JsonEditor />
    </BaseModal>
  );
}
