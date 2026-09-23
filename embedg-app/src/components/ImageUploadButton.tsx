import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { type ChangeEvent, useRef } from "react";
import { useUploadImageMutation } from "../api/mutations";
import { useToasts } from "../util/toasts";
import { useSendSettingsStore } from "../state/sendSettings";
import { usePremiumGuildFeatures } from "../util/premium";

interface Props {
  onChange: (url: string | undefined) => void;
}

/**
 * Renders nothing when the guild's plan has no image uploads. The check lives here rather than in
 * the caller so that only inputs that actually offer an upload subscribe to the plan query: an
 * editor has hundreds of inputs and each one was opening an observer for it. It is also the only
 * hook this component runs, so an editor on a plan without uploads opens nothing else either.
 */
export default function ImageUploadButton(props: Props) {
  const features = usePremiumGuildFeatures();

  if (!features?.max_image_upload_size) return null;

  return <UploadButton {...props} />;
}

function UploadButton({ onChange }: Props) {
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
      },
    );
  }

  return (
    <div className="flex-none">
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={onFileUpload}
        accept="image/*"
      />
      <button
        type="button"
        aria-label="Upload image"
        className="h-10 w-10 bg-ink-900 rounded-lg flex items-center justify-center text-mist-300 hover:text-white"
        onClick={() => inputRef.current?.click()}
      >
        <DocumentArrowUpIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
