import type { ReactNode } from "react";
import Inner from "react-twemoji";

/**
 * react-twemoji deep compares its props on every update, so a fresh options
 * object means it re-walks the whole preview DOM each render. Callers name a
 * class instead and the option objects are kept stable here.
 */
const optionsByClassName = new Map<
  string,
  { className: string; base: string }
>();

function optionsFor(className: string) {
  let options = optionsByClassName.get(className);

  if (!options) {
    options = {
      className,
      base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
    };
    optionsByClassName.set(className, options);
  }

  return options;
}

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Twemoji({
  children,
  className = "discord-twemoji",
}: Props) {
  return <Inner options={optionsFor(className)}>{children}</Inner>;
}
