import {
  CodeIcon,
  DatabaseBackupIcon,
  PaintbrushIcon,
  RedoIcon,
  Trash2Icon,
  UndoIcon,
} from "lucide-react";
import { useCurrentMessageStore } from "@/lib/state/message";
import { useShallow } from "zustand/react/shallow";
import ConfirmDialog from "../common/ConfirmDialog";
import MessageControlsButton from "./MessageControlsButton";
import MessageControlsUndo from "./MessageControlsUndo";

export default function MessageControls() {
  const [clearMessage, resetMessage] = useCurrentMessageStore(
    useShallow((state) => [state.clear, state.reset])
  );

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <MessageControlsUndo />
      </div>
      <div className="flex items-center space-x-3">
        <MessageControlsButton
          icon={CodeIcon}
          label="JSON Code"
          onClick={() => {}}
        />
        <MessageControlsButton
          icon={DatabaseBackupIcon}
          label="Message Backups"
          onClick={() => {}}
        />
        <ConfirmDialog
          title="Are you sure that you want to reset the message?"
          description="This will reset all your changes and cannot be undone."
          onConfirm={resetMessage}
        >
          <MessageControlsButton
            icon={PaintbrushIcon}
            label="Reset Message"
            onClick={() => {}}
          />
        </ConfirmDialog>
        <ConfirmDialog
          title="Are you sure that you want to clear the message?"
          description="This will clear everything and cannot be undone."
          onConfirm={clearMessage}
        >
          <MessageControlsButton
            icon={Trash2Icon}
            label="Clear Message"
            onClick={() => {}}
          />
        </ConfirmDialog>
      </div>
    </div>
  );
}
