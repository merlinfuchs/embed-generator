import { type ComponentType, lazy, type LazyExoticComponent } from "react";

const RELOAD_KEY = "embedg-chunk-reload";

function getFlag(key: string) {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function setFlag(key: string, value: boolean) {
  try {
    if (value) {
      sessionStorage.setItem(key, "1");
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Like React.lazy, but recovers from chunks that disappeared because a new
 * version was deployed while the page was open. Reloads once to pick up the
 * new index.html, guarded so a genuinely broken chunk doesn't loop.
 */
export function lazyView<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      setFlag(RELOAD_KEY, false);
      return mod;
    } catch (e) {
      if (getFlag(RELOAD_KEY)) {
        throw e;
      }

      setFlag(RELOAD_KEY, true);
      window.location.reload();
      // The page is going away, never resolve.
      return new Promise<never>(() => {});
    }
  });
}
