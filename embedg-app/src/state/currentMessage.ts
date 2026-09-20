import debounce from "just-debounce-it";
import { useEffect, useMemo, useState } from "react";
import { defaultMessage } from "../discord/defaultMessage";
import { parseMessageWithAction } from "../discord/importSchema";
import type { Message } from "../discord/schema";
import {
  MESSAGE_STORE_KEY,
  type NodeId,
  persistedDocument,
  useDocumentStore,
} from "./document";
import { toMessage } from "./documentConvert";

export function getCurrentMessage(): Message {
  return getCurrentDocument().message;
}

/** The message together with the node ids of the values inside it. */
export function getCurrentDocument(): {
  message: Message;
  idToPath: Map<NodeId, string>;
} {
  const { message, idToPath } = toMessage(useDocumentStore.getState());

  return { message, idToPath };
}

/**
 * The message and its node ids, at most once per `wait` milliseconds.
 * Subscribing instead of selecting keeps a keystroke from re-rendering
 * everything that reads the message.
 */
export function useDebouncedCurrentDocument(wait: number) {
  const [document, setDocument] = useState<ReturnType<
    typeof getCurrentDocument
  > | null>(null);

  // Debouncing the work rather than the value keeps a typing burst from
  // converting the whole document once per keystroke.
  const update = useMemo(
    () => debounce(() => setDocument(getCurrentDocument()), wait),
    [wait],
  );

  useEffect(() => {
    update();

    return useDocumentStore.subscribe(update);
  }, [update]);

  return document;
}

export function setCurrentMessage(message: Message) {
  useDocumentStore.getState().replaceAll(message);
}

export function clearCurrentMessage() {
  setCurrentMessage(defaultMessage);
}

/** The draft the message store used to own, straight out of storage. */
function legacyDraft(): Message | null {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(MESSAGE_STORE_KEY);
  if (!raw) return null;

  try {
    return parseMessageWithAction(JSON.parse(raw).state);
  } catch (e) {
    console.error("failed to read the draft from the message store", e);
    return null;
  }
}

/**
 * Takes over whatever the message store still owned, which depends on how far
 * the document store had got when the draft was last written: version 1 owned
 * only the embeds, version 2 the components and action sets as well, and
 * version 3 owns the whole message.
 */
export function seedDocumentStore() {
  const persisted = persistedDocument();
  if (persisted === "current") return;

  const draft = legacyDraft();
  if (!draft) return;

  const current = getCurrentDocument().message;
  const owned =
    persisted === "none"
      ? {}
      : persisted === 1
        ? { embeds: current.embeds }
        : {
            embeds: current.embeds,
            components: current.components,
            actions: current.actions,
          };

  useDocumentStore.getState().replaceAll({ ...draft, ...owned });
}
