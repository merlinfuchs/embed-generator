import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";
import clsx from "clsx";

interface Props {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  highlight?: boolean;
  /** Shows a dot on the button. */
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
  const classes = clsx(
    "rounded-lg p-2 block transition-colors",
    highlight ? "text-amber-300" : "text-mist-300 hover:text-mist-100",
    disabled
      ? "bg-white/5 text-mist-500 cursor-default"
      : "bg-white/5 cursor-pointer hover:bg-white/10",
    className,
  );

  const icon = (
    <div className="flex-none h-5 w-5 relative">
      {children}
      {indicator && (
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-azure-400" />
      )}
    </div>
  );

  return (
    <Tooltip text={label}>
      {href ? (
        <Link aria-label={label} className={classes} to={href}>
          {icon}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          className={classes}
          onClick={() => !disabled && onClick?.()}
        >
          {icon}
        </button>
      )}
    </Tooltip>
  );
}
