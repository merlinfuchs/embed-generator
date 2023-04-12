import { ZodType } from "zod";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  schema?: ZodType;
  maxLength?: number;
  type?: "text" | "url" | "textarea";
  children?: React.ReactNode;
  props?: Record<string, any>;
  className?: string;
}

export default function EditorInput({
  label,
  value,
  onChange,
  maxLength,
  type,
  children,
  props,
  className,
}: Props) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex">
        <div className="uppercase text-gray-300 text-sm font-medium">
          {label}
        </div>
        {maxLength && (
          <div className="text-sm italic font-light text-gray-400 ml-2">
            {value.length} / {maxLength}
          </div>
        )}
      </div>
      {type === "textarea" ? (
        <textarea
          className="bg-dark-2 px-3 py-2 rounded w-full text-white ring-0 border-transparent focus:outline-none mb-1 h-26"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      ) : (
        <input
          type={type || "text"}
          className="bg-dark-2 px-3 py-2 rounded w-full text-white ring-0 border-transparent focus:outline-none mb-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      )}
      {children}
    </div>
  );
}
