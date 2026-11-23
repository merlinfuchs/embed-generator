import Notice from "./Notice";

export default function PollAttachmentsNotice() {
  return (
    <Notice tone="warning">
      Discord doesn't allow attachments when you send a message with a poll.
      Remove the attachments or the poll, or send the files in a message of
      their own.
    </Notice>
  );
}
