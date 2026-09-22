import clsx from "clsx";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

const GAP = 8;
const MAX_HEIGHT = 192;
const MIN_HEIGHT = 96;

interface Props {
  children: ReactNode;
}

/**
 * Dropdown for the select components. Positions itself above the trigger when
 * there isn't enough room below it and shrinks to whatever space is left.
 */
export default function SelectDropdown({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [maxHeight, setMaxHeight] = useState(MAX_HEIGHT);

  useLayoutEffect(() => {
    // the select component itself, the dropdown is positioned relative to it
    const anchor = ref.current?.parentElement;
    if (!anchor) return;

    function update() {
      const rect = anchor!.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - GAP * 2;
      const above = rect.top - GAP * 2;

      const placement = below < MIN_HEIGHT && above > below ? "top" : "bottom";
      setPlacement(placement);
      setMaxHeight(
        Math.max(Math.min(MAX_HEIGHT, placement === "top" ? above : below), 0),
      );
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ maxHeight }}
      className={clsx(
        "absolute bg-ink-900 left-0 rounded-lg shadow-lg w-full border-2 border-white/10 z-10 overflow-y-auto overflow-x-hidden",
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
      )}
    >
      {children}
    </div>
  );
}
