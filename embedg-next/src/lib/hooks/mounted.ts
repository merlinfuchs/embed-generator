import { useEffect, useState } from "react";

export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

export function useAfterMounted<T, Y>(val: T, def: Y): T | Y {
  const hasMounted = useHasMounted();

  return hasMounted ? val : def;
}
