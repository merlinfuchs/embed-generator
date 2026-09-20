import debounce from "just-debounce-it";
import { useEffect, useMemo, useState } from "react";
import type { Message } from "../discord/schema";
import {
  DOCUMENT_VERSION,
  type NodeId,
  persistedDocumentVersion,
  useDocumentStore,
} from "./document";
import { toMessage } from "./documentConvert";
import { defaultMessage, useCurrentMessageStore } from "./message";

/**
 * Embeds, components and their action sets live in the document store; the
 * root fields are still in `message.ts`. Both halves are merged here until the
 * rest moves over.
 */
export function getCurrentMessage(): Message {
  return getCurrentDocument().message;
}

/** The merged message together with the node ids of its embeds. */
export function getCurrentDocument(): {
  message: Message;
  idToPath: Map<NodeId, string>;
} {
  const converted = toMessage(useDocumentStore.getState());

  return {
    message: {
      ...useCurrentMessageStore.getState(),
      embeds: converted.message.embeds,
      components: converted.message.components,
      actions: converted.message.actions,
    },
    idToPath: converted.idToPath,
  };
}

/**
 * The merged message and its node ids, at most once per `wait` milliseconds.
 * Subscribing instead of selecting keeps a keystroke from re-rendering
 * everything that reads the message, and both halves come from one conversion
 * so the ids always describe the message that was validated.
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

    const unsubscribers = [
      useCurrentMessageStore.subscribe(update),
      useDocumentStore.subscribe(update),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [update]);

  return document;
}

/** Writes a whole message back into both stores. */
export function setCurrentMessage(message: Message) {
  useCurrentMessageStore.getState().replace(message);
  useDocumentStore.getState().replaceAll(message);
}

export function clearCurrentMessage() {
  setCurrentMessage(defaultMessage);
}

/**
 * The Components V2 toggle replaces the message rather than editing it, so the
 * document store has to follow the message store instead of keeping its embeds.
 */
export function setComponentsV2Enabled(enabled: boolean) {
  useCurrentMessageStore.getState().setComponentsV2Enabled(enabled);
  useDocumentStore.getState().replaceAll(useCurrentMessageStore.getState());
}

/**
 * Hands a draft over to the document store as it takes ownership of more of
 * the message. Version 0 predates the store entirely; version 1 owned the
 * embeds but left components and action sets to the message store, so its
 * copy of those is stale. The message store rehydrates synchronously, so its
 * state is the parsed draft by now.
 */
export function seedDocumentStore() {
  if (persistedDocumentVersion === DOCUMENT_VERSION) return;

  const draft = useCurrentMessageStore.getState();

  if (persistedDocumentVersion === null) {
    useDocumentStore.getState().replaceAll(draft);
    return;
  }

  const { message } = getCurrentDocument();
  useDocumentStore.getState().replaceAll({
    ...message,
    components: draft.components,
    actions: draft.actions,
  });
}
