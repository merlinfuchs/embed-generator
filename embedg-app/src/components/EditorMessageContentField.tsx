import { type MessageNode, useDocumentStore, useNode } from "../state/document";
import { nodeField } from "../state/validationError";
import EditorInput from "./EditorInput";

export default function EditorMessageContentField() {
  const rootId = useDocumentStore((state) => state.rootId);
  const root = useNode<MessageNode>(rootId);
  const { update } = useDocumentStore.getState();

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
