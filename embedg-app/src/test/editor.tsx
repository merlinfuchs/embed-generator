import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { parseMessageWithAction } from "../discord/restoreSchema";
import { setCurrentMessage } from "../state/currentMessage";
import { useDocumentStore } from "../state/document";
import { toMessage } from "../state/documentConvert";

/**
 * Puts the store in a known state, the way an import does.
 */
export function loadMessage(raw: unknown) {
  // Loading a fixture is not an edit, and letting it through would both leave
  // an entry in the history and arm zundo's debounce, swallowing the first
  // change a test makes.
  const history = useDocumentStore.temporal.getState();
  history.pause();

  setCurrentMessage(parseMessageWithAction(raw));

  history.clear();
  useDocumentStore.temporal.getState().resume();
}

export function currentMessage() {
  return toMessage(useDocumentStore.getState()).message;
}

export function currentComponents() {
  return toMessage(useDocumentStore.getState()).message.components;
}

export function rootId() {
  return useDocumentStore.getState().rootId;
}

/** Editors reach for the router and the query client, so tests wrap them. */
export function renderEditor(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/**
 * jsdom reports no computed styles, which userEvent reads as "pointer events
 * are off", so the check is disabled.
 */
export function editorUser(options?: Parameters<typeof userEvent.setup>[0]) {
  return userEvent.setup({ pointerEventsCheck: 0, ...options });
}
