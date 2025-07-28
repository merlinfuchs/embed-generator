import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import Collapsable from "./Collapsable";

interface Props {
  id: string;
  validationPathPrefix: string;
  title: string;
  extra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  duplicate?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  remove?: () => void;
  size?: "medium" | "large";
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
  className,
  children,
  size = "medium",
}: Props) {
  return (
    <div className={className}>
      <Collapsable
        id={id}
        validationPathPrefix={validationPathPrefix}
        title={title}
        extra={extra}
        size={size}
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
