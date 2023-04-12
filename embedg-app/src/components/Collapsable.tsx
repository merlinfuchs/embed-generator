import { ChevronRightIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import { useCollapsedState } from "../state/collapsed";
import { AutoAnimate } from "../util/autoAnimate";

interface Props {
  id: string;
  children: ReactNode;
  title: string;
  extra?: ReactNode;
  buttons?: ReactNode;
  size?: "medium" | "large";
}

export default function Collapsable({
  id,
  children,
  title,
  size,
  extra,
  buttons,
}: Props) {
  const [collapsed, toggleCollapsed] = useCollapsedState(id);

  if (!size) {
    size = "medium";
  }

  return (
    <div>
      <div className="flex items-center text-gray-300 cursor-pointer truncate space-x-3">
        <div
          className="flex items-center flex-auto truncate space-x-1"
          onClick={() => toggleCollapsed()}
        >
          <ChevronRightIcon
            className={clsx(
              "transition-transform duration-300",
              !collapsed && "rotate-90",
              size === "large" && "w-7 h-7",
              size === "medium" && "w-6 h-6"
            )}
          />
          <div className={clsx("flex-none", size === "large" && "text-lg")}>
            {title}
          </div>
          {extra}
        </div>
        <div className="flex-none">{buttons}</div>
      </div>
      <AutoAnimate>
        {!collapsed && <div className="mt-3">{children}</div>}
      </AutoAnimate>
    </div>
  );
}
