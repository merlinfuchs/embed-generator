import { render, screen } from "@testing-library/react";
import { type ComponentType, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { beforeEach, expect, test, vi } from "vitest";
import { lazyView, RELOAD_KEY } from "./lazyView";

const reload = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  reload.mockClear();
  vi.restoreAllMocks();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload },
  });
});

function renderLazy(factory: () => Promise<{ default: ComponentType }>) {
  const View = lazyView(factory);
  render(
    <ErrorBoundary fallback={<div>boundary</div>}>
      <Suspense fallback={<div>loading</div>}>
        <View />
      </Suspense>
    </ErrorBoundary>,
  );
}

const missingChunk = () =>
  Promise.reject(new Error("Failed to fetch dynamically imported module"));

test("renders the chunk when it loads", async () => {
  renderLazy(async () => ({ default: () => <div>chunk</div> }));

  expect(await screen.findByText("chunk")).toBeInTheDocument();
  expect(reload).not.toHaveBeenCalled();
});

test("reloads when a chunk from an older deploy is gone", async () => {
  renderLazy(missingChunk);

  await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  // Stays suspended rather than flashing an error while the page navigates.
  expect(screen.getByText("loading")).toBeInTheDocument();
});

test("surfaces the error instead of reloading again", async () => {
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));

  renderLazy(missingChunk);

  expect(await screen.findByText("boundary")).toBeInTheDocument();
  expect(reload).not.toHaveBeenCalled();
});

test("a chunk that loads in between does not re-arm the reload", async () => {
  renderLazy(missingChunk);
  await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

  renderLazy(async () => ({ default: () => <div>chunk</div> }));
  expect(await screen.findByText("chunk")).toBeInTheDocument();

  renderLazy(missingChunk);
  expect(await screen.findByText("boundary")).toBeInTheDocument();
  expect(reload).toHaveBeenCalledTimes(1);
});

test("reloads again once the window has passed", async () => {
  sessionStorage.setItem(RELOAD_KEY, String(Date.now() - 60_000));

  renderLazy(missingChunk);

  await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
});

test("does not reload when sessionStorage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });

  renderLazy(missingChunk);

  expect(await screen.findByText("boundary")).toBeInTheDocument();
  expect(reload).not.toHaveBeenCalled();
});
