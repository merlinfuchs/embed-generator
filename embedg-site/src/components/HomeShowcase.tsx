import React from "react";
import {
  ClockIcon,
  CommandLineIcon,
  CursorArrowRippleIcon,
  EyeDropperIcon,
  SparklesIcon,
  TagIcon,
  CloudIcon,
  Squares2X2Icon,
  VariableIcon,
} from "@heroicons/react/24/outline";
import { Avatar, DiscordButton, Reactions, Typing } from "./discord";

type FeatureId =
  | "scheduled"
  | "commands"
  | "whitelabel"
  | "components"
  | "branding"
  | "variables"
  | "ai"
  | "save"
  | "v2";

const features: {
  id: FeatureId;
  name: string;
  blurb: string;
  href: string;
  icon: typeof ClockIcon;
  premium?: boolean;
}[] = [
  {
    id: "components",
    name: "Buttons & select menus",
    blurb: "Hand out roles, reply, or link somewhere.",
    href: "/docs/features/interactive-components",
    icon: CursorArrowRippleIcon,
  },
  {
    id: "branding",
    name: "Custom name & avatar",
    blurb: "Every message looks like it's from your server.",
    href: "/docs/features/custom-branding",
    icon: EyeDropperIcon,
  },
  {
    id: "save",
    name: "Saved messages",
    blurb: "Keep templates and reuse them anywhere.",
    href: "/docs/features/save-messages",
    icon: CloudIcon,
  },
  {
    id: "variables",
    name: "Variables",
    blurb: "Member names, counts, dates, filled in live.",
    href: "/docs/guides/variables",
    icon: VariableIcon,
  },
  {
    id: "v2",
    name: "Components V2",
    blurb: "Sections, thumbnails, separators. New layouts.",
    href: "/docs/features/components-v2",
    icon: Squares2X2Icon,
  },
  {
    id: "scheduled",
    name: "Scheduled messages",
    blurb: "Send once, or every hour, day or week.",
    href: "/docs/guides/scheduled-messages",
    icon: ClockIcon,
    premium: true,
  },
  {
    id: "commands",
    name: "Custom commands",
    blurb: "Slash commands your members can run.",
    href: "/docs/features/custom-commands",
    icon: CommandLineIcon,
    premium: true,
  },
  {
    id: "whitelabel",
    name: "Your own bot",
    blurb: "Replies come from your bot, not ours.",
    href: "/docs/features/white-label",
    icon: TagIcon,
    premium: true,
  },
  {
    id: "ai",
    name: "AI assistant",
    blurb: "Draft a message from a sentence.",
    href: "/docs/features/ai-assistant",
    icon: SparklesIcon,
    premium: true,
  },
];

