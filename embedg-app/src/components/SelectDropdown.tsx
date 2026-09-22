import clsx from "clsx";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

const MARGIN = 16;
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
  const [{ placement, maxHeight }, setPosition] = useState<{
    placement: "top" | "bottom";
    maxHeight: number;
  }>({ placement: "bottom", maxHeight: MAX_HEIGHT });

  useLayoutEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      // the select itself, the dropdown is positioned relative to it
      const rect = ref.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const below = window.innerHeight - rect.bottom - MARGIN;
      const above = rect.top - MARGIN;
      const next = below < MIN_HEIGHT && above > below ? "top" : "bottom";

      setPosition({
        placement: next,
        maxHeight: Math.max(
          Math.min(MAX_HEIGHT, next === "top" ? above : below),
          0,
        ),
      });
    };

    const schedule = (e: Event) => {
      // scrolling the options doesn't move the select we hang off of
      if (e.target instanceof Node && ref.current?.contains(e.target)) return;
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
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
