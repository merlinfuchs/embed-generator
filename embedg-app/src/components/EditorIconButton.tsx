import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";
import clsx from "clsx";

interface Props {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  highlight?: boolean;
  /** A dot on the button, for settings that differ from their defaults. */
  indicator?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function EditorIconButton({
  label,
  children,
  href,
  onClick,
  highlight,
  indicator,
  disabled,
  className,
}: Props) {
  return (
    <Tooltip text={label}>
      {href ? (
        <Link
          aria-label={label}
          className={clsx(
            "rounded-lg p-2 block transition-colors",
            highlight ? "text-amber-300" : "text-mist-300 hover:text-mist-100",
            disabled
              ? "bg-white/5 text-mist-500 cursor-default"
              : "bg-white/5 cursor-pointer hover:bg-white/10",
            className,
          )}
          to={href}
        >
          <div className="flex-none h-5 w-5 relative">
            {children}
            {indicator && (
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-azure-400" />
            )}
          </div>
        </Link>
      ) : (
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          className={clsx(
            "rounded-lg p-2 block transition-colors",
            highlight ? "text-amber-300" : "text-mist-300 hover:text-mist-100",
            disabled
              ? "bg-white/5 text-mist-500 cursor-default"
              : "bg-white/5 cursor-pointer hover:bg-white/10",
            className,
          )}
          onClick={() => !disabled && onClick?.()}
        >
          <div className="flex-none h-5 w-5 relative">
            {children}
            {indicator && (
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-azure-400" />
            )}
          </div>
        </button>
      )}
    </Tooltip>
  );
}
