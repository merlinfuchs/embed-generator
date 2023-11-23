import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, useRef } from "react";
import { useUploadImageMutation } from "../api/mutations";
import { useToasts } from "../util/toasts";
import { useSendSettingsStore } from "../state/sendSettings";

interface Props {
  onChange: (url: string | undefined) => void;
}

export default function ImageUploadButton({ onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedGuildId = useSendSettingsStore((state) => state.guildId);
  const createToast = useToasts((s) => s.create);

  const uploadMutation = useUploadImageMutation();

  function onFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate(
      {
        guildId: selectedGuildId,
        file,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            onChange(res.data.cdn_url);
          } else {
            createToast({
              title: "Error uploading image",
              message: res.error.message || "Unknown error",
              type: "error",
            });
          }
        },
      }
    );
  }

  return (
    <div>
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={onFileUpload}
        accept="image/*"
      />
      <button
        className="h-10 w-10 bg-dark-2 rounded flex items-center justify-center text-gray-300 hover:text-white"
        onClick={() => inputRef.current?.click()}
      >
        <DocumentArrowUpIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
