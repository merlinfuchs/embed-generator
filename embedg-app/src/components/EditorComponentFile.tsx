import {
  type FileNode,
  type NodeId,
  useDocumentStore,
  useNode,
  useNodeActions,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import { useCurrentAttachmentsStore } from "../state/attachments";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import ValidationError from "./ValidationError";

interface Props {
  id: NodeId;
  title?: string;
  size?: "medium" | "large";
}

export default function EditorComponentFile({
  id,
  title = "File",
  size = "medium",
}: Props) {
  const data = useNode<FileNode>(id);
  const actions = useNodeActions(id);
  const { update } = useDocumentStore.getState();
  const attachments = useCurrentAttachmentsStore((state) => state.attachments);

  if (!data) return null;

  return (
    <EditorComponentCollapsable
      id={id}
      validationPathPrefix={nodeScope<FileNode>(id)}
      title={title}
      size={size}
      {...actions}
    >
      <div className="space-y-4">
        <div className="flex space-x-3">
          <div className="flex-auto">
            <div className="mb-1.5 flex">
              <div className="uppercase text-gray-300 text-sm font-medium">
                Attachment
              </div>
            </div>
            <select
              aria-label="Attachment"
              className="bg-dark-2 rounded p-2 w-full no-ring font-light cursor-pointer text-white"
              value={data.file.url}
              onChange={(e) =>
                update<FileNode>(id, { file: { url: e.target.value } })
              }
            >
              {attachments.map((attachment) => (
                <option
                  key={attachment.name}
                  value={`attachment://${attachment.name}`}
                >
                  {attachment.name}
                </option>
              ))}
              <option value="">Select Attachment</option>
            </select>
            <ValidationError target={nodeField<FileNode>(id, "file.url")} />
          </div>
          <div className="flex-none">
            <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
              Spoiler
            </div>
            <CheckBox
              label="Spoiler"
              checked={data.spoiler ?? false}
              onChange={(v) =>
                update<FileNode>(id, {
                  spoiler: v,
                })
              }
            />
          </div>
        </div>
      </div>
    </EditorComponentCollapsable>
  );
}
