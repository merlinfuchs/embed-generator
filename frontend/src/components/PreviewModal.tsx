import BaseModal from "./BaseModal";
import Preview from "./Preview";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function PreviewModal({ visible, setVisible }: Props) {
  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <Preview />
    </BaseModal>
  );
}
