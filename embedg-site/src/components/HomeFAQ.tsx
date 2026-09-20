import React from "react";

export const faq = [
  {
    q: "Is Embed Generator free?",
    a: "Yes. Building and sending embeds, buttons and select menus is free with no account required to start. Premium is optional and adds things like more saved messages, recurring scheduled messages, custom commands and your own bot.",
  },
  {
    q: "Do I need a webhook or a bot?",
    a: "A webhook is enough for plain messages and embeds. Buttons that hand out roles, select menus, scheduled messages and slash commands need the Embed Generator bot on your server, which takes one click to add.",
  },
  {
    q: "Does it support Discord Components V2?",
    a: "Yes. You can switch a message to Components V2 in the editor to use sections, separators, media galleries and thumbnails.",
  },
  {
    q: "Can I change the name and avatar of the message?",
    a: "Yes. Webhook messages can use any name and avatar. With Premium you can also connect your own bot so replies to buttons and commands come from it instead of Embed Generator.",
  },
  {
    q: "Is it a Discohook alternative?",
    a: "Yes. Embed Generator does everything Discohook does and adds buttons, roles, scheduling and commands without extra bots. You can paste Discohook JSON straight into the editor. There is a short migration guide in the docs.",
  },
  {
    q: "Is it open source?",
    a: "Yes. The whole project, including the editor, bot and this site, is on GitHub.",
  },
];

export default function HomeFAQ(): JSX.Element {
  return (
    <section className="border-0 border-t border-solid border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <h2 className="m-0 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            Questions.
          </h2>
          <dl className="m-0 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="mb-2 text-base font-semibold text-mist-100">
                  {f.q}
                </dt>
                <dd className="m-0 text-sm leading-relaxed text-mist-400">
                  {f.a}
                  {f.q.startsWith("Is it a Discohook") && (
                    <>
                      {" "}
                      <a
                        href="/docs/guides/migrating-discohook"
                        className="text-azure-400 hover:text-azure-300"
                      >
                        Migrating from Discohook →
                      </a>
                    </>
                  )}
                  {f.q.startsWith("Is it open source") && (
                    <>
                      {" "}
                      <a
                        href="/source"
                        className="text-azure-400 hover:text-azure-300"
                      >
                        Source on GitHub →
                      </a>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
