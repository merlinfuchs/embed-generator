import { createContext, useContext } from "react";

/**
 * What the component editors below are part of. A component embed is a
 * read-only subset of the message components: link buttons only, no select
 * menus, no files and no nested containers.
 * https://discord.com/developers/docs/link-previews/component-embeds
 */
export type EditorMode = "message" | "componentEmbed";

export const EditorModeContext = createContext<EditorMode>("message");

export const useEditorMode = () => useContext(EditorModeContext);

/** The component types a component embed allows inside its container. */
export const COMPONENT_EMBED_TYPES = [1, 9, 10, 12, 14];
