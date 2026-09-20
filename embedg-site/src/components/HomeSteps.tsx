import React from "react";

const steps = [
  {
    n: "1",
    title: "Build it in the editor",
    text: "Add embeds, buttons and select menus, or switch to Components V2 for sections and separators. The preview updates as you type, so what you see is what your members get.",
  },
  {
    n: "2",
    title: "Send it with a webhook or the bot",
    text: "Paste a webhook URL for plain messages, or add the Embed Generator bot to your server when you want buttons that hand out roles, reply, or open links.",
  },
  {
    n: "3",
    title: "Save, schedule, reuse",
    text: "Keep your messages in the cloud, send them again in other channels, schedule them for later, or turn them into slash commands your members can run.",
  },
];

export default function HomeSteps(): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <h2 className="m-0 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            How it works.
          </h2>
          <ol className="m-0 grid list-none gap-8 p-0 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n}>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-azure-500/15 text-sm font-semibold text-azure-300">
                  {s.n}
                </div>
                <h3 className="mb-2 text-base font-semibold text-mist-100">
                  {s.title}
                </h3>
                <p className="m-0 text-sm leading-relaxed text-mist-400">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
