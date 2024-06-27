import { useEffect } from "react";
import {
  useCurrentMessageStore,
  useCurrentMessageUndoStore,
} from "@/lib/state/message";
import MessageControlsButton from "./MessageControlsButton";
import { RedoIcon, UndoIcon } from "lucide-react";

export default function MessageControlsUndo() {
  const { undo, redo, pause, resume } =
    useCurrentMessageStore.temporal.getState();

  const isTracking = useCurrentMessageUndoStore((s) => s.isTracking);
  const hasPastStates = useCurrentMessageUndoStore(
    (s) => s.pastStates.length != 0
  );
  const hasFutureStates = useCurrentMessageUndoStore(
    (s) => s.futureStates.length != 0
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.shiftKey ? redo(1) : undo(1);
      } else if (e.key === "y") {
        e.preventDefault();
        redo(1);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pause, resume, undo, redo]);

  if (!isTracking) {
    return null;
  }

  return (
    <>
      <MessageControlsButton
        icon={UndoIcon}
        label="Undo"
        onClick={() => undo(1)}
        disabled={!hasPastStates}
      />
      <MessageControlsButton
        icon={RedoIcon}
        label="Redo"
        onClick={() => redo(1)}
        disabled={!hasFutureStates}
      />
    </>
  );
}
