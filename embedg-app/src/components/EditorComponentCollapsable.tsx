import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import type { ValidationScope } from "../state/validationError";
import Collapsable from "./Collapsable";

interface Props {
  id: string;
  validationPathPrefix?: ValidationScope;
  title: string;
  extra?: React.ReactNode;
  /** Shown after the title as `- <subtitle>`, truncated. */
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  size?: "medium" | "large";
  defaultCollapsed?: boolean;
}

export default function EditorComponentCollapsable({
  id,
  validationPathPrefix,
  duplicate,
  moveUp,
  moveDown,
  remove,
  title,
  extra,
  subtitle,
  className,
  style,
  children,
  size = "medium",
  defaultCollapsed,
}: Props) {
  return (
    <div className={className} style={style}>
      <Collapsable
        id={id}
        validationPathPrefix={validationPathPrefix}
        title={title}
        extra={
          subtitle ? (
            <div className="text-gray-500 truncate flex space-x-2 pl-1">
              <div>-</div>
              <div className="truncate">{subtitle}</div>
            </div>
          ) : (
            extra
          )
        }
        size={size}
        defaultCollapsed={defaultCollapsed}
        buttons={
          <div className="flex-none text-gray-300 flex items-center space-x-2">
            {moveUp && (
              <ChevronUpIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveUp}
              />
            )}
            {moveDown && (
              <ChevronDownIcon
                className="h-6 w-6 flex-none"
                role="button"
                onClick={moveDown}
              />
            )}
            {duplicate && (
              <DocumentDuplicateIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={duplicate}
              />
            )}
            {remove && (
              <TrashIcon
                className="h-5 w-5 flex-none"
                role="button"
                onClick={remove}
              />
            )}
          </div>
        }
      >
        {children}
      </Collapsable>
    </div>
  );
}
