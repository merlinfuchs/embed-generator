import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import type { NodeId } from "../state/document";
import { useValidationErrorStore } from "../state/validationError";

interface Props {
  /** Node-addressed lookup. Components still on the old store pass `path`. */
  nodeId?: NodeId;
  field?: string;
  path?: string;
}

export default function ValidationError({ nodeId, field, path }: Props) {
  const issue = useValidationErrorStore((state) =>
    nodeId !== undefined
      ? state.getIssueForNode(nodeId, field)?.message
      : path !== undefined
        ? state.getIssueByPath(path)?.message
        : undefined,
  );

  if (issue) {
    return (
      <div className="text-red text-sm flex items-center space-x-1 mt-1">
        <ExclamationCircleIcon className="h-5 w-5 flex-none" />
        <div>{issue}</div>
      </div>
    );
  } else {
    return null;
  }
}
