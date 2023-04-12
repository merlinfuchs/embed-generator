import { ReactNode, useEffect, useRef } from "react";

interface Props {
  onClickOutside: () => void;
  children: ReactNode;
  className?: string;
}

export default function ClickOutsideHandler({
  onClickOutside,
  children,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClickOutside]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
