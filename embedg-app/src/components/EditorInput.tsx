import ValidationError from "./ValidationError";
import TextareaAutosize from "react-textarea-autosize";
import InputControlBar from "./InputControlBar";
import { useRef } from "react";
import ImageUploadButton from "./ImageUploadButton";
import { usePremiumGuildFeatures } from "../util/premium";
import clsx from "clsx";

interface Props {
  label: string;
  value: string;
  description?: string;
  onChange: (value: string) => void;
  maxLength?: number;
  type?: "text" | "url" | "textarea";
  props?: Record<string, any>;
  className?: string;
  validationPath?: string;
  controls?: boolean;
  imageUpload?: boolean;
}

export default function EditorInput({
  label,
  description,
  value,
  onChange,
  maxLength,
  type,
  props,
  className,
  validationPath,
  controls,
  imageUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const features = usePremiumGuildFeatures();

  return (
    <div className={className}>
      <div
        className={clsx(
          "flex justify-between items-end",
          !description && "mb-1.5"
        )}
      >
        <div className="flex">
          <div className="uppercase text-gray-300 text-sm font-medium">
            {label}
          </div>
          {maxLength && (
            <div className="text-sm italic font-light text-gray-400 ml-2">
              {value.length} / {maxLength}
            </div>
          )}
        </div>
        <div className="flex-none hidden md:block">
          {controls && (
            <InputControlBar
              value={value}
              onChange={onChange}
              inputRef={inputRef}
            />
          )}
        </div>
      </div>

      {description && (
        <div className="mb-1.5 text-gray-400 text-sm font-light">
          {description}
        </div>
      )}

      <div className="flex space-x-2">
        {type === "textarea" ? (
          <TextareaAutosize
            className="bg-dark-2 px-3 py-2 rounded w-full text-white ring-0 border-transparent focus:outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            minRows={3}
            maxRows={15}
            ref={inputRef}
            {...props}
          />
        ) : (
          <input
            type={type || "text"}
            className="bg-dark-2 px-3 py-2 rounded w-full text-white ring-0 border-transparent focus:outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            ref={inputRef}
            {...props}
          />
        )}
        {imageUpload && !!features?.max_image_upload_size && (
          <div className="flex-none">
            <ImageUploadButton onChange={(url) => onChange(url || "")} />
          </div>
        )}
      </div>
      {validationPath && <ValidationError path={validationPath} />}
    </div>
  );
}
