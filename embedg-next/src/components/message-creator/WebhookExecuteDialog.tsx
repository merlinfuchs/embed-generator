import { useCurrentWebhookStore } from "@/lib/state/webhook";
import BaseInput from "../common/BaseInput";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useShallow } from "zustand/react/shallow";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { useCurrentMessageStore } from "@/lib/state/message";

export default function WebhookExecuteDialog() {
  const {
    webhookUrl,
    setWebhookUrl,
    threadId,
    setThreadId,
    messageId,
    setMessageId,
  } = useCurrentWebhookStore(useShallow((state) => state));

  async function sendMessage(edit: boolean) {
    if (!webhookUrl) return;

    try {
      let method = "POST";
      let url = new URL(webhookUrl);
      url.search = "?wait=true";

      if (edit) {
        url.pathname += `/messages/${messageId}`;
        method = "PATCH";
      }

      if (threadId) {
        url.search += `&thread_id=${threadId}`;
      }

      const resp = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(useCurrentMessageStore.getState()),
      });

      if (resp.status >= 300) {
        toast.error(
          `Failed to send message (${resp.status}): ${resp.statusText}`
        );
        return;
      }

      const data = await resp.json();
      setMessageId(data.id);

      if (edit) {
        toast.success("Message updated successfully");
      } else {
        toast.success("Message sent successfully");
      }
    } catch (e) {
      toast.error(`Failed to send message: ${e}`);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send Message</DialogTitle>
        <DialogDescription>
          Send your message to a Discord or Guilded webhook.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 my-3">
        <BaseInput
          type="url"
          label="Webhook URL"
          value={webhookUrl || ""}
          onChange={(v) => setWebhookUrl(v || undefined)}
        />
        <div className="flex space-x-3">
          <BaseInput
            type="text"
            label="Thread ID"
            value={threadId || ""}
            onChange={(v) => setThreadId(v || undefined)}
          />
          <BaseInput
            type="text"
            label="Message ID"
            value={messageId || ""}
            onChange={(v) => setMessageId(v || undefined)}
          />
        </div>
      </div>
      <DialogFooter>
        {messageId && (
          <Button
            variant="secondary"
            onClick={() => sendMessage(true)}
            disabled={!webhookUrl}
          >
            Edit Message
          </Button>
        )}
        <Button
          onClick={() => sendMessage(false)}
          className="flex items-center space-x-2"
          disabled={!webhookUrl}
        >
          <SendIcon className="w-5 h-5" />
          <div>Send Message</div>
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
