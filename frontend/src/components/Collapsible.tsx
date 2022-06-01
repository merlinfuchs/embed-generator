import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  collapsed: boolean;
}

export default function Collapsible({ children, collapsed }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const newHeight = ref.current ? ref.current.clientHeight : undefined;
    if (height !== newHeight) {
      setHeight(newHeight);
    }
  });

  return (
    <div
      style={{ height: collapsed || !height ? 0 : height }}
      className="transition-all duration-300 overflow-y-hidden"
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}
