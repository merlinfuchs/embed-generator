import React from "react";

export default function HomeNote(): JSX.Element {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 md:px-8 lg:py-24">
      <div className="flex gap-5">
        <img
          src="/img/merlin.webp"
          alt="Merlin"
          className="h-14 w-14 flex-none rounded-full"
        />
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm">
            <span className="font-medium text-mist-100">Merlin</span>
            <span className="rounded bg-[#EB459E] px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
              Dev
            </span>
          </div>
          <div className="space-y-3 text-base leading-relaxed text-mist-300">
            <p className="m-0">
              Hi, I'm Merlin. I built Embed Generator because writing embed
              JSON by hand is miserable and I wanted something that just shows
              you the message while you make it.
            </p>
            <p className="m-0">
              It's a side project I maintain in my free time, together with a
              few contributors, and the whole thing is open source. Premium is
              what pays for hosting. If you have questions or ideas, the
              Discord server is where I hang out.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="/discord" className="text-azure-400 hover:text-azure-300">
              Join the Discord →
            </a>
            <a href="/source" className="text-azure-400 hover:text-azure-300">
              Source on GitHub →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
