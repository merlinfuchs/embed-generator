interface Props {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  maxLength?: number;
  className?: string;
  [extraProps: string]: any;
}

export default function StyledTextarea({
  label,
  value,
  onChange,
  maxLength,
  className,
  extraProps,
}: Props) {
  return (
    <div className={className}>
      <div className="uppercase text-gray-300 text-sm font-medium mb-1.5">
        {label}
      </div>
      <div className="relative">
        <textarea
          className="bg-dark-2 rounded p-2 w-full no-ring font-light"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          {...extraProps}
        />
        {!!maxLength && (
          <div
            className={`absolute bottom-2 right-3  text-xs ${
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
