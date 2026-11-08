import {
  type FileNode,
  type NodeId,
  useNode,
  useNodeActions,
  useDocumentStoreApi,
} from "../state/document";
import { nodeField, nodeScope } from "../state/validationError";
import { useAttachmentForUrl } from "../state/attachments";
import CheckBox from "./CheckBox";
import EditorComponentCollapsable from "./EditorComponentCollapsable";
import EditorInput from "./EditorInput";

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
  const { update } = useDocumentStoreApi().getState();

  const attachment = useAttachmentForUrl(data?.file.url);

  if (!data) return null;

  // A saved or shared message keeps the reference but not the file.
  const missing = data.file.url.startsWith("attachment://") && !attachment;

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
          <EditorInput
            label="File URL"
            value={data.file.url}
            onChange={(v) => update<FileNode>(id, { file: { url: v } })}
            className="flex-auto"
            fileUpload={true}
            props={{ placeholder: "attachment://file.pdf" }}
            validationPath={nodeField<FileNode>(id, "file.url")}
          />
          <div className="flex-none">
            <div className="uppercase text-mist-300 text-sm font-medium mb-1.5">
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
        {missing && (
          <div className="text-sm text-amber-300">
            This message has no attachment with that name. Add the file again
            with the + button.
          </div>
        )}
      </div>
    </EditorComponentCollapsable>
  );
}
