import React from "react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Open App", href: "/app" },
      { label: "Premium", href: "/premium" },
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Colored Text Generator", href: "/app/tools/colored-text" },
      { label: "Embed Links", href: "/app/tools/embed-links" },
      { label: "Webhook Info", href: "/app/tools/webhook-info" },
    ],
  },
  {
    title: "Features",
    links: [
      { label: "Buttons & Select Menus", href: "/docs/features/interactive-components" },
      { label: "Custom Name & Avatar", href: "/docs/features/custom-branding" },
      { label: "Saved Messages", href: "/docs/features/save-messages" },
      { label: "Variables", href: "/docs/guides/variables" },
      { label: "Components V2", href: "/docs/features/components-v2" },
      { label: "Scheduled Messages", href: "/docs/guides/scheduled-messages" },
      { label: "Custom Commands", href: "/docs/features/custom-commands" },
      { label: "White Label Bot", href: "/docs/features/white-label" },
      { label: "AI Assistant", href: "/docs/features/ai-assistant" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: "/discord", external: true },
      { label: "GitHub", href: "/source", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Imprint", href: "/imprint" },
    ],
  },
];

export default function HomeFooter(): JSX.Element {
  return (
    <footer className="border-0 border-t border-solid border-white/5 bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <div className="mb-3 flex items-center gap-3 text-mist-100">
              <img src="/img/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
              <span className="font-semibold">Embed Generator</span>
            </div>
            <p className="max-w-xs text-sm text-mist-500">
              The visual editor for Discord messages. Free and open source.
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <div className="mb-3 text-sm font-semibold text-mist-100">
                {c.title}
              </div>
              <div className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target={l.external ? "_blank" : undefined}
                    rel={l.external ? "noreferrer" : undefined}
                    className="text-sm text-mist-400 hover:text-mist-100"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 border-0 border-t border-solid border-white/5 pt-6 text-xs text-mist-500">
          {`© ${new Date().getFullYear()} Merlin Fuchs & Contributors. Not affiliated with or endorsed by Discord Inc.`}
        </div>
      </div>
    </footer>
  );
}
