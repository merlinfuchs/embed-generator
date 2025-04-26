import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/20/solid";
import { useEffect } from "react";
import {
  useCurrentMessageStore,
  useCurrentMessageUndoStore,
} from "../state/message";
import { useSettingsStore } from "../state/settings";
import EditorIconButton from "./EditorIconButton";

export default function EditorUndoButtons() {
  const historyEnabled = useSettingsStore((s) => s.editHistoryEnabled);

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

    if (historyEnabled) {
      resume();
      document.addEventListener("keydown", onKeyDown);
    } else {
      pause();
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [historyEnabled, pause, resume, undo, redo]);

  if (!isTracking) {
    return null;
  }

  return (
    <>
      <EditorIconButton
        onClick={() => undo(1)}
        label="Undo"
        disabled={!hasPastStates}
      >
        <ArrowUturnLeftIcon />
      </EditorIconButton>
      <EditorIconButton
        onClick={() => redo(1)}
        label="Redo"
        disabled={!hasFutureStates}
      >
        <ArrowUturnRightIcon />
      </EditorIconButton>
    </>
  );
}
