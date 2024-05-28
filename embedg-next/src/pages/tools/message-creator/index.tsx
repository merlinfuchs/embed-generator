import ToolLayout from "@/components/ToolLayout";
import MessageEditor from "@/components/message-creator/MessageEditor";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import MessageEditorPreview from "@/components/message-creator/MessageEditorPreview";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import WebhookExecuteDialog from "@/components/message-creator/WebhookExecuteDialog";

export default function MessageCreatorPage() {
  return (
    <ToolLayout>
      <div className="flex h-full">
        <div className="flex flex-col w-7/12 py-8 space-y-8 h-full overflow-y-auto px-10 no-scrollbar">
          <div className="flex justify-between">
            <div className="flex flex-col space-y-1.5">
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Message Creator
              </h1>
              <p className="text-sm text-muted-foreground">
                Create good looking Discord messages and send them through
                webhooks!
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <SendIcon />
                  <div>Send Message</div>
                </Button>
              </DialogTrigger>
              <WebhookExecuteDialog />
            </Dialog>
          </div>

          <MessageEditor />
        </div>
        <div className="py-5 w-5/12 h-full overflow-y-auto pr-5 no-scrollbar">
          <MessageEditorPreview />
        </div>
      </div>
    </ToolLayout>
  );
}
