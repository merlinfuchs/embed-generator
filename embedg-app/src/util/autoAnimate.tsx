import autoAnimate, { type AutoAnimateOptions } from "@formkit/auto-animate";
import { type ReactNode, useEffect, useState } from "react";

/**
 * A fresh default would give the effect a new dependency every render, and
 * auto-animate starts a poll interval per child each time it is called without
 * ever clearing the previous one.
 */
const DEFAULT_OPTIONS: Partial<AutoAnimateOptions> = {};

export function useAutoAnimate<T>(
  options: Partial<AutoAnimateOptions> = DEFAULT_OPTIONS,
) {
  const [element, setElement] = useState<T | null>(null);

  useEffect(() => {
    if (!(element instanceof HTMLElement)) return;

    const controller = autoAnimate(element, options);
    return () => controller.disable();
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
