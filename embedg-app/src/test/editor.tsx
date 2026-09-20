import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { parseMessageWithAction } from "../discord/restoreSchema";
import { useDocumentStore } from "../state/document";
import { toMessage } from "../state/documentConvert";

/** Puts the document store in a known state for a test. */
export function loadMessage(raw: unknown) {
  useDocumentStore.getState().replaceAll(parseMessageWithAction(raw));
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
export function editorUser() {
  return userEvent.setup({ pointerEventsCheck: 0 });
}
