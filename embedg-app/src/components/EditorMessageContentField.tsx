import {
  type MessageNode,
  useNode,
  useDocumentStoreApi,
  useDocument,
} from "../state/document";
import { nodeField } from "../state/validationError";
import EditorInput from "./EditorInput";

export default function EditorMessageContentField() {
  const rootId = useDocument((state) => state.rootId);
  const root = useNode<MessageNode>(rootId);
  const { update } = useDocumentStoreApi().getState();

  return (
    <div>
      <EditorInput
        type="textarea"
        label="Content"
        value={root?.content ?? ""}
        onChange={(v) => update<MessageNode>(rootId, { content: v })}
        maxLength={2000}
        validationPath={nodeField<MessageNode>(rootId, "content")}
        controls={true}
      />
    </div>
  );
}
