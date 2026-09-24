import type { ValidationTarget } from "../state/validationError";
import ValidationError from "./ValidationError";
import TextareaAutosize from "react-textarea-autosize";
import InputControlBar from "./InputControlBar";
import { useRef } from "react";
import ImageUploadButton from "./ImageUploadButton";
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
  validationPath?: ValidationTarget;
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

  return (
    <div className={className}>
      <div
        className={clsx(
          "flex justify-between items-end",
          !description && "mb-1.5",
        )}
      >
        <div className="flex">
          <div className="text-xs font-semibold uppercase tracking-wide text-mist-400">
            {label}
          </div>
          {maxLength && (
            <div className="text-sm italic font-light text-mist-400 ml-2">
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
        <div className="mb-1.5 text-mist-400 text-sm font-light">
          {description}
        </div>
      )}

      <div className="flex space-x-2">
        {type === "textarea" ? (
          <TextareaAutosize
            aria-label={label}
            className="bg-ink-900 px-3 py-2 rounded-lg w-full text-white"
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
            aria-label={label}
            type={type || "text"}
            className="bg-ink-900 px-3 py-2 rounded-lg w-full text-white"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            ref={inputRef}
            {...props}
          />
        )}
        {imageUpload && (
          <ImageUploadButton onChange={(url) => onChange(url || "")} />
        )}
      </div>
      <ValidationError target={validationPath} />
    </div>
  );
}
