import BaseModal from "./BaseModal";

interface Props {
  visible: boolean;
  onClose: (confirmed: boolean) => void;
}

export default function ConfirmModal({ visible, onClose }: Props) {
  return (
    <BaseModal visible={visible} setVisible={() => onClose(false)} size="small">
      <div></div>
    </BaseModal>
  );
}
