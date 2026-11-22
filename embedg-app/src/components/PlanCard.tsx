import { CheckIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";

export interface PlanStat {
  value: number | string;
  label: string;
}

interface Props {
  name: string;
  tagline: string;
  /** Price per month in dollars, as it is in Discord's store. */
  price?: string;
  /** What follows the price, "/ month" unless the plan is free. */
  period?: string;
  badge?: string;
  highlight?: boolean;
  stats: PlanStat[];
  /** The line above the checklist, like "Everything in Premium, and:". */
  intro?: string;
  features: { key: string; content: ReactNode }[];
  /** The button or link at the bottom of the card. */
  action: ReactNode;
}

export default function PlanCard({
  name,
  tagline,
  price,
  period = "/ month",
  badge,
  highlight,
  stats,
  intro,
  features,
  action,
}: Props) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 select-none ${
        highlight
          ? "border-amber-400/70 bg-[linear-gradient(160deg,#2B2D31_0%,#2F2E2C_60%,#3A3222_100%)]"
          : "border-white/10 bg-[#202226]"
      }`}
    >
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]"
        />
      )}
      <div className="relative flex items-center justify-between">
        <div className="text-base font-semibold text-white">{name}</div>
        {badge && (
          <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-ink-900">
            {badge}
          </span>
        )}
      </div>
      <div className="relative mt-4">
        {price ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">{price}</span>
            {period && <span className="text-sm text-mist-400">{period}</span>}
          </div>
        ) : (
          <div className="text-4xl font-bold text-white">{name}</div>
        )}
        <div className="mt-1 text-sm text-mist-400">{tagline}</div>
      </div>
      <div
        className="relative mt-6 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white/5 px-2 py-3 text-center"
          >
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-mist-400">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-6 flex-auto">
        {intro && (
          <div className="mb-3 text-sm font-medium text-white">{intro}</div>
        )}
        <ul className="space-y-2.5">
          {features.map((feature) => (
            <li
              key={feature.key}
              className="flex items-start gap-2.5 text-sm text-mist-300"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
              <span>{feature.content}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-6">{action}</div>
    </div>
  );
}

const primaryButton =
  "block w-full rounded-lg bg-amber-400 px-4 py-2.5 text-center font-semibold text-ink-900 transition-colors hover:bg-amber-300";
const secondaryButton =
  "block w-full rounded-lg border border-white/15 px-4 py-2.5 text-center font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5";

export function PlanButton({
  primary,
  children,
  ...props
}: {
  primary?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={primary ? primaryButton : secondaryButton}
      {...props}
    >
      {children}
    </button>
  );
}

export function PlanLink({
  primary,
  children,
  href,
}: {
  primary?: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className={primary ? primaryButton : secondaryButton}
      href={href}
      target="_blank"
      rel="noopener"
    >
      {children}
    </a>
  );
}
