import React from "react";
import { Avatar, DiscordButton, Reactions, Typing } from "./discord";

function Tag({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-solid border-azure-500/30 bg-azure-500/10 px-2.5 py-0.5 text-xs font-medium text-azure-300 hover:border-azure-400 hover:text-azure-200 hover:no-underline"
    >
      {children}
    </a>
  );
}

function Message({
  avatar,
  name,
  app,
  time,
  tags,
  children,
}: {
  avatar: React.ReactNode;
  name: string;
  app?: boolean;
  time: string;
  tags?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 px-4 py-3 hover:bg-white/[0.02] sm:px-6">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-mist-100">{name}</span>
          {app && (
            <span className="rounded bg-azure-500 px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
              App
            </span>
          )}
          <span className="text-xs text-mist-500">{time}</span>
          {tags && <span className="ml-auto flex gap-1.5">{tags}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 sm:px-6">
      <div className="h-px flex-1 bg-white/5" />
      <span className="text-xs font-semibold text-mist-500">{label}</span>
      <div className="h-px flex-1 bg-white/5" />
    </div>
  );
}

function Embed({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-1 max-w-lg rounded-md border-0 border-l-4 border-solid bg-ink-700 p-4"
      style={{ borderColor: color }}
    >
      {children}
    </div>
  );
}

const server = <Avatar src="/img/logo.svg" />;
const sarah = <Avatar initial="S" color="bg-[#EB459E]" />;
const tom = <Avatar initial="T" color="bg-[#57C271]" />;

// Features shown as a chat log instead of a grid of icons.
export default function HomeShowcase(): JSX.Element {
  const [entered, setEntered] = React.useState(false);

  return (
    <section className="border-0 border-t border-solid border-white/5 bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            A day in a server that uses Embed Generator.
          </h2>
          <p className="text-lg text-mist-400">
            Everything below was made in the editor. The blue tags tell you
            which feature did it.
          </p>
        </div>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-solid border-white/10 bg-ink-800 shadow-card">
          <div className="flex items-center gap-2 border-0 border-b border-solid border-white/5 px-4 py-2.5 text-sm text-mist-500 sm:px-6">
            <span className="text-lg leading-none">#</span>
            <span className="font-medium text-mist-300">general</span>
          </div>

          <div className="py-3">
            <Divider label="Monday" />

            <Message
              avatar={server}
              name="Your Server"
              app
              time="9:00 AM"
              tags={
                <Tag href="/docs/guides/scheduled-messages">
                  Scheduled, repeats daily
                </Tag>
              }
            >
              <div className="text-sm text-mist-300">
                ☀️ Morning everyone! Voice hangout tonight at 8, bring snacks.
              </div>
              <Reactions items={[{ emoji: "☀️", count: 23 }]} />
            </Message>

            <Message
              avatar={sarah}
              name="sarah"
              time="2:14 PM"
              tags={
                <Tag href="/docs/features/custom-commands">Custom command</Tag>
              }
            >
              <div className="text-sm text-mist-500">
                sarah used{" "}
                <span className="rounded bg-azure-500/20 px-1 text-azure-300">
                  /giveaway
                </span>
              </div>
            </Message>

            <Message
              avatar={<Avatar initial="G" color="bg-[#F5B544]" />}
              name="Giveaway Bot"
              app
              time="2:14 PM"
              tags={
                <>
                  <Tag href="/docs/features/white-label">Your own bot</Tag>
                  <Tag href="/docs/features/interactive-components">
                    Buttons
                  </Tag>
                </>
              }
            >
              <Embed color="#F5B544">
                <div className="mb-1 text-base font-semibold text-mist-100">
                  🎉 Nitro Giveaway
                </div>
                <div className="text-sm text-mist-300">
                  One month of Nitro for one lucky member. Hit the button to
                  enter.
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-semibold text-mist-100">Entries</div>
                    <div className="text-mist-300">{entered ? 313 : 312}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-mist-100">Ends</div>
                    <div className="text-mist-300">Sunday, 6 PM</div>
                  </div>
                </div>
              </Embed>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DiscordButton
                  style={entered ? "secondary" : "success"}
                  onClick={() => setEntered(true)}
                >
                  {entered ? "You're in ✓" : "Enter giveaway"}
                </DiscordButton>
                {entered && (
                  <span className="text-xs text-mist-500">
                    Only you can see this. Good luck!
                  </span>
                )}
              </div>
            </Message>

            <Message
              avatar={tom}
              name="tom"
              time="2:15 PM"
              tags={
                <Tag href="/docs/features/interactive-components">
                  Role button
                </Tag>
              }
            >
              <div className="text-sm text-mist-300">
                wait how do I get the{" "}
                <span className="rounded bg-[#57C271]/20 px-1 text-[#8EE0A5]">
                  @Gamer
                </span>{" "}
                role
              </div>
            </Message>

            <Message avatar={sarah} name="sarah" time="2:15 PM">
              <div className="text-sm text-mist-300">
                click the button in #roles lol
              </div>
              <Reactions items={[{ emoji: "😅", count: 3 }]} />
            </Message>

            <Divider label="Tuesday" />

            <Message
              avatar={server}
              name="Your Server"
              app
              time="6:30 PM"
              tags={
                <>
                  <Tag href="/docs/features/ai-assistant">Drafted with AI</Tag>
                  <Tag href="/docs/features/save-messages">Saved template</Tag>
                </>
              }
            >
              <Embed color="#2F8BFF">
                <div className="mb-1 text-base font-semibold text-mist-100">
                  Patch notes 1.4
                </div>
                <div className="text-sm leading-relaxed text-mist-300">
                  • Ranked queue is back
                  <br />• Fixed the bug where the map wouldn't load on Sundays
                  <br />• New emotes in the shop
                </div>
                <div className="mt-3 text-xs text-mist-500">
                  Full changelog on the website
                </div>
              </Embed>
              <div className="mt-2 flex gap-2">
                <DiscordButton style="secondary" href="/docs">
                  Changelog
                </DiscordButton>
              </div>
              <Reactions
                items={[
                  { emoji: "🔥", count: 58 },
                  { emoji: "🎮", count: 31 },
                ]}
              />
            </Message>

            <Message
              avatar={server}
              name="Your Server"
              app
              time="6:31 PM"
              tags={
                <Tag href="/docs/features/components-v2">Components V2</Tag>
              }
            >
              <div className="mt-1 max-w-lg rounded-md border border-solid border-white/10 bg-ink-700 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 text-sm text-mist-300">
                    <div className="mb-1 font-semibold text-mist-100">
                      Weekend event
                    </div>
                    Saturday tournament, 16 slots. Sign-ups open now.
                  </div>
                  <img
                    src="/img/logo.svg"
                    alt=""
                    className="h-16 w-16 rounded-lg"
                  />
                </div>
                <div className="my-3 h-px bg-white/10" />
                <div className="flex items-center justify-between gap-3 text-sm text-mist-300">
                  <span>3 of 16 slots taken</span>
                  <DiscordButton style="primary">Sign up</DiscordButton>
                </div>
              </div>
            </Message>

            <div className="px-4 pt-2 sm:px-6">
              <Typing who="tom" />
            </div>
          </div>
        </div>

        <ul className="mx-auto mt-10 grid max-w-3xl list-none grid-cols-1 gap-x-8 gap-y-2 p-0 text-sm text-mist-400 sm:grid-cols-2">
          {[
            ["Visual editor with live preview", "/docs"],
            ["Save messages and share them", "/docs/features/save-messages"],
            ["Custom name and avatar", "/docs/features/custom-branding"],
            ["Buttons and select menus", "/docs/features/interactive-components"],
            ["Scheduled and recurring messages", "/docs/guides/scheduled-messages"],
            ["Your own bot (white label)", "/docs/features/white-label"],
            ["Custom slash commands", "/docs/features/custom-commands"],
            ["AI assistant", "/docs/features/ai-assistant"],
            ["Components V2", "/docs/features/components-v2"],
            ["Message variables", "/docs/guides/variables"],
          ].map(([label, href]) => (
            <li key={href}>
              <a href={href} className="text-mist-400 hover:text-mist-100">
                {label} →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
