import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  useCurrentAttachmentsStore,
} from "../state/attachments";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import { type ChangeEvent, useRef } from "react";
import { getUniqueId } from "../util";
import EditorAttachment from "./EditorAttachment";
import { useComponentsV2Enabled } from "../state/document";
import { useToasts } from "../util/toasts";

export default function EditorAttachments() {
  const attachments = useCurrentAttachmentsStore(
    useShallow((state) => state.attachments.map((a) => a.id)),
  );

  const componentsV2Enabled = useComponentsV2Enabled();

  const totalBytes = useCurrentAttachmentsStore((state) =>
    state.attachments.reduce((acc, curr) => acc + curr.size, 0),
  );

  const [addAttachment, clearAttachments] = useCurrentAttachmentsStore(
    useShallow((state) => [state.addAttachment, state.clearAttachments]),
  );

  const createToast = useToasts((s) => s.create);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleAddAttachment() {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    inputRef.current?.click();
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    if (!input.files) return;

    const files = [...input.files];
    // Reset, or picking the same file again after an error does nothing.
    input.value = "";

    let remaining = MAX_ATTACHMENTS - attachments.length;

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        createToast({
          title: "File too large",
          message: `'${file.name}' is larger than the 25MB limit.`,
          type: "error",
        });
        continue;
      }

      // The count was only checked before the picker opened, so selecting several files at once
      // could take it past the limit.
      if (remaining <= 0) {
        createToast({
          title: "Too many attachments",
          message: `A message can have at most ${MAX_ATTACHMENTS} attachments.`,
          type: "error",
        });
        break;
      }
      remaining--;

      const reader = new FileReader();
      reader.onload = (e) => {
        addAttachment({
          id: getUniqueId(),
          size: file.size,
          name: file.name,
          description: null,
          data_url: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <Collapsable
      id="attachments"
      title="Attachments"
      size="large"
      defaultCollapsed={true}
      validationPathPrefix="attachments"
      extra={
        <div className="flex space-x-2">
          <div className="text-sm italic font-light text-mist-400">
            {attachments.length} / {MAX_ATTACHMENTS}
          </div>
          <div
            className={clsx(
              "text-sm italic font-light",
              totalBytes < MAX_ATTACHMENT_BYTES ? "text-mist-400" : "text-red",
            )}
          >
            {Math.round(totalBytes / 10_000) / 100} / 25MB
          </div>
        </div>
      }
    >
      <div className="text-mist-400 mb-3">
        {componentsV2Enabled
          ? "Attachments do not directly appear in the message. Instead, you can use them in File components."
          : "Attachments do currently not appear in the preview."}
      </div>
      <AutoAnimate className="flex flex-wrap">
        {attachments.map((id, i) => (
          <EditorAttachment index={i} id={id} key={id} />
        ))}
      </AutoAnimate>
      <div className="space-x-3">
        <button
          className={clsx(
            "px-3 py-2 rounded-lg text-white",
            attachments.length < MAX_ATTACHMENTS
              ? "bg-azure-500 hover:bg-azure-400"
              : "bg-ink-700 cursor-not-allowed",
          )}
          disabled={attachments.length >= MAX_ATTACHMENTS}
          onClick={handleAddAttachment}
        >
          Add Attachment
        </button>
        <button
          className="px-3 py-2 rounded-lg text-white border-2 border-red/70 hover:bg-red hover:border-red transition-colors"
          onClick={clearAttachments}
        >
          Clear Attachments
        </button>
      </div>

      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={handleFileSelected}
        multiple={attachments.length < MAX_ATTACHMENTS - 1}
      />
    </Collapsable>
  );
}
