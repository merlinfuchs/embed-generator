import { ReactNode } from "react";
import ClickOutsideHandler from "./ClickOutsideHandler";

interface Props {
  children: ReactNode;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  size?: "small" | "medium" | "large";
}

export default function BaseModal({
  children,
  visible,
  setVisible,
  size,
}: Props) {
  if (!visible) return <div />;

  let modalClass = "bg-dark-4 rounded-md p-3 max-h-full overflow-none";
  if (size === "large") {
    modalClass += " w-full md:w-160";
  } else if (size === "medium") {
    modalClass += " w-full sm:w-128";
  } else {
    modalClass += " w-full sm:w-96";
  }

  return (
    <div className="fixed flex-col w-screen h-screen flex items-center justify-center bg-dark-1 top-0 left-0 bg-opacity-90 px-2 py-2 z-20">
      <ClickOutsideHandler
        onClickOutside={() => setVisible(false)}
        className={modalClass}
      >
        {children}
      </ClickOutsideHandler>
    </div>
  );
}
