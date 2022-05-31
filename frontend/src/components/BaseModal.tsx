import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  visible: boolean;
  size?: "small" | "medium" | "large";
}

export default function BaseModal({ children, visible, size }: Props) {
  if (!visible) return <div />;

  let modalClass = "bg-dark-4 h-48 rounded-md";
  if (size === "large") {
    modalClass += " w-full md:w-160";
  } else if (size === "medium") {
    modalClass += " w-full sm:w-128";
  } else {
    modalClass += " w-full sm:w-96";
  }

  return (
    <div className="fixed w-screen h-screen flex items-center justify-center bg-dark-1 top-0 left-0 bg-opacity-90 px-2">
      <div className={modalClass}>{children}</div>
    </div>
  );
}
