import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { ReactNode } from "react";

const TONES = {
  warning: {
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    icon: ExclamationTriangleIcon,
  },
  error: {
    className: "border-red/30 bg-red/10 text-red",
    icon: ExclamationCircleIcon,
  },
};

/** A boxed warning or error, with an optional action on the right. */
export default function Notice({
  tone,
  className,
  action,
  children,
}: {
  tone: keyof typeof TONES;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { className: toneClassName, icon: Icon } = TONES[tone];

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
        toneClassName,
        className,
      )}
    >
      <div className="flex flex-auto items-start gap-2">
        <Icon className="h-5 w-5 flex-none" />
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}
