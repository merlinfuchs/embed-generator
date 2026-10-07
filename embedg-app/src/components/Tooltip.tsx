import clsx from "clsx";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Props {
  text: string;
  wide?: boolean;
  children: ReactNode;
}

// Space kept between the tooltip and the edges of the screen.
const SCREEN_MARGIN = 8;

export default function Tooltip({ text, wide, children }: Props) {
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!childRef.current) return;

    const child = childRef.current;

    // Centered below the child.
    function open() {
      const rect = (child.firstElementChild ?? child).getBoundingClientRect();
      setPos([rect.left + rect.width / 2, rect.bottom]);
    }

    function close() {
      setPos(null);
    }

    // Touch screens open it with an emulated mouseenter, but only close it
    // once something else is tapped.
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "mouse" && !child.contains(e.target as Node)) {
        close();
      }
    }

    child.addEventListener("mouseenter", open);
    child.addEventListener("mouseleave", close);
    document.addEventListener("pointerdown", onPointerDown);
    // The tooltip is fixed, so it would stay behind when the page scrolls.
    document.addEventListener("scroll", close, true);

    return () => {
      child.removeEventListener("mouseenter", open);
      child.removeEventListener("mouseleave", close);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", close, true);
    };
  }, []);

  // Pushes the tooltip back on screen before it's painted.
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip || !pos) return;

    tooltip.style.transform = "translateX(-50%)";
    const rect = tooltip.getBoundingClientRect();
    const shift =
      Math.max(SCREEN_MARGIN - rect.left, 0) -
      Math.max(rect.right - (window.innerWidth - SCREEN_MARGIN), 0);
    if (shift) {
      tooltip.style.transform = `translateX(calc(-50% + ${shift}px))`;
    }
  }, [pos]);

  return (
    <div>
      <div ref={childRef} aria-label={text}>
        {children}
      </div>
      {pos && (
        <div
          ref={tooltipRef}
          className={clsx(
            "fixed z-50 rounded-lg bg-black text-white py-1 px-2",
            wide ? "w-72 text-left text-sm whitespace-pre-line" : "w-max",
          )}
          style={{
            top: pos[1] + 8,
            left: pos[0],
            transform: "translateX(-50%)",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
