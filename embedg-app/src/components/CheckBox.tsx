import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Names the box for assistive tech, which the visible label sits outside of. */
  label: string;
  height?: 9 | 10;
}

export default function CheckBox({ checked, onChange, label, height }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={clsx(
        "rounded-lg cursor-pointer p-1 border-2 transition-colors",
        checked
          ? "bg-ink-900 border-white/30 text-mist-100"
          : "bg-ink-900 border-white/15 hover:border-white/30",
        height === 10 ? "h-10 w-10" : "w-9 h-9",
      )}
      onClick={() => onChange(!checked)}
    >
      {checked && <CheckIcon />}
    </button>
  );
}
