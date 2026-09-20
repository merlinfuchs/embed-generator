import clsx from "clsx";
import { useCurrentAttachmentsStore } from "../state/attachments";
import { AutoAnimate } from "../util/autoAnimate";
import Collapsable from "./Collapsable";
import { type ChangeEvent, useRef } from "react";
import { getUniqueId } from "../util";
import EditorAttachment from "./EditorAttachment";
import { shallow } from "zustand/shallow";
import { useComponentsV2Enabled } from "../state/document";

export default function EditorAttachments() {
  const attachments = useCurrentAttachmentsStore(
    (state) => state.attachments.map((a) => a.id),
    shallow,
  );

  const componentsV2Enabled = useComponentsV2Enabled();

  const totalBytes = useCurrentAttachmentsStore((state) =>
    state.attachments.reduce((acc, curr) => acc + curr.size, 0),
  );

  const [addAttachment, clearAttachments] = useCurrentAttachmentsStore(
    (state) => [state.addAttachment, state.clearAttachments],
    shallow,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  function handleAddAttachment() {
    if (attachments.length >= 10) return;
    inputRef.current?.click();
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file.size > 25 * 1024 * 1024) {
        alert("File too large! Max 25MB");
        return;
      }

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
            {attachments.length} / 10
          </div>
          <div
            className={clsx(
              "text-sm italic font-light",
              totalBytes < 25 * 1024 * 1024 ? "text-mist-400" : "text-red",
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
            attachments.length < 10
              ? "bg-azure-500 hover:bg-azure-400"
              : "bg-ink-700 cursor-not-allowed",
          )}
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
        multiple={attachments.length < 9}
      />
    </Collapsable>
  );
}
