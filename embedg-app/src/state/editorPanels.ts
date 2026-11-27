import { create } from "zustand";

/** The dialogs the editor opens on top of the message. */
export type EditorDialog = "new" | "json" | "share" | "settings";

interface EditorPanelsStore {
  /** The open dialog, at most one at a time. */
  dialog: EditorDialog | null;
  /**
   * The AI assistant next to the editor. Kept apart from the dialog, so
   * checking the settings or the JSON doesn't close the chat.
   */
  assistantOpen: boolean;

  openDialog: (dialog: EditorDialog) => void;
  closeDialog: () => void;
  setAssistantOpen: (open: boolean) => void;
}

/**
 * What's open in the editor. Not in the URL, so opening one panel doesn't
 * close another, and not persisted, so a reload starts on the plain editor.
 */
export const useEditorPanelsStore = create<EditorPanelsStore>()((set) => ({
  dialog: null,
  assistantOpen: false,

  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
  setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
}));

export const openEditorDialog = (dialog: EditorDialog) =>
  useEditorPanelsStore.getState().openDialog(dialog);
export const closeEditorDialog = () =>
  useEditorPanelsStore.getState().closeDialog();
export const setAssistantOpen = (open: boolean) =>
  useEditorPanelsStore.getState().setAssistantOpen(open);
