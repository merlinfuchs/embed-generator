import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  size?: "xl" | "full";
  closeButton?: boolean;
}

export default function ({ children, size = "xl", closeButton }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed h-screen w-screen bg-black bg-opacity-70 flex flex-col items-center justify-center px-2 py-20 sm:px-5 md:px-10 lg:px-20 xl:px-32 z-30"
      onClick={(e) => e.target === e.currentTarget && navigate("/")}
    >
      <div
        className={clsx(
          "bg-dark-3 w-full h-full rounded-xl flex-shrink",
          size === "xl" && "max-w-7xl"
        )}
      >
        {closeButton !== false && (
          <XMarkIcon
            className="text-gray-400 h-8 w-8 cursor-pointer absolute top-2 right-2"
            role="button"
            onClick={() => navigate("/")}
          />
        )}
        {children}
      </div>
    </div>
  );
}
