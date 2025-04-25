import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";
import clsx from "clsx";

interface Props {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  highlight?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function EditorIconButton({
  label,
  children,
  href,
  onClick,
  highlight,
  disabled,
  className,
}: Props) {
  return (
    <Tooltip text={label}>
      {href ? (
        <Link
          className={clsx(
            "rounded-full p-2 block",
            highlight ? "text-yellow" : "text-white",
            disabled
              ? "bg-dark-3 cursor-default"
              : "bg-dark-2 cursor-pointer hover:bg-dark-1",
            className
          )}
          to={href}
        >
          <div className="flex-none h-5 w-5">{children}</div>
        </Link>
      ) : (
        <button
          className={clsx(
            "rounded-full p-2 block",
            highlight ? "text-yellow" : "text-white",
            disabled
              ? "bg-dark-3 cursor-default"
              : "bg-dark-2 cursor-pointer hover:bg-dark-1",
            className
          )}
          onClick={() => !disabled && onClick?.()}
        >
          <div className="flex-none h-5 w-5">{children}</div>
        </button>
      )}
    </Tooltip>
  );
}
