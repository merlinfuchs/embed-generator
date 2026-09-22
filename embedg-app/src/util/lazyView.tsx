import { type ComponentType, lazy, type LazyExoticComponent } from "react";

const RELOAD_KEY = "embedg-chunk-reload";
const RELOAD_WINDOW_MS = 10_000;

/**
 * Whether we already reloaded recently. Time based rather than a flag we clear
 * on success: a screen that loads several chunks would otherwise clear the flag
 * with one of them and re-arm the reload for the next failure, which loops.
 *
 * When sessionStorage is unavailable (third party iframe with storage blocked,
 * e.g. the Discord activity under Safari) we can't tell, so we assume we
 * already reloaded. Surfacing the error to the boundary beats risking a loop.
 */
function reloadedRecently() {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_KEY));
    if (!at) return false;
    return Date.now() - at < RELOAD_WINDOW_MS;
  } catch {
    return true;
  }
}

function markReloaded() {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {}
}

/**
 * Like React.lazy, but recovers from chunks that disappeared because a new
 * version was deployed while the page was open. Reloads to pick up the new
 * index.html, at most once per RELOAD_WINDOW_MS.
 *
 * This only covers chunks loaded after the app booted. A stale index.html whose
 * entry bundle is gone never gets this far, which is what the no-cache header
 * on index.html is for.
 */
export function lazyView<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (e) {
      if (reloadedRecently()) {
        throw e;
      }

      markReloaded();
      window.location.reload();
      // The page is going away, never resolve.
      return new Promise<never>(() => {});
    }
  });
}
