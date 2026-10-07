import clsx from "clsx";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  wide?: boolean;
  // Lets touch screens open it with a tap. Off for tooltips on buttons, where
  // the tap already does something.
  tappable?: boolean;
  children: ReactNode;
}

export default function Tooltip({ text, wide, tappable, children }: Props) {
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!childRef.current) return;

    function onMouseEnter() {
      setShow(true);
    }

    function onMouseLeave() {
      setShow(false);
    }

    const child = childRef.current;
    child.addEventListener("mouseenter", onMouseEnter);
    child.addEventListener("mouseleave", onMouseLeave);

    return () => {
      child.removeEventListener("mouseleave", onMouseLeave);
      child.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  useEffect(() => {
    if (!show) return;

    function onMouseMove(e: MouseEvent) {
      const tooltipWidth = tooltipRef.current?.clientWidth ?? 0;
      const x = Math.max(e.clientX, tooltipWidth / 2);
      setPos([x, e.clientY]);
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [show]);

  useEffect(() => {
    if (!tappable || !childRef.current) return;

    const child = childRef.current;
    const halfWidth = wide ? 144 : 80;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse") return;

      if (child.contains(e.target as Node)) {
        const x = Math.min(
          Math.max(e.clientX, halfWidth),
          window.innerWidth - halfWidth,
        );
        setPos([x, e.clientY]);
        setShow((show) => !show);
      } else {
        setShow(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [tappable, wide]);

  return (
    <div>
      <div ref={childRef} aria-label={text}>
        {children}
      </div>
      {show && pos && (
        <div
          className={clsx(
            "fixed left-1/2 flex justify-center z-50",
            wide ? "w-72 -ml-36" : "w-40 -ml-20",
          )}
          style={{
            top: pos[1] + 20,
            left: pos[0],
          }}
          ref={tooltipRef}
        >
          <div
            className={clsx(
              "rounded-lg bg-black text-white py-1 px-2 block",
              wide
                ? "text-left text-sm whitespace-pre-line"
                : "flex-none text-center",
            )}
          >
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
