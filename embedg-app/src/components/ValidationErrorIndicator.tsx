import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import {
  type ValidationScope,
  useValidationError,
} from "../state/validationError";

interface Props {
  /** A path prefix, or `{ nodeId, fields }` for the document store. */
  scope: ValidationScope;
}

export default function ValidationErrorIndicator({ scope }: Props) {
  const error = useValidationError((state) => state.hasIssue(scope));

  if (error) {
    return <ExclamationCircleIcon className="h-5 w-5 text-red" />;
  } else {
    return null;
  }
}
