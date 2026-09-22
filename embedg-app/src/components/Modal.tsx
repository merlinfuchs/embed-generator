import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { ReactNode } from "react";

const maxWidths = {
  xs: "max-w-md",
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
} as const;

interface Props {
  children: ReactNode;
  width?: keyof typeof maxWidths;
  height?: "auto" | "full";
  /** Let content like dropdowns escape the modal instead of being cut off. */
  overflow?: "hidden" | "visible";
  onClose: () => void;
}

export default function Modal({
  children,
  width = "xl",
  height = "auto",
  overflow = "hidden",
  onClose,
}: Props) {
  return (
    <div
      className="fixed h-[100dvh] w-[100vw] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center px-2 py-20 sm:px-5 md:px-10 lg:px-20 xl:px-32 z-30 top-0 left-0 overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={clsx(
          "bg-ink-700 border border-white/10 shadow-card w-full rounded-2xl flex-shrink",
          maxWidths[width],
          height === "full" && "h-full",
          overflow === "visible" ? "overflow-visible" : "overflow-y-hidden",
        )}
      >
        <XMarkIcon
          className="text-mist-400 hover:text-mist-100 h-7 w-7 cursor-pointer absolute top-3 right-3"
          role="button"
          onClick={onClose}
        />
        {children}
      </div>
    </div>
  );
}
