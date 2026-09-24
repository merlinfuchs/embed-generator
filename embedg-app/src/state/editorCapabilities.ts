import { createContext, useContext } from "react";

/**
 * What the component editors below may produce. The message editor allows
 * everything its plan unlocks, while a component embed is a read-only subset:
 * link buttons only, no select menus, no files and no nested containers.
 * https://discord.com/developers/docs/link-previews/component-embeds
 */
export interface EditorCapabilities {
  /** Component types that can be added, or null for whatever the plan allows. */
  componentTypes: number[] | null;
  /** Whether buttons have to be link buttons. */
  linkButtonsOnly: boolean;
}

export const MESSAGE_CAPABILITIES: EditorCapabilities = {
  componentTypes: null,
  linkButtonsOnly: false,
};

export const COMPONENT_EMBED_CAPABILITIES: EditorCapabilities = {
  componentTypes: [1, 9, 10, 12, 14],
  linkButtonsOnly: true,
};

export const EditorCapabilitiesContext = createContext(MESSAGE_CAPABILITIES);

export const useEditorCapabilities = () =>
  useContext(EditorCapabilitiesContext);
