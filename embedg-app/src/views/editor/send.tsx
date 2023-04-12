import EditorModal from "../../components/EditorModal";
import SendMenu from "../../components/SendMenu";

export default function SendView() {
  return (
    <EditorModal>
      <div className="p-4">
        <SendMenu />
      </div>
    </EditorModal>
  );
}
