import React from "react";

// Hand-built message mockup in a navy card instead of Discord gray.
export default function HeroPreview(): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-solid border-white/10 bg-ink-800 shadow-card">
      <div className="flex items-center gap-2 border-0 border-b border-solid border-white/5 px-4 py-2.5 text-sm text-mist-500">
        <span className="text-lg leading-none">#</span>
        <span className="font-medium text-mist-300">announcements</span>
      </div>
      <div className="flex gap-4 px-4 py-5">
        <img
          src="/img/logo.svg"
          alt=""
          className="h-10 w-10 flex-none rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-sm">
            <span className="font-medium text-mist-100">Your Server</span>
            <span className="rounded bg-azure-500 px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-white">
              App
            </span>
            <span className="text-xs text-mist-500">Today at 9:41</span>
          </div>
          <div className="text-sm text-mist-300">
            Welcome to the server! Here's everything you need to know.
          </div>

          <div className="mt-2 max-w-md overflow-hidden rounded-md border-0 border-l-4 border-solid border-azure-500 bg-ink-700">
            <div className="p-4">
              <div className="mb-1 text-base font-semibold text-mist-100">
                Community Guidelines
              </div>
              <div className="text-sm leading-relaxed text-mist-300">
                Be kind, stay on topic, and read{" "}
                <span className="text-azure-400">#rules</span> before posting.
                Grab your roles below.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-semibold text-mist-100">Members</div>
                  <div className="text-mist-300">12,480</div>
                </div>
                <div>
                  <div className="font-semibold text-mist-100">Next event</div>
                  <div className="text-mist-300">Friday, 8 PM UTC</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-mist-500">
                <img
                  src="/img/logo.svg"
                  alt=""
                  className="h-4 w-4 rounded-full"
                />
                Posted by the mod team
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: "Get Roles", cls: "bg-discord-button" },
              { label: "Join Event", cls: "bg-discord-success" },
              { label: "Website", cls: "bg-ink-600" },
            ].map((b) => (
              <span
                key={b.label}
                className={`${b.cls} rounded px-4 py-1.5 text-sm font-medium text-white`}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
