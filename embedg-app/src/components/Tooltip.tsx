import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  children: ReactNode;
}

export default function Tooltip({ text, children }: Props) {
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

  return (
    <div>
      <div ref={childRef} aria-label={text}>
        {children}
      </div>
      {show && pos && (
        <div
          className="fixed w-40 -ml-20 left-1/2 flex justify-center z-50"
          style={{
            top: pos[1] + 20,
            left: pos[0],
          }}
          ref={tooltipRef}
        >
          <div
            className={clsx(
              "rounded bg-black text-white py-1 px-2 flex-none block text-center"
            )}
          >
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
