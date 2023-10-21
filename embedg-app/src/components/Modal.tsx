import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  height?: "auto" | "full";
  closeButton?: boolean;
  onClose: () => void;
}

export default function Modal({
  children,
  width = "xl",
  height = "auto",
  closeButton,
  onClose,
}: Props) {
  return (
    <div
      className="fixed h-[100dvh] w-[100vw] bg-black bg-opacity-70 flex flex-col items-center justify-center px-2 py-20 sm:px-5 md:px-10 lg:px-20 xl:px-32 z-30 overflow-hidden top-0 left-0"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={clsx(
          "bg-dark-3 w-full rounded-xl flex-shrink overflow-x-hidden overflow-y-auto",
          width === "xl"
            ? "max-w-7xl"
            : width == "lg"
            ? "max-w-5xl"
            : width === "md"
            ? "max-w-3xl"
            : width === "sm"
            ? "max-w-xl"
            : width === "xs"
            ? "max-w-md"
            : "",
          height === "full" && "h-full"
        )}
      >
        {closeButton !== false && (
          <XMarkIcon
            className="text-gray-400 h-8 w-8 cursor-pointer absolute top-2 right-2"
            role="button"
            onClick={onClose}
          />
        )}
        {children}
      </div>
    </div>
  );
}
