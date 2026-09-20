import React from "react";

export default function HomeNote(): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div className="flex items-center gap-4 self-start">
            <img
              src="/img/merlin.webp"
              alt="Merlin"
              className="h-14 w-14 flex-none rounded-full"
            />
            <div>
              <div className="font-semibold text-mist-100">Merlin</div>
              <div className="text-sm text-mist-500">
                builds Embed Generator
              </div>
            </div>
          </div>
          <div className="max-w-2xl">
            <p className="mb-4 text-lg leading-relaxed text-mist-300">
              I built Embed Generator because writing embed JSON by hand is
              miserable and I wanted something that just shows you the message
              while you make it.
            </p>
            <p className="mb-6 text-lg leading-relaxed text-mist-300">
              It's a side project I maintain in my free time, together with a
              few contributors, and the whole thing is open source. Premium is
              what pays for hosting. If you have questions or ideas, the
              Discord server is where I hang out.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href="/discord" className="text-azure-400 hover:text-azure-300">
                Join the Discord →
              </a>
              <a href="/source" className="text-azure-400 hover:text-azure-300">
                Source on GitHub →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
