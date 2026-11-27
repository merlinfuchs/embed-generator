import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  type EditorDialog,
  openEditorDialog,
  setAssistantOpen,
} from "../../state/editorPanels";

/**
 * The editor's panels used to have their own URLs, like /editor/settings.
 * Old links and bookmarks still open them, then land on the plain editor URL.
 */
export default function LegacyPanelRoute({
  panel,
}: {
  panel: EditorDialog | "assistant";
}) {
  useEffect(() => {
    if (panel === "assistant") setAssistantOpen(true);
    else openEditorDialog(panel);
  }, [panel]);

  return (
    <Navigate replace to={{ pathname: "/editor", search: location.search }} />
  );
}
