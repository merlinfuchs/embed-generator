import debounce from "just-debounce-it";
import { useEffect, useMemo, useState } from "react";
import { defaultMessage } from "../discord/defaultMessage";
import { parseMessageWithAction } from "../discord/importSchema";
import type { ZodTypeAny } from "zod";
import type { Message } from "../discord/schema";
import {
  type DocumentStoreApi,
  MESSAGE_STORE_KEY,
  type NodeId,
  persistedDocument,
  messageDocumentStore,
} from "./document";
import { toMessage } from "./documentConvert";
import type { createValidationErrorStore } from "./validationError";

export function getCurrentMessage(): Message {
  return getCurrentDocument().message;
}

/** The message together with the node ids of the values inside it. */
export function getCurrentDocument(): {
  message: Message;
  idToPath: Map<NodeId, string>;
} {
  return getDocument(messageDocumentStore);
}

function getDocument(store: DocumentStoreApi) {
  const { message, idToPath } = toMessage(store.getState());

  return { message, idToPath };
}

/**
 * The message and its node ids, at most once per `wait` milliseconds.
 * Subscribing instead of selecting keeps a keystroke from re-rendering
 * everything that reads the message.
 */
export function useDebouncedCurrentDocument(wait: number) {
  return useDebouncedDocument(messageDocumentStore, wait);
}

/** Like `useDebouncedCurrentDocument`, for any document store. */
export function useDebouncedDocument(store: DocumentStoreApi, wait: number) {
  const [document, setDocument] = useState<ReturnType<
    typeof getDocument
  > | null>(null);

  // Debouncing the work rather than the value keeps a typing burst from
  // converting the whole document once per keystroke.
  const update = useMemo(
    () => debounce(() => setDocument(getDocument(store)), wait),
    [store, wait],
  );

  useEffect(() => {
    update();

    return store.subscribe(update);
  }, [store, update]);

  return document;
}

/**
 * Checks the document against the schema whenever it settles and publishes the
 * issues to the validation store. Returns the document it checked.
 */
export function useDocumentValidation(
  store: DocumentStoreApi,
  schema: ZodTypeAny,
  validationStore: ReturnType<typeof createValidationErrorStore>,
) {
  const document = useDebouncedDocument(store, 250);

  useEffect(() => {
    if (!document) return;

    const res = schema.safeParse(document.message);
    validationStore
      .getState()
      .setError(res.success ? null : res.error, document.idToPath);
  }, [document, schema, validationStore]);

  return document;
}

/** Set by seeding when nothing was stored before this page load. */
let firstVisit = false;

/**
 * Whether nothing was stored before this page load. True only once, so the
 * templates don't come back when the editor is opened again.
 */
export function takeFirstVisit(): boolean {
  const first = firstVisit;
  firstVisit = false;
  return first;
}

/** Whether there is nothing in the message that replacing it would lose. */
export function currentMessageIsBlank(): boolean {
  const { content, embeds, components } = getCurrentMessage();
  return !content && embeds.length === 0 && components.length === 0;
}

export function setCurrentMessage(message: Message) {
  messageDocumentStore.getState().replaceAll(message);
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
  if (!draft) {
    firstVisit = persisted === "none";
    return;
  }

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

  messageDocumentStore.getState().replaceAll({ ...draft, ...owned });
}
