import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import type { NodeId } from "../state/document";
import { useValidationErrorStore } from "../state/validationError";

interface Props {
  /** Node-addressed lookup. Components still on the old store pass a prefix. */
  nodeId?: NodeId;
  fields?: string[];
  pathPrefix?: string | string[];
}

export default function ValidationErrorIndicator({
  nodeId,
  fields,
  pathPrefix,
}: Props) {
  const error = useValidationErrorStore((state) => {
    if (nodeId !== undefined) {
      return fields
        ? fields.some((field) => state.hasIssueForNode(nodeId, field))
        : state.hasIssueForNode(nodeId);
    }

    if (pathPrefix === undefined) return false;

    return typeof pathPrefix === "string"
      ? state.checkIssueByPathPrefix(pathPrefix)
      : pathPrefix.some((prefix) => state.checkIssueByPathPrefix(prefix));
  });

  if (error) {
    return <ExclamationCircleIcon className="h-5 w-5 text-red" />;
  } else {
    return null;
  }
}
