import {
  componentEmbedStore,
  useComponentEmbedContainerId,
} from "../state/componentEmbed";
import { DocumentStoreContext } from "../state/document";
import {
  COMPONENT_EMBED_CAPABILITIES,
  EditorCapabilitiesContext,
} from "../state/editorCapabilities";
import EditorComponentContainer from "./EditorComponentContainer";

/** The container that becomes the component embed of an embed link. */
export default function ComponentEmbedEditor() {
  const containerId = useComponentEmbedContainerId();
  if (!containerId) return null;

  return (
    <DocumentStoreContext.Provider value={componentEmbedStore}>
      <EditorCapabilitiesContext.Provider value={COMPONENT_EMBED_CAPABILITIES}>
        <EditorComponentContainer id={containerId} fixed />
      </EditorCapabilitiesContext.Provider>
    </DocumentStoreContext.Provider>
  );
}
