import { useValidationErrorStore } from "@/lib/state/validationError";
import { CircleAlertIcon } from "lucide-react";

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
    return (
      <CircleAlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
    );
  } else {
    return null;
  }
}
