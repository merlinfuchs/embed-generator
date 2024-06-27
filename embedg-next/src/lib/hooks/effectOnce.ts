import { useEffect, useRef } from "react";

export function useEffectOnce(effect: React.EffectCallback) {
  const exectued = useRef(false);

  useEffect(() => {
    if (exectued.current) return;
    exectued.current = true;
    return effect();
  }, []);
}
