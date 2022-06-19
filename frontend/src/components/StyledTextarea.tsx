import { ExclamationCircleIcon } from "@heroicons/react/solid";
import { useRef } from "react";
import EditorInputTools from "./EditorInputTools";

interface Props {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  maxLength?: number;
  className?: string;
  tools?: boolean;
  [extraProps: string]: any;
  errors?: string[];
}

export default function StyledTextarea({
  label,
  value,
  onChange,
  maxLength,
  className,
  tools,
  extraProps,
  errors,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-end">
        <div className="flex items-end flex-auto">
          <div className="uppercase text-gray-300 text-sm font-medium">
            {label}
          </div>
          {!!maxLength && (
            <div
              className={`right-2 text-sm italic ml-2 font-light ${
                maxLength - value.length < 0 ? "text-red" : "text-gray-400"
              }`}
            >
              {value.length} / {maxLength}
            </div>
          )}
        </div>

        {tools !== false && (
          <div className="flex-none">
            <EditorInputTools value={value} onChange={onChange} input={ref} />
          </div>
        )}
      </div>
      <textarea
        className="bg-dark-2 rounded p-2 w-full no-ring font-light"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        ref={ref}
        {...extraProps}
      />
      {errors?.map((e) => (
        <div
          className="text-sm text-red pt-1 flex items-center space-x-1"
          key={e}
        >
          <ExclamationCircleIcon className="w-5 h-5" />
          <div>{e}</div>
        </div>
      ))}
    </div>
  );
}
