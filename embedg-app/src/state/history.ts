import { useDocumentStore, useDocumentUndoStore } from "./document";
import { useCurrentMessageStore, useCurrentMessageUndoStore } from "./message";

/**
 * Embeds live in the document store while everything else is still in the
 * message store, so both histories are stepped together. This file goes away
 * with the second store.
 */
const histories = [useCurrentMessageStore.temporal, useDocumentStore.temporal];

export function undoAll() {
  for (const history of histories) history.getState().undo(1);
}

export function redoAll() {
  for (const history of histories) history.getState().redo(1);
}

export function pauseHistory() {
  for (const history of histories) history.getState().pause();
}

export function resumeHistory() {
  for (const history of histories) history.getState().resume();
}

export function useHasPastStates() {
  const message = useCurrentMessageUndoStore((s) => s.pastStates.length !== 0);
  const document = useDocumentUndoStore((s) => s.pastStates.length !== 0);

  return message || document;
}

export function useHasFutureStates() {
  const message = useCurrentMessageUndoStore(
    (s) => s.futureStates.length !== 0,
  );
  const document = useDocumentUndoStore((s) => s.futureStates.length !== 0);

  return message || document;
}
