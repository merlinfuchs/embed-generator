import { DocumentIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type ChangeEvent, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  attachmentUrl,
  useCurrentAttachmentsStore,
} from "../state/attachments";
import { useAddAttachments } from "../util/useAddAttachments";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  onChange: (url: string) => void;
}

/**
 * The + next to a file field. It adds a file to the attachments of the message and fills the field
 * with its URL. When the message already has attachments it first offers them, so a file isn't
 * added twice.
 */
export default function FileUploadButton({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addAttachments = useAddAttachments();

  const existing = useCurrentAttachmentsStore(
    useShallow((state) => state.attachments.map((a) => a.name)),
  );

  function pickFile() {
    setOpen(false);
    inputRef.current?.click();
  }

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset, or picking the same file again after a failure does nothing.
    e.target.value = "";
    if (!file) return;

    const [added] = await addAttachments([file], { sanitize: true });
    if (added) onChange(attachmentUrl(added.name));
  }

  return (
    <ClickOutsideHandler
      onClickOutside={() => setOpen(false)}
      className="relative flex-none"
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={onFileSelected}
      />
      <button
        type="button"
        aria-label="Add file"
        title="Add file"
        aria-expanded={existing.length > 0 ? open : undefined}
        className="h-10 w-10 bg-ink-900 rounded-lg flex items-center justify-center text-mist-300 hover:text-white"
        onClick={() => (existing.length > 0 ? setOpen(!open) : pickFile())}
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-ink-900 rounded-lg shadow-lg border-2 border-white/10 z-10 text-white overflow-hidden">
          <button
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-ink-700 flex items-center space-x-2"
            onClick={pickFile}
          >
            <PlusIcon className="h-5 w-5 flex-none" />
            <span>Upload new file</span>
          </button>
          <div className="border-t border-white/10">
            <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-mist-400">
              Attachments
            </div>
            <div className="max-h-48 overflow-y-auto">
              {existing.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-ink-700 flex items-center space-x-2"
                  onClick={() => {
                    onChange(attachmentUrl(name));
                    setOpen(false);
                  }}
                >
                  <DocumentIcon className="h-5 w-5 flex-none text-mist-300" />
                  <span className="truncate">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ClickOutsideHandler>
  );
}
