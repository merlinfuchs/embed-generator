import React from "react";
import {
  GiftIcon,
  HandRaisedIcon,
  WrenchIcon,
} from "@heroicons/react/24/solid";
import {
  Avatar,
  AvatarSpec,
  DiscordButton,
  Reactions,
  Typing,
} from "./discord";

const avatars: AvatarSpec[] = [
  { icon: HandRaisedIcon, color: "bg-azure-500" },
  { icon: GiftIcon, color: "bg-amber-400" },
  { icon: WrenchIcon, color: "bg-[#2FA85C]" },
  { src: "/img/logo.svg" },
];

const swatches = [
  "#2F8BFF",
  "#57F287",
  "#FEE75C",
  "#EB459E",
  "#ED4245",
  "#5865F2",
];

function Editable({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}): JSX.Element {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => onChange(e.currentTarget.textContent ?? "")}
      className={`${className} cursor-text rounded-sm outline-none ring-azure-400/60 hover:ring-1 focus:ring-1`}
    >
      {value}
    </span>
  );
}

// The hero example is a tiny editor: click text to edit, pick a color, toggle parts.
export default function HeroPreview(): JSX.Element {
  const [color, setColor] = React.useState(swatches[0]);
  const [name, setName] = React.useState("Community Team");
  const [avatar, setAvatar] = React.useState(0);
  const [title, setTitle] = React.useState("Welcome to the server!");
  const [desc, setDesc] = React.useState(
    "Read #rules, grab your roles below and say hi in #general. We don't bite."
  );
  const [showImage, setShowImage] = React.useState(true);
  const [showButtons, setShowButtons] = React.useState(true);
  const [roleGiven, setRoleGiven] = React.useState(false);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist-500">
        <span>Click text to edit, click the avatar to swap it.</span>
        <span className="flex items-center gap-1.5">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Set color ${c}`}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={[
                "h-4 w-4 cursor-pointer rounded-full border-2 border-solid p-0",
                color === c ? "border-white" : "border-transparent",
              ].join(" ")}
            />
          ))}
        </span>
        <label className="flex cursor-pointer items-center gap-1">
          <input
            type="checkbox"
            checked={showImage}
            onChange={(e) => setShowImage(e.target.checked)}
          />
          Image
        </label>
        <label className="flex cursor-pointer items-center gap-1">
          <input
            type="checkbox"
            checked={showButtons}
            onChange={(e) => setShowButtons(e.target.checked)}
          />
          Buttons
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-solid border-white/10 bg-ink-800 shadow-card">
        <div className="flex items-center gap-2 border-0 border-b border-solid border-white/5 px-4 py-2.5 text-sm text-mist-500">
          <span className="text-lg leading-none">#</span>
          <span className="font-medium text-mist-300">welcome</span>
        </div>
        <div className="flex gap-4 px-4 py-5">
          <button
            type="button"
            aria-label="Swap avatar"
            onClick={() => setAvatar((a) => (a + 1) % avatars.length)}
            className="h-10 w-10 flex-none cursor-pointer rounded-full border-0 bg-transparent p-0 ring-azure-400/60 hover:ring-2"
          >
            <Avatar {...avatars[avatar]} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <Editable
                value={name}
                onChange={setName}
                className="font-medium text-mist-100"
              />
              <span className="rounded bg-azure-500 px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                App
              </span>
              <span className="text-xs text-mist-500">Today at 9:41</span>
            </div>

            <div
              className="mt-1 max-w-md overflow-hidden rounded-md border-0 border-l-4 border-solid bg-ink-700"
              style={{ borderColor: color }}
            >
              <div className="p-4">
                <Editable
                  value={title}
                  onChange={setTitle}
                  className="mb-1 block text-base font-semibold text-mist-100"
                />
                <Editable
                  value={desc}
                  onChange={setDesc}
                  className="block text-sm leading-relaxed text-mist-300"
                />
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-semibold text-mist-100">Members</div>
                    <div className="text-mist-300">12,480</div>
                  </div>
                  <div>
                    <div className="font-semibold text-mist-100">Next event</div>
                    <div className="text-mist-300">Friday, 8 PM</div>
                  </div>
                </div>
                {showImage && (
                  <img
                    src="/img/rick.jpg"
                    alt=""
                    className="mt-3 block w-full rounded"
                  />
                )}
              </div>
            </div>

            {showButtons && (
              <div className="mt-2 flex flex-wrap gap-2">
                <DiscordButton
                  style="primary"
                  onClick={() => setRoleGiven(true)}
                >
                  Get Roles
                </DiscordButton>
                <DiscordButton style="secondary" href="/docs">
                  Website
                </DiscordButton>
                <DiscordButton
                  style="danger"
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                >
                  Don't click
                </DiscordButton>
              </div>
            )}

            <Reactions
              items={[
                { emoji: "👋", count: 42 },
                { emoji: "🎉", count: 17 },
                { emoji: "👀", count: 6 },
              ]}
            />

            {roleGiven && (
              <div className="mt-3 flex items-center gap-2 text-sm text-mist-300">
                <span className="rounded bg-azure-500/20 px-1.5 py-0.5 text-xs text-azure-300">
                  Only you can see this
                </span>
                You now have the{" "}
                <span className="rounded bg-azure-500/20 px-1 text-azure-300">
                  @Member
                </span>{" "}
                role.
              </div>
            )}
          </div>
        </div>
        <div className="border-0 border-t border-solid border-white/5 px-4 py-2">
          <Typing who="Merlin" />
        </div>
      </div>
    </div>
  );
}
