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
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
