interface Props {
  label: string;
  type: string;
  value: string;
  onChange: (newValue: string) => void;
  maxLength?: number;
  className?: string;
  inputProps?: { [key: string]: any };
}

export default function StyledInput({
  label,
  type,
  value,
  onChange,
  maxLength,
  className,
  inputProps,
}: Props) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-end">
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
      <input
        type={type}
        className="bg-dark-2 rounded p-2 w-full no-ring font-light"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        {...inputProps}
      />
    </div>
  );
}
