import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { ZodType } from "zod";
import { useValidationError } from "../util/validate";

interface Props {
  schema: ZodType;
  value: any;
}

export default function ValidationError({ schema, value }: Props) {
  const error = useValidationError(schema, value);
  schema._type;

  if (error) {
    return (
      <div className="text-red text-sm flex items-center space-x-1">
        <ExclamationCircleIcon className="h-5 w-5" />
        <div>{error}</div>
      </div>
    );
  }
  return null;
}
