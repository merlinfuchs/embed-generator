import { useValidationErrorStore } from "@/lib/state/validationError";
import BaseInput, { BaseInputProps } from "../BaseInput";

type Props = BaseInputProps & {
  validationPath?: string;
};

export default function MessageInput(props: Props) {
  const issue = useValidationErrorStore(
    (state) =>
      props.validationPath &&
      state.getIssueByPath(props.validationPath)?.message
  );

  return <BaseInput {...props} error={issue} />;
}
