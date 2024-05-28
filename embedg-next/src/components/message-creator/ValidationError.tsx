import { useValidationErrorStore } from "@/lib/state/validationError";
import { CircleAlertIcon } from "lucide-react";

interface Props {
  path: string;
}

export default function ValidationError({ path }: Props) {
  const issue = useValidationErrorStore(
    (state) => state.getIssueByPath(path)?.message
  );

  if (issue) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1 pt-1">
        <CircleAlertIcon className="h-5 w-5 flex-none" />
        <div>{issue}</div>
      </div>
    );
  } else {
    return null;
  }
}
