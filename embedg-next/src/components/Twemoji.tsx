import { ReactNode } from "react";
import Inner from "react-twemoji";

interface Props {
  children: ReactNode;
  options: any;
}

export default function Twemoji({ children, options }: Props) {
  const opt = options || {};
  opt["base"] = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/";

  return <Inner options={opt}>{children}</Inner>;
}
