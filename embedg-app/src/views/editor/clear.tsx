import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal";
import { defaultMessage, useCurrentMessageStore } from "../../state/message";

export default function ClearView() {
  const navigate = useNavigate();

  function clear() {
    useCurrentMessageStore.setState(defaultMessage);
    navigate("/editor");
  }

  return (
    <ConfirmModal
      title="Are you sure that you want to clear everything from the editor?"
      subTitle="All your progress will be lost if you haven't saved the message."
      onClose={() => navigate("/editor")}
      onConfirm={clear}
    />
  );
}
