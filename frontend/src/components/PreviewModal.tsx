import BaseModal from "./BaseModal";

interface Props {
  visible: boolean;
}

export default function PreviewModal({ visible }: Props) {
  return (
    <BaseModal visible={visible} size="large">
      d
    </BaseModal>
  );
}
