import autoAnimate, { type AutoAnimateOptions } from "@formkit/auto-animate";
import { type ReactNode, useEffect, useState } from "react";

export function useAutoAnimate<T>(options: Partial<AutoAnimateOptions> = {}) {
  const [element, setElement] = useState<T | null>(null);
  useEffect(() => {
    if (element instanceof HTMLElement) autoAnimate(element, options);
  }, [element, options]);
  return [setElement];
}

interface Props {
  children: ReactNode;
  className?: string;
}

export function AutoAnimate({ children, className }: Props) {
  const [setElement] = useAutoAnimate();
  return (
    <div ref={setElement} className={className}>
      {children}
    </div>
  );
}
