import Attachmennts from "./Attachments";
import Embeds from "./Embeds";
import MessageBody from "./MessageBody";
import MessageControls from "./MessageControls";
import MessageValidator from "./MessageValidator";

export default function MessageEditor() {
  return (
    <div className="space-y-8">
      <MessageControls />
      <MessageBody />

      <Attachmennts />
      <Embeds />

      <MessageValidator />
    </div>
  );
}
