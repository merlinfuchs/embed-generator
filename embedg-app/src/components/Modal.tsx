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
  onClose: () => void;
}

export default function Modal({
  children,
  width = "xl",
  height = "auto",
  onClose,
}: Props) {
  return (
    <div
      className="fixed h-[100dvh] w-[100vw] bg-black/70 flex flex-col items-center justify-center px-2 py-20 sm:px-5 md:px-10 lg:px-20 xl:px-32 z-30 top-0 left-0 overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={clsx(
          "bg-dark-3 w-full rounded-xl flex-shrink overflow-y-hidden",
          maxWidths[width],
          height === "full" && "h-full",
        )}
      >
        <XMarkIcon
          className="text-gray-400 h-8 w-8 cursor-pointer absolute top-2 right-2"
          role="button"
          onClick={onClose}
        />
        {children}
      </div>
    </div>
  );
}
