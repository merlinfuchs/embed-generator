import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import {
  MAX_ATTACHMENTS,
  MAX_TOTAL_ATTACHMENT_BYTES,
  formatMB,
  useCurrentAttachmentsStore,
} from "../state/attachments";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import { type ChangeEvent, useRef } from "react";
import EditorAttachment from "./EditorAttachment";
import { useComponentsV2Enabled } from "../state/document";
import { useAddAttachments } from "../util/useAddAttachments";

export default function EditorAttachments() {
  const attachments = useCurrentAttachmentsStore(
    useShallow((state) => state.attachments.map((a) => a.id)),
  );

  const componentsV2Enabled = useComponentsV2Enabled();

  const totalBytes = useCurrentAttachmentsStore((state) =>
    state.attachments.reduce((acc, curr) => acc + curr.size, 0),
  );

  const clearAttachments = useCurrentAttachmentsStore(
    (state) => state.clearAttachments,
  );

  const addAttachments = useAddAttachments();

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

    addAttachments(files);
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
              totalBytes <= MAX_TOTAL_ATTACHMENT_BYTES
                ? "text-mist-400"
                : "text-red",
            )}
          >
            {formatMB(totalBytes)} / {formatMB(MAX_TOTAL_ATTACHMENT_BYTES)}
          </div>
        </div>
      }
    >
      <div className="text-mist-400 mb-3">
        {componentsV2Enabled
          ? "These files are sent with the message. They only show up where a File or an image in the message uses them."
          : "These files are sent with the message. Discord shows them above the embeds, except the ones an embed uses as an image."}
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
