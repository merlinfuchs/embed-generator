import {
  ChevronRightIcon,
  DocumentIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import useAttachments, { Attachment } from "../hooks/useAttachments";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const isImageRegex = /^data:image\//;

export default function EditorAttachments() {
  const [attachments, dispatch] = useAttachments();
  const [collapsed, setCollapsed] = useState(attachments.length === 0);

  const fileInput = useRef<HTMLInputElement>(null);

  function openFileDialog() {
    if (fileInput.current) {
      fileInput.current.click();
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    for (let i = 0; i < e.target.files?.length; i++) {
      const file = e.target.files[i];

      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({
          type: "addAttachment",
          value: {
            size: file.size,
            name: file.name,
            description: null,
            data_url: e.target?.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }

  function isImage(attachment: Attachment) {
    return !!attachment.data_url.match(isImageRegex);
  }

  const totalBytes = useMemo(
    () => attachments.map((a) => a.size).reduce((a, b) => a + b, 0),
    [attachments]
  );

  const [attachmentsSection] = useAutoAnimate<HTMLDivElement>();
  const [attachmentsContainer] = useAutoAnimate<HTMLDivElement>();

  return (
    <div ref={attachmentsSection}>
      <div
        className="flex-auto cursor-pointer flex items-center space-x-2 text-gray-300 select-none mb-2"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronRightIcon
          className={`h-5 w-5 transition-transform duration-300 ${
            collapsed ? "" : "rotate-90"
          }`}
        />
        <div className="flex space-x-2 items-center">
          <div className="text-lg font-medium">Attachments</div>
          <div
            className={`italic font-light text-sm ${
              attachments.length < 10 ? "text-gray-400" : "text-red"
            }`}
          >
            {attachments.length} / 10
          </div>
          <div
            className={`italic font-light text-sm ${
              totalBytes < 8_000_000 ? "text-gray-400" : "text-red"
            }`}
          >
            {Math.round(totalBytes / 10_000) / 100} / 8 MB
          </div>
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-wrap" ref={attachmentsContainer}>
          {attachments.map((attachment, index) => (
            <div
              className="bg-dark-3 w-56 mr-3 mb-3 rounded space-y-2 p-2 overflow-none"
              key={attachment.id}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={attachment.name}
                  readOnly
                  className="bg-dark-2 w-full no-ring rounded py-1 px-2 flex-auto"
                />
                <TrashIcon
                  className="w-5 h-5 flex-none cursor-pointer"
                  onClick={() => dispatch({ type: "removeAttachment", index })}
                />
              </div>
              <div className="flex justify-center">
                {isImage(attachment) ? (
                  <img
                    src={attachment.data_url}
                    className="rounded h-full w-full max-h-56"
                    alt=""
                  />
                ) : (
                  <DocumentIcon className="text-dark-6" />
                )}
              </div>
            </div>
          ))}
          {attachments.length < 10 && (
            <div
              className="border-2 border-dashed rounded text-gray-300 hover:text-white cursor-pointer w-56 p-5 flex items-center justify-center mr-3 mb-3"
              onClick={openFileDialog}
              key="add"
            >
              <input
                type="file"
                className="hidden"
                ref={fileInput}
                onChange={handleFile}
                multiple
              />
              <PlusCircleIcon className="w-32 h-32" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
