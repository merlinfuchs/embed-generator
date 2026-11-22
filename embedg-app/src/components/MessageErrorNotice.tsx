import { useMemo } from "react";
import { describeIssueLocation } from "../discord/issueLocation";
import { getCurrentMessage } from "../state/currentMessage";
import { useValidationErrorStore } from "../state/validationError";
import Notice from "./Notice";

/** Tells the user that the message can't be sent and where to fix it. */
export default function MessageErrorNotice() {
  const issue = useValidationErrorStore((state) => state.firstIssue());

  const location = useMemo(
    () => issue && describeIssueLocation(getCurrentMessage(), issue.path),
    [issue],
  );

  if (!issue) return null;

  return (
    <Notice tone="error">
      Your message has errors to fix before you can send it.{" "}
      {location
        ? `The first one is in ${location}.`
        : "Look for the red icons in the editor."}
    </Notice>
  );
}
