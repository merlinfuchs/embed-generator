import { createContext, useContext } from "react";

/**
 * What the component editors below may produce. The message editor allows
 * everything, though a webhook can't send what only the bot handles, while a
 * component embed is a read-only subset: link buttons only, no select menus,
 * no files and no nested containers.
 * https://discord.com/developers/docs/link-previews/component-embeds
 */
export interface EditorCapabilities {
  /** Component types that can be added, or null for all of them. */
  componentTypes: number[] | null;
  /** Whether buttons have to be link buttons. */
  linkButtonsOnly: boolean;
  /**
   * Whether buttons with actions and select menus can be sent, which takes
   * the bot. New buttons are link buttons otherwise.
   */
  interactive: boolean;
}

export const MESSAGE_CAPABILITIES: EditorCapabilities = {
  componentTypes: null,
  linkButtonsOnly: false,
  interactive: true,
};

export const WEBHOOK_MESSAGE_CAPABILITIES: EditorCapabilities = {
  ...MESSAGE_CAPABILITIES,
  interactive: false,
};

export const COMPONENT_EMBED_CAPABILITIES: EditorCapabilities = {
  componentTypes: [1, 9, 10, 12, 14],
  linkButtonsOnly: true,
  interactive: false,
};

export const EditorCapabilitiesContext = createContext(MESSAGE_CAPABILITIES);

export const useEditorCapabilities = () =>
  useContext(EditorCapabilitiesContext);
