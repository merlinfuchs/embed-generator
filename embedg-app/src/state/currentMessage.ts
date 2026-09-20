import { useMemo } from "react";
import { parseMessageWithAction } from "../discord/restoreSchema";
import type { Message } from "../discord/schema";
import { hadPersistedDocument, useDocumentStore } from "./document";
import { toMessage } from "./documentConvert";
import { persistedMessage, useCurrentMessageStore } from "./message";

/**
 * Embeds live in the document store, everything else is still in `message.ts`.
 * Both halves are merged here until the remaining fields move over.
 */
export function getCurrentMessage(): Message {
  return {
    ...useCurrentMessageStore.getState(),
    embeds: toMessage(useDocumentStore.getState()).message.embeds,
  };
}

export function useCurrentMessage(): Message {
  const base = useCurrentMessageStore((state) => state);
  const embeds = useDocumentStore((state) => toMessage(state).message.embeds);

  return useMemo(() => ({ ...base, embeds }), [base, embeds]);
}

/** Writes a whole message back into both stores. */
export function setCurrentMessage(message: Message) {
  useCurrentMessageStore.getState().replace(message);
  useDocumentStore.getState().replaceAll(message);
}

/**
 * Drafts predate the document store, so the first time it runs it takes over
 * the embeds of the draft that is already in the message store.
 */
export function seedDocumentStore() {
  if (hadPersistedDocument) return;

  if (!persistedMessage) return;

  try {
    const { state } = JSON.parse(persistedMessage);
    useDocumentStore.getState().replaceAll(parseMessageWithAction(state));
  } catch (e) {
    console.error(
      "failed to seed the document store from the current draft",
      e,
    );
  }
}
