import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useValidationErrorStore } from "../state/validationError";

interface Props {
  path: string;
}

export default function ValidationError({ path }: Props) {
  const issue = useValidationErrorStore(
    (state) => state.getIssueByPath(path)?.message
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
