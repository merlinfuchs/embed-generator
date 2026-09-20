import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/20/solid";
import { useEffect } from "react";
import {
  pauseHistory,
  redoAll,
  resumeHistory,
  undoAll,
  useHasFutureStates,
  useHasPastStates,
} from "../state/history";
import { useCurrentMessageUndoStore } from "../state/message";
import { useSettingsStore } from "../state/settings";
import EditorIconButton from "./EditorIconButton";

export default function EditorUndoButtons() {
  const historyEnabled = useSettingsStore((s) => s.editHistoryEnabled);

  const isTracking = useCurrentMessageUndoStore((s) => s.isTracking);
  const hasPastStates = useHasPastStates();
  const hasFutureStates = useHasFutureStates();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.shiftKey ? redoAll() : undoAll();
      } else if (e.key === "y") {
        e.preventDefault();
        redoAll();
      }
    }

    if (historyEnabled) {
      resumeHistory();
      document.addEventListener("keydown", onKeyDown);
    } else {
      pauseHistory();
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [historyEnabled]);

  if (!isTracking) {
    return null;
  }

  return (
    <>
      <EditorIconButton
        onClick={undoAll}
        label="Undo"
        disabled={!hasPastStates}
      >
        <ArrowUturnLeftIcon />
      </EditorIconButton>
      <EditorIconButton
        onClick={redoAll}
        label="Redo"
        disabled={!hasFutureStates}
      >
        <ArrowUturnRightIcon />
      </EditorIconButton>
    </>
  );
}
