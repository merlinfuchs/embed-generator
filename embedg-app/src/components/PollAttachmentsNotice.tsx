import { useCurrentAttachmentsStore } from "../state/attachments";
import { useComponentsV2Enabled, usePoll } from "../state/document";
import Notice from "./Notice";

/**
 * Whether the message would be sent with a poll and files, which Discord rejects. A Components V2
 * message is sent without its poll.
 */
export function usePollWithAttachments() {
  const hasPoll = !!usePoll();
  const componentsV2 = useComponentsV2Enabled();
  const hasAttachments = useCurrentAttachmentsStore(
    (state) => state.attachments.length > 0,
  );
  return hasPoll && hasAttachments && !componentsV2;
}

export default function PollAttachmentsNotice({
  className,
}: {
  className?: string;
}) {
  return (
    <Notice tone="warning" className={className}>
      Discord doesn't allow attachments on a message with a poll. Remove the
      attachments or the poll, or send the files in a message of their own.
    </Notice>
  );
}
