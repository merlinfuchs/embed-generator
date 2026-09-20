import debounce from "just-debounce-it";
import { useEffect, useMemo, useState } from "react";
import type { Message } from "../discord/schema";
import { hadPersistedDocument, useDocumentStore } from "./document";
import { toMessage } from "./documentConvert";
import { defaultMessage, useCurrentMessageStore } from "./message";

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

/** Node ids to zod issue paths, for the validation index. */
export function currentIdToPath() {
  return toMessage(useDocumentStore.getState()).idToPath;
}

/**
 * The merged message, at most once per `wait` milliseconds. Subscribing instead
 * of selecting keeps a keystroke from re-rendering everything that reads the
 * message, and keeps one debounce timer across a typing burst.
 */
export function useDebouncedCurrentMessage(wait: number): Message | undefined {
  const [message, setMessage] = useState<Message>();

  const debouncedSetMessage = useMemo(() => debounce(setMessage, wait), [wait]);

  useEffect(() => {
    const update = () => debouncedSetMessage(getCurrentMessage());
    update();

    const unsubscribers = [
      useCurrentMessageStore.subscribe(update),
      useDocumentStore.subscribe(update),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [debouncedSetMessage]);

  return message;
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
 * Drafts predate the document store, so the first time it runs it takes over
 * the embeds of the draft that is already in the message store, which the
 * persist middleware has rehydrated synchronously by now.
 */
export function seedDocumentStore() {
  if (hadPersistedDocument) return;

  useDocumentStore.getState().replaceAll(useCurrentMessageStore.getState());
}
