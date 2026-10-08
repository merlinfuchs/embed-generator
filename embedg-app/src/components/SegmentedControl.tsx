import clsx from "clsx";

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Picks one of a few options, like the modes of a form.
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="flex bg-ink-900 p-1 rounded-lg text-white w-fit">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => o.value !== value && onChange(o.value)}
          className={clsx(
            "py-1 px-3 rounded-lg transition-colors",
            o.value === value && "bg-ink-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
