import { type ComponentType, lazy, type LazyExoticComponent } from "react";

export const RELOAD_KEY = "embedg-chunk-reload";
const RELOAD_WINDOW_MS = 10_000;

/**
 * Reload to pick up the new index.html, unless we already did recently.
 * Returns whether the reload was triggered.
 *
 * Time based rather than a flag cleared on success: a screen that loads several
 * chunks would otherwise clear the flag with one of them and re-arm the reload
 * for the next failure, which loops.
 *
 * When sessionStorage is unavailable (third party iframe with storage blocked,
 * e.g. the Discord activity under Safari) we can't tell whether we already
 * reloaded, so we don't. Surfacing the error beats risking a loop.
 */
function reloadOnce(): boolean {
  try {
    const at = sessionStorage.getItem(RELOAD_KEY);
    if (at && Date.now() - Number(at) < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}

/**
 * Like React.lazy, but recovers from chunks that disappeared because a new
 * version was deployed while the page was open.
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
      if (!reloadOnce()) throw e;
      // The page is going away, never resolve.
      return new Promise<never>(() => {});
    }
  });
}
