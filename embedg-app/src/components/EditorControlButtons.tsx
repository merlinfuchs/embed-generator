import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Squares2X2Icon,
  SquaresPlusIcon,
} from "@heroicons/react/20/solid";
import {
  useCurrentMessageStore,
  useCurrentMessageUndoStore,
} from "../state/message";
import EditorIconButton from "./EditorIconButton";
import { useEffect } from "react";
import { useSettingsStore } from "../state/settings";

export default function EditorControlButtons() {
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

  const componentV2Enabled = useCurrentMessageStore((s) =>
    s.getComponentsV2Enabled()
  );
  const setComponentV2Enabled = useCurrentMessageStore(
    (s) => s.setComponentsV2Enabled
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
      <EditorIconButton
        onClick={() => setComponentV2Enabled(!componentV2Enabled)}
        label="Component V2"
        className={
          componentV2Enabled ? "bg-yellow text-black hover:bg-yellow/90" : ""
        }
      >
        <SquaresPlusIcon />
      </EditorIconButton>
    </>
  );
}
