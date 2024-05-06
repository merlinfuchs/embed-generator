import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  height?: 9 | 10;
}

export default function CheckBox({ checked, onChange, height }: Props) {
  return (
    <div
      className={clsx(
        "bg-dark-2 rounded cursor-pointer p-1.5 text-white",
        height === 10 ? "h-10 w-10" : "w-9 h-9"
      )}
      role="button"
      onClick={() => onChange(!checked)}
    >
      {checked && <CheckIcon />}
    </div>
  );
}
