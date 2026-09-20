import { ChevronRightIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { NodeId } from "../state/document";
import { useCollapsedState } from "../state/collapsed";
import { AutoAnimate } from "../util/autoAnimate";
import ValidationErrorIndicator from "./ValidationErrorIndicator";

interface Props {
  id: string;
  children: ReactNode;
  title: string;
  extra?: ReactNode;
  buttons?: ReactNode;
  size?: "medium" | "large";
  validationPathPrefix?: string | string[];
  validationNodeId?: NodeId;
  validationFields?: string[];
  defaultCollapsed?: boolean;
}

export default function Collapsable({
  id,
  children,
  title,
  size = "medium",
  extra,
  buttons,
  validationPathPrefix,
  validationNodeId,
  validationFields,
  defaultCollapsed,
}: Props) {
  const [collapsed, toggleCollapsed] = useCollapsedState(id, defaultCollapsed);

  return (
    <div>
      <div className="flex items-center text-gray-300 cursor-pointer truncate space-x-3">
        <div
          className="flex items-center flex-auto truncate space-x-1"
          onClick={() => toggleCollapsed()}
        >
          <ChevronRightIcon
            className={clsx(
              "transition-transform duration-300 flex-none",
              !collapsed && "rotate-90",
              size === "large" && "w-7 h-7",
              size === "medium" && "w-6 h-6",
            )}
          />
          <div className={clsx("flex-none", size === "large" && "text-lg")}>
            {title}
          </div>
          {(validationPathPrefix || validationNodeId !== undefined) && (
            <div className="flex-none">
              <ValidationErrorIndicator
                pathPrefix={validationPathPrefix}
                nodeId={validationNodeId}
                fields={validationFields}
              />
            </div>
          )}
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
