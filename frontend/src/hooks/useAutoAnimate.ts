import { useEffect, useState } from "react";
import autoAnimate from "@formkit/auto-animate";

// a fixed version of the useAutoAnimate hook that supports conditional rendering
export default function useAutoAnimate<T>(options = {}) {
  const [element, setElement] = useState<T | null>(null);
  useEffect(() => {
    if (element instanceof HTMLElement) autoAnimate(element, options);
  }, [element, options]);
  return [setElement];
}
