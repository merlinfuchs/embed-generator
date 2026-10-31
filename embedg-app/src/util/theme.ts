import { useEffect, useSyncExternalStore } from "react";
import { useSettingsStore } from "../state/settings";

const darkQuery = "(prefers-color-scheme: dark)";

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia?.(darkQuery);
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

function systemPrefersLight() {
  return window.matchMedia?.(darkQuery).matches === false;
}

/** The theme actually shown, with "system" resolved to dark or light. */
export function useResolvedTheme(): "dark" | "light" {
  const theme = useSettingsStore((s) => s.theme);
  const prefersLight = useSyncExternalStore(
    subscribeSystemTheme,
    systemPrefersLight,
  );
  if (theme === "system") return prefersLight ? "light" : "dark";
  return theme;
}

/**
 * Keeps the `light` class on <html> in sync with the setting. index.html sets
 * it before the app loads so a light page doesn't flash dark first.
 */
export function useApplyTheme() {
  const resolved = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", resolved === "light");
    root.style.colorScheme = resolved;
  }, [resolved]);
}
