import React from "react";

// Small building blocks shared by the message mockups on the landing page.

export type AvatarSpec =
  | { src: string }
  | { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string };

export function Avatar({
  src,
  icon: Icon,
  color,
  size = "h-10 w-10",
}: {
  src?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
  size?: string;
}): JSX.Element {
  if (src) {
    return <img src={src} alt="" className={`${size} flex-none rounded-full`} />;
  }
  return (
    <div
      className={`${size} ${color} flex flex-none items-center justify-center rounded-full text-white`}
    >
      {Icon && <Icon className="h-[55%] w-[55%]" />}
    </div>
  );
}

export function Reactions({
  items,
}: {
  items: { emoji: string; count: number }[];
}): JSX.Element {
  const [state, setState] = React.useState(
    items.map((i) => ({ ...i, mine: false }))
  );
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {state.map((r, idx) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() =>
            setState((s) =>
              s.map((x, i) =>
                i === idx
                  ? { ...x, mine: !x.mine, count: x.count + (x.mine ? -1 : 1) }
                  : x
              )
            )
          }
          className={[
            "flex cursor-pointer items-center gap-1.5 rounded-md border border-solid px-2 py-0.5 text-sm transition-colors",
            r.mine
              ? "border-azure-500 bg-azure-500/20 text-mist-100"
              : "border-white/10 bg-white/5 text-mist-300 hover:border-white/20",
          ].join(" ")}
        >
          <span>{r.emoji}</span>
          <span className="text-xs font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  );
}

export function Typing({ who }: { who: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-xs text-mist-400">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-mist-400"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span>
        <span className="font-semibold text-mist-300">{who}</span> is typing…
      </span>
    </div>
  );
}

export function DiscordButton({
  children,
  style = "secondary",
  href,
  onClick,
}: {
  children: React.ReactNode;
  style?: "primary" | "success" | "danger" | "secondary";
  href?: string;
  onClick?: () => void;
}): JSX.Element {
  const cls = {
    primary: "bg-discord-button hover:bg-[#4752C4]",
    success: "bg-discord-success hover:bg-[#1A6334]",
    danger: "bg-[#DA373C] hover:bg-[#A12828]",
    secondary: "bg-[#4E5058] hover:bg-[#6D6F78]",
  }[style];
  const base = `${cls} inline-flex cursor-pointer items-center rounded px-4 py-1.5 text-sm font-medium text-white transition-colors hover:text-white hover:no-underline`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={base}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${base} border-0`}>
      {children}
    </button>
  );
}
