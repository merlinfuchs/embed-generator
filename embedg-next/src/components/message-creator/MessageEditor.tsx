import Attachmennts from "./Attachments";
import Embeds from "./Embeds";
import MessageBody from "./MessageBody";
import MessageValidator from "./MessageValidator";

export default function MessageEditor() {
  return (
    <div className="space-y-8">
      <MessageBody />

      <Attachmennts />
      <Embeds />

      <MessageValidator />
    </div>
  );
}
