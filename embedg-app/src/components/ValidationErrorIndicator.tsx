import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useValidationErrorStore } from "../state/validationError";

interface Props {
  pathPrefix: string | string[];
}

export default function ValidationErrorIndicator({ pathPrefix }: Props) {
  const error = useValidationErrorStore((state) =>
    typeof pathPrefix === "string"
      ? state.checkIssueByPathPrefix(pathPrefix)
      : pathPrefix.some((prefix) => state.checkIssueByPathPrefix(prefix))
  );

  if (error) {
    return <ExclamationCircleIcon className="h-5 w-5 text-red" />;
  } else {
    return null;
  }
}
