import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// jsdom has no layout engine, so the parts of the editor that measure elements
// or wait for fonts get inert stand-ins. The store tests run without a DOM at
// all, hence the guard.
if (typeof window !== "undefined") {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  window.matchMedia = () =>
    ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }) as unknown as MediaQueryList;

  // jsdom has no Web Animations API, and the list animations do not matter
  // for behaviour.
  Element.prototype.animate = () =>
    ({
      cancel() {},
      finish() {},
      addEventListener() {},
      removeEventListener() {},
      onfinish: null,
      effect: null,
    }) as unknown as Animation;

  if (!document.fonts) {
    Object.defineProperty(document, "fonts", {
      value: { addEventListener() {}, removeEventListener() {} },
    });
  }
}

if (typeof window !== "undefined") {
  // Auto cleanup only hooks itself up when vitest globals are enabled.
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
