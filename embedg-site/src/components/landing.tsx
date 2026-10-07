import React from "react";
import Head from "@docusaurus/Head";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/solid";
import HomeHeader from "./HomeHeader";
import HomeFooter from "./HomeFooter";

import "../css/tailwind.css";

// Building blocks for the /features landing pages, styled like the homepage.

export interface Link {
  label: string;
  href: string;
}

export interface Faq {
  q: string;
  a: string;
  link?: Link;
}

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export function LandingPage({
  title,
  description,
  faq,
  children,
}: {
  title: string;
  description: string;
  faq: Faq[];
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-[100dvh] bg-ink-900 font-sans text-mist-100 antialiased">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <style>
          {
            "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"
          }
        </style>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Head>
      <HomeHeader />
      <main>{children}</main>
      <HomeFooter />
    </div>
  );
}

function PrimaryButton({ cta }: { cta: Link }): JSX.Element {
  return (
    <a
      href={cta.href}
      className="flex items-center gap-2 rounded-lg bg-azure-500 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-azure-400 hover:text-white hover:no-underline"
    >
      <SparklesIcon className="h-5 w-5" />
      {cta.label}
    </a>
  );
}

export function Hero({
  title,
  text,
  cta,
  stats,
  aside,
}: {
  title: React.ReactNode;
  text: string;
  cta: Link;
  stats: { value: string; label: string }[];
  aside: React.ReactNode;
}): JSX.Element {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[520px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure-600/20 blur-[140px]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-mist-100 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-mist-400">
            {text}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton cta={cta} />
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-lg border border-solid border-white/10 px-5 py-3 text-base font-semibold text-mist-100 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white hover:no-underline"
            >
              How it works
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-mist-100">{s.value}</div>
                <div className="text-sm text-mist-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {aside}
      </div>
    </section>
  );
}

export function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <h2 className="m-0 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            {title}
          </h2>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

// The target of the hero's "How it works" button.
export function Steps({
  title,
  steps,
  image,
}: {
  title: string;
  steps: { title: string; text: string }[];
  image: { src: string; alt: string };
}): JSX.Element {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-0 border-t border-solid border-white/5"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-2 lg:py-24">
        <div>
          <h2 className="mb-10 mt-0 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            {title}
          </h2>
          <ol className="m-0 grid list-none gap-8 p-0">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-azure-500/15 text-sm font-semibold text-azure-300">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-2 mt-1 text-base font-semibold text-mist-100">
                    {s.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed text-mist-400">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="w-full rounded-2xl border border-solid border-white/5 shadow-card"
        />
      </div>
    </section>
  );
}

export function Features({
  title,
  features,
}: {
  title: string;
  features: { icon: Icon; name: string; text: string; href?: string }[];
}): JSX.Element {
  return (
    <Section title={title}>
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((f) => (
          <div key={f.name}>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-azure-500/15 text-azure-300">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 mt-0 text-base font-semibold text-mist-100">
              {f.name}
            </h3>
            <p className="m-0 text-sm leading-relaxed text-mist-400">
              {f.text}
              {f.href && (
                <>
                  {" "}
                  <a
                    href={f.href}
                    className="text-azure-400 hover:text-azure-300"
                  >
                    Learn more →
                  </a>
                </>
              )}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Callout({
  icon: Icon,
  title,
  text,
  link,
}: {
  icon: Icon;
  title: string;
  text: string;
  link: Link;
}): JSX.Element {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 lg:pb-24">
      <div className="relative grid gap-8 overflow-hidden rounded-3xl border border-solid border-white/5 bg-ink-800 px-6 py-10 md:px-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-azure-500/15 blur-[110px]"
        />
        <div className="relative flex gap-5">
          <Icon className="hidden h-10 w-10 flex-none text-azure-300 sm:block" />
          <div>
            <h2 className="mb-3 mt-0 text-2xl font-bold tracking-tight text-mist-100">
              {title}
            </h2>
            <p className="m-0 max-w-2xl text-mist-400">{text}</p>
          </div>
        </div>
        <a
          href={link.href}
          className="relative flex items-center gap-2 justify-self-start rounded-lg border border-solid border-white/10 px-5 py-3 font-semibold text-mist-100 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white hover:no-underline"
        >
          {link.label}
          <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

export function Questions({ faq }: { faq: Faq[] }): JSX.Element {
  return (
    <Section title="Questions.">
      <dl className="m-0 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {faq.map((f) => (
          <div key={f.q}>
            <dt className="mb-2 text-base font-semibold text-mist-100">
              {f.q}
            </dt>
            <dd className="m-0 text-sm leading-relaxed text-mist-400">
              {f.a}
              {f.link && (
                <>
                  {" "}
                  <a
                    href={f.link.href}
                    className="text-azure-400 hover:text-azure-300"
                  >
                    {f.link.label} →
                  </a>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export function ClosingCta({
  title,
  text,
  cta,
}: {
  title: string;
  text: string;
  cta: Link;
}): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-20 text-center md:px-8 lg:py-24">
        <h2 className="mb-4 mt-0 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
          {title}
        </h2>
        <p className="mb-8 mt-0 max-w-md text-lg text-mist-400">{text}</p>
        <PrimaryButton cta={cta} />
      </div>
    </section>
  );
}
