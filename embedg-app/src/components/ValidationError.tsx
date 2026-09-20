import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import {
  type ValidationTarget,
  useValidationErrorStore,
} from "../state/validationError";

interface Props {
  /** A path string, or `{ nodeId, field }` for the document store. */
  target?: ValidationTarget;
}

export default function ValidationError({ target }: Props) {
  const issue = useValidationErrorStore((state) =>
    target === undefined ? undefined : state.getIssue(target)?.message,
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
