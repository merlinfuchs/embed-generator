import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/20/solid";
import { useEffect } from "react";
import { useDocumentStore, useDocumentUndoStore } from "../state/document";
import {
  useCurrentMessageStore,
  useCurrentMessageUndoStore,
} from "../state/message";
import { useSettingsStore } from "../state/settings";
import EditorIconButton from "./EditorIconButton";

export default function EditorUndoButtons() {
  const historyEnabled = useSettingsStore((s) => s.editHistoryEnabled);

  const messageHistory = useCurrentMessageStore.temporal.getState();
  const documentHistory = useDocumentStore.temporal.getState();

  const isTracking = useCurrentMessageUndoStore((s) => s.isTracking);

  // Embeds live in the document store while everything else is still in the
  // message store, so both histories move together.
  const hasPastStates =
    useCurrentMessageUndoStore((s) => s.pastStates.length !== 0) ||
    useDocumentUndoStore((s) => s.pastStates.length !== 0);
  const hasFutureStates =
    useCurrentMessageUndoStore((s) => s.futureStates.length !== 0) ||
    useDocumentUndoStore((s) => s.futureStates.length !== 0);

  useEffect(() => {
    function undo() {
      messageHistory.undo(1);
      documentHistory.undo(1);
    }

    function redo() {
      messageHistory.redo(1);
      documentHistory.redo(1);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (e.key === "y") {
        e.preventDefault();
        redo();
      }
    }

    if (historyEnabled) {
      messageHistory.resume();
      documentHistory.resume();
      document.addEventListener("keydown", onKeyDown);
    } else {
      messageHistory.pause();
      documentHistory.pause();
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [historyEnabled, messageHistory, documentHistory]);

  if (!isTracking) {
    return null;
  }

  return (
    <>
      <EditorIconButton
        onClick={() => {
          messageHistory.undo(1);
          documentHistory.undo(1);
        }}
        label="Undo"
        disabled={!hasPastStates}
      >
        <ArrowUturnLeftIcon />
      </EditorIconButton>
      <EditorIconButton
        onClick={() => {
          messageHistory.redo(1);
          documentHistory.redo(1);
        }}
        label="Redo"
        disabled={!hasFutureStates}
      >
        <ArrowUturnRightIcon />
      </EditorIconButton>
    </>
  );
}
