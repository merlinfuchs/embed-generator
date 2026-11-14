import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface Options {
  /** Whether the dropdown is open. The hook only reacts to keys then, besides opening it. */
  open: boolean;
  /** How many rows the list has. */
  count: number;
  /** Rows that can't be picked, which the highlight skips. */
  isDisabled?: (index: number) => boolean;
  onPick: (index: number) => void;
  onOpen: () => void;
  onClose: () => void;
  /** The highlight goes back to the first row when this changes, like when the search text does. */
  resetKey?: unknown;
}

/**
 * Keyboard control for the dropdown pickers: Arrow keys move a highlight, Enter picks the
 * highlighted row and Escape closes the list. Put `onKeyDown` on an element around the
 * trigger and the search input, since the keys bubble up from both.
 */
export function useListKeyboardNav({
  open,
  count,
  isDisabled,
  onPick,
  onOpen,
  onClose,
  resetKey,
}: Options) {
  const [active, setActive] = useState(-1);

  // Read at the time of the key press, so callers don't have to memoize their callbacks.
  const latest = useRef({ count, isDisabled, onPick, onOpen, onClose });
  latest.current = { count, isDisabled, onPick, onOpen, onClose };

  const rows = useRef<(HTMLElement | null)[]>([]);

  const step = useCallback((from: number, direction: 1 | -1) => {
    const { count, isDisabled } = latest.current;
    for (let i = 1; i <= count; i++) {
      const index = (((from + direction * i) % count) + count) % count;
      if (!isDisabled?.(index)) return index;
    }
    return -1;
  }, []);

  // Start at the first row that can be picked, which for a search is the best match.
  useEffect(() => {
    setActive(open && count > 0 ? step(-1, 1) : -1);
  }, [open, count, resetKey, step]);

  useEffect(() => {
    rows.current[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        latest.current.onOpen();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        setActive((prev) => step(prev, e.key === "ArrowDown" ? 1 : -1));
        break;
      case "Enter":
        if (active >= 0) {
          e.preventDefault();
          latest.current.onPick(active);
        }
        break;
      case "Escape":
        // Stops a modal around the picker from closing as well.
        e.stopPropagation();
        latest.current.onClose();
        break;
    }
  }

  /** Spread on each row. */
  function rowProps(index: number) {
    return {
      ref: (el: HTMLElement | null) => {
        rows.current[index] = el;
      },
      // So the mouse and the keyboard don't leave two rows highlighted.
      onMouseMove: () => setActive(index),
      "data-active": active === index || undefined,
    };
  }

  return { active, onKeyDown, rowProps };
}
