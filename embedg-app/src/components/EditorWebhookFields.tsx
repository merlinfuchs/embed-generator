import {
  type MessageNode,
  useNode,
  useDocumentStoreApi,
  useDocument,
} from "../state/document";
import { nodeField } from "../state/validationError";
import EditorInput from "./EditorInput";

export default function EditorWebhookFields() {
  const rootId = useDocument((state) => state.rootId);
  const root = useNode<MessageNode>(rootId);
  const { update } = useDocumentStoreApi().getState();

  return (
    <div>
      <div className="flex space-x-3 mb-5">
        <div className="w-1/2">
          <EditorInput
            label="Username"
            value={root?.username || ""}
            onChange={(v) =>
              update<MessageNode>(rootId, { username: v || undefined })
            }
            maxLength={80}
            validationPath={nodeField<MessageNode>(rootId, "username")}
          />
        </div>
        <div className="w-1/2 flex space-x-2 items-end">
          <EditorInput
            type="url"
            label="Avatar URL"
            value={root?.avatar_url || ""}
            onChange={(v) =>
              update<MessageNode>(rootId, { avatar_url: v || undefined })
            }
            validationPath={nodeField<MessageNode>(rootId, "avatar_url")}
            className="flex-auto"
            imageUpload={true}
          />
        </div>
      </div>
    </div>
  );
}
