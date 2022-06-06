import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export default function useDebounce(
  effect: EffectCallback,
  rate: number,
  deps?: DependencyList
) {
  const timeout = useRef<any>(null);

  return useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(effect, rate);
  }, deps);
}