function Message({
  id,
  active,
  ids,
  avatar,
  name,
  app,
  time,
  children,
}: {
  id: string;
  active: FeatureId | null;
  ids: FeatureId[];
  avatar: React.ReactNode;
  name: string;
  app?: boolean;
  time: string;
  children: React.ReactNode;
}) {
  const hit = active !== null && ids.includes(active);
  const dim = active !== null && !hit;
  return (
    <div
      data-msg={id}
      className={[
        "flex gap-4 px-4 py-3 transition-all duration-300 sm:px-6",
        hit ? "bg-azure-500/10 shadow-[inset_3px_0_0_0_#2F8BFF]" : "",
        dim ? "opacity-30" : "",
      ].join(" ")}
    >
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

// Feature list on the left, chat log on the right in the same order. Hovering a feature lights up
// the messages it produced and scrolls the log to the first one.
export default function HomeShowcase(): JSX.Element {
  // Click selects (sticks), hover previews on top of the selection.
  const [selected, setSelected] = React.useState<FeatureId | null>(null);
  const [hovered, setHovered] = React.useState<FeatureId | null>(null);
  const active = hovered ?? selected;
  const [entered, setEntered] = React.useState(false);
  const [roles, setRoles] = React.useState<string[]>([]);
  const toggleRole = (r: string) =>
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  const logRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = React.useRef<HTMLElement>(null);
  const [touched, setTouched] = React.useState(false);
  const [inView, setInView] = React.useState(false);

  // First message per feature, used as scroll target.
  const firstMsg: Record<FeatureId, string> = {
    components: "roles",
    branding: "patch",
    save: "patch",
    variables: "welcome",
    v2: "event",
    scheduled: "morning",
    commands: "giveaway-cmd",
    whitelabel: "giveaway",
    ai: "halloween",
  };

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Walk through the features on its own until the visitor takes over.
  React.useEffect(() => {
    if (touched || !inView) return;
    const t = setInterval(() => {
      setSelected((cur) => {
        const i = features.findIndex((f) => f.id === cur);
        const next = features[(i + 1) % features.length].id;
        scrollToFeature(next);
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, [touched, inView]);

  const scrollToFeature = (id: FeatureId) => {
    const log = logRef.current;
    const el = log?.querySelector<HTMLElement>(`[data-msg="${firstMsg[id]}"]`);
    if (log && el) {
      log.scrollTo({ top: el.offsetTop - 56, behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="border-0 border-t border-solid border-white/5 bg-ink-950/40"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <div className="mb-10 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
            What it can do, shown in a real-ish server.
          </h2>
          <p className="text-lg text-mist-400">
            Pick a feature to see where it shows up in the chat.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div
            className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0"
            onMouseLeave={() => setHovered(null)}
          >
            {features.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseEnter={() => {
                  setTouched(true);
                  setHovered(f.id);
                  scrollToFeature(f.id);
                }}
                onClick={() => {
                  setTouched(true);
                  setSelected(f.id);
                  scrollToFeature(f.id);
                }}
                className={[
                  "flex flex-none cursor-pointer items-start gap-3 rounded-xl border border-solid bg-transparent px-3 py-2.5 text-left font-sans transition-colors lg:flex-auto",
                  active === f.id
                    ? "border-azure-500/50 bg-azure-500/10"
                    : "border-transparent hover:border-white/10 hover:bg-white/[0.03]",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg",
                    f.premium
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-azure-500/15 text-azure-300",
                  ].join(" ")}
                >
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-mist-100">
                    <span className="whitespace-nowrap">{f.name}</span>
                    {f.premium && (
                      <span className="rounded-full bg-amber-400/15 px-1.5 text-[10px] font-semibold uppercase text-amber-300">
                        Premium
                      </span>
                    )}
                  </span>
                  <span className="hidden text-xs text-mist-400 lg:block">
                    {f.blurb}
                  </span>
                  {selected === f.id && (
                    <a
                      href={f.href}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 hidden text-xs font-medium text-azure-400 hover:text-azure-300 lg:block"
                    >
                      Read the docs →
                    </a>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-solid border-white/10 bg-ink-800 shadow-card">
            <div className="flex items-center gap-2 border-0 border-b border-solid border-white/5 px-4 py-2.5 text-sm text-mist-500 sm:px-6">
              <span className="text-lg leading-none">#</span>
              <span className="font-medium text-mist-300">general</span>
            </div>

            <div
              ref={logRef}
              onWheel={() => setTouched(true)}
              onTouchMove={() => setTouched(true)}
              className="relative max-h-[640px] overflow-y-auto py-3 [scrollbar-color:#34435F_transparent] [scrollbar-width:thin]"
            >
              <Divider label="Monday" />

              <Message
                id="roles"
                active={active}
                ids={["components"]}
                avatar={server}
                name="Embed Generator"
                app
                time="10:12 AM"
              >
                <div className="text-sm text-mist-300">
                  Pick your roles. Click again to remove one.
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["🎮 Gamer", "🎨 Artist", "📅 Events"].map((r) => (
                    <DiscordButton
                      key={r}
                      style={roles.includes(r) ? "success" : "secondary"}
                      onClick={() => toggleRole(r)}
                    >
                      {r}
                      {roles.includes(r) ? " ✓" : ""}
                    </DiscordButton>
                  ))}
                </div>
                {roles.length > 0 && (
                  <div className="mt-2 text-xs text-mist-500">
                    Only you can see this. You now have {roles.length}{" "}
                    {roles.length === 1 ? "role" : "roles"}.
                  </div>
                )}
              </Message>

              <Message
                id="tom-role"
                active={active}
                ids={["components"]}
                avatar={tom}
                name="tom"
                time="10:15 AM"
              >
                <div className="text-sm text-mist-300">
                  wait how do I get the{" "}
                  <span className="rounded bg-[#57C271]/20 px-1 text-[#8EE0A5]">
                    @Gamer
                  </span>{" "}
                  role
                </div>
              </Message>

              <Message
                id="sarah-role"
                active={active}
                ids={["components"]}
                avatar={sarah}
                name="sarah"
                time="10:15 AM"
              >
                <div className="text-sm text-mist-300">
                  it's the button right above you lol
                </div>
                <Reactions items={[{ emoji: "😅", count: 3 }]} />
              </Message>

              <Message
                id="patch"
                active={active}
                ids={["branding", "save"]}
                avatar={<Avatar initial="P" color="bg-[#57C271]" />}
                name="Patch Bot"
                app
                time="6:30 PM"
              >
                <Embed color="#2F8BFF">
                  <div className="mb-1 text-base font-semibold text-mist-100">
                    Patch notes 1.4
                  </div>
                  <div className="text-sm leading-relaxed text-mist-300">
                    • Ranked queue is back
                    <br />• Fixed the bug where the map wouldn't load on
                    Sundays
                    <br />• New emotes in the shop
                  </div>
                  <div className="mt-3 text-xs text-mist-500">
                    Sent from the saved "Patch notes" template
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

              <Divider label="Tuesday" />

              <Message
                id="welcome"
                active={active}
                ids={["variables", "branding"]}
                avatar={<Avatar initial="W" color="bg-[#2F8BFF]" />}
                name="Welcome Bot"
                app
                time="11:02 AM"
              >
                <div className="text-sm text-mist-300">
                  Welcome{" "}
                  <span className="rounded bg-azure-500/20 px-1 text-azure-300">
                    @lena
                  </span>
                  ! You're member #12,481. Say hi 👋
                </div>
              </Message>

              <Message
                id="event"
                active={active}
                ids={["v2", "components"]}
                avatar={server}
                name="Your Server"
                app
                time="6:31 PM"
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

              <Divider label="Wednesday" />

              <Message
                id="morning"
                active={active}
                ids={["scheduled"]}
                avatar={server}
                name="Your Server"
                app
                time="9:00 AM"
              >
                <div className="text-sm text-mist-300">
                  ☀️ Morning everyone! Voice hangout tonight at 8, bring
                  snacks.
                </div>
                <Reactions items={[{ emoji: "☀️", count: 23 }]} />
              </Message>

              <Message
                id="giveaway-cmd"
                active={active}
                ids={["commands"]}
                avatar={sarah}
                name="sarah"
                time="2:14 PM"
              >
                <div className="text-sm text-mist-500">
                  sarah used{" "}
                  <span className="rounded bg-azure-500/20 px-1 text-azure-300">
                    /giveaway
                  </span>
                </div>
              </Message>

              <Message
                id="giveaway"
                active={active}
                ids={["commands", "whitelabel", "components"]}
                avatar={<Avatar initial="G" color="bg-[#F5B544]" />}
                name="Giveaway Bot"
                app
                time="2:14 PM"
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
                id="halloween"
                active={active}
                ids={["ai"]}
                avatar={server}
                name="Your Server"
                app
                time="7:45 PM"
              >
                <Embed color="#EB459E">
                  <div className="mb-1 text-base font-semibold text-mist-100">
                    🎃 Spooky Movie Night
                  </div>
                  <div className="text-sm leading-relaxed text-mist-300">
                    Friday at 9 PM in the Movie voice channel. Vote for the
                    film below, costumes optional but encouraged.
                  </div>
                  <div className="mt-3 text-xs text-mist-500">
                    Drafted with the AI assistant from "movie night friday,
                    halloween theme"
                  </div>
                </Embed>
                <Reactions
                  items={[
                    { emoji: "🎃", count: 19 },
                    { emoji: "🍿", count: 12 },
                  ]}
                />
              </Message>

              <div className="px-4 pt-2 sm:px-6">
                <Typing who="tom" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
