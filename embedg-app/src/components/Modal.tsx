import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const maxWidths = {
  xs: "max-w-md",
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
} as const;

/** The open modals, the topmost last. */
const openModals: object[] = [];

/** Whether a modal covers the page, so shortcuts meant for it should rest. */
export function modalOpen() {
  return openModals.length > 0;
}

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
  // Through a ref so that an inline onClose doesn't resubscribe on every render.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const modal = {};
    openModals.push(modal);

    // Only the topmost modal closes, not the one it was opened from.
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && openModals.at(-1) === modal) close.current();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openModals.splice(openModals.indexOf(modal), 1);
    };
  }, []);

  // Portaled so that a transformed ancestor, like an animating editor section, can't trap the fixed overlay.
  return createPortal(
    <div
      className="fixed h-[100dvh] w-[100vw] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center px-2 pt-14 pb-4 sm:py-20 sm:px-5 md:px-10 lg:px-20 xl:px-32 z-30 top-0 left-0 overflow-hidden"
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
        <button
          type="button"
          aria-label="Close"
          className="text-mist-400 hover:text-mist-100 cursor-pointer absolute top-3 right-3"
          onClick={onClose}
        >
          <XMarkIcon className="h-7 w-7" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
