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
      <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
        {label}
      </div>
      <div className="relative">
        <input
          type={type}
          className="bg-dark-2 rounded p-2 w-full no-ring font-light"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          {...inputProps}
        />
        {!!maxLength && (
          <div
            className={`absolute bottom-1 right-2  text-xs ${
              maxLength - value.length < 0 ? "text-red" : "text-dark-7"
            }`}
          >
            {maxLength - value.length}
          </div>
        )}
      </div>
    </div>
  );
}
