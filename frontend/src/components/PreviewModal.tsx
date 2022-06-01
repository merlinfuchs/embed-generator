import BaseModal from "./BaseModal";
import Preview from "./Preview";

interface Props {
  visible: boolean;
}

export default function PreviewModal({ visible }: Props) {
  return (
    <BaseModal visible={visible} size="large">
      <Preview />
    </BaseModal>
  );
}
