import { CheckIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

/** A value shown as code, copied with one click. */
export default function CopyCodeButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={copy}
      className="flex items-center rounded-lg bg-ink-900 hover:bg-ink-600 text-mist-100 overflow-hidden text-left cursor-pointer max-w-full"
    >
      <span className="bg-azure-500 hover:bg-azure-400 self-stretch flex items-center px-2.5 flex-none">
        {copied ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4" />
        )}
      </span>
      <code className="px-3 py-1.5 text-sm font-mono truncate">{text}</code>
    </button>
  );
}
