import EditorModal from "../../components/EditorModal";
import SendMenu from "../../components/SendMenu";

export default function SendView() {
  return (
    <EditorModal width="md">
      <div className="p-4">
        <SendMenu />
      </div>
    </EditorModal>
  );
}
