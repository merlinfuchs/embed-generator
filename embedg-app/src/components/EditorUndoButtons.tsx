import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/20/solid";
import { useEffect } from "react";
import { useDocumentStoreApi, useDocumentUndoStore } from "../state/document";
import { useSettingsStore } from "../state/settings";
import EditorIconButton from "./EditorIconButton";
import { modalOpen } from "./Modal";

export default function EditorUndoButtons() {
  const historyEnabled = useSettingsStore((s) => s.editHistoryEnabled);

  const { undo, redo, pause, resume } =
    useDocumentStoreApi().temporal.getState();

  const isTracking = useDocumentUndoStore((s) => s.isTracking);
  const hasPastStates = useDocumentUndoStore((s) => s.pastStates.length !== 0);
  const hasFutureStates = useDocumentUndoStore(
    (s) => s.futureStates.length !== 0,
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd on macOS, where ctrl isn't the modifier for undo.
      // A modal edits something else, like a response message.
      if ((!e.ctrlKey && !e.metaKey) || modalOpen()) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.shiftKey ? redo(1) : undo(1);
      } else if (e.key === "y" && e.ctrlKey) {
        // Not Cmd+Y, which the browser uses for its history.
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
