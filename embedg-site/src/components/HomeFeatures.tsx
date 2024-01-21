import React from "react";

import {
  CloudIcon,
  CommandLineIcon,
  CursorArrowRippleIcon,
  EyeDropperIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

const features = [
  {
    name: "Save Messages",
    description:
      "Save your messages in the cloud and have them available on all your devices. You can also share them with your friends!",
    href: "/docs/save-messages",
    icon: CloudIcon,
  },
  {
    name: "Custom Branding",
    description:
      "Customize your embeds with your own branding. You can even change the username and avatar of the message to your liking!",
    href: "/docs/custom-branding",
    icon: EyeDropperIcon,
  },
  {
    name: "Interactive Components",
    description:
      "Add interactivity to your messages with buttons and select menus. You can hand out roles or send custom responses to your users!",
    href: "/docs/interactive-components",
    icon: CursorArrowRippleIcon,
  },
  {
    name: "White Label",
    description:
      "Integrate your own bot into Embed Generator to change the username and avatar of responses to buttons, and select menus!",
    href: "/docs/white-label",
    icon: TagIcon,
    premium: true,
  },
  {
    name: "Custom Commands",
    description:
      "Add your own commands with custom logic and responses to Embed Generator that your server members can use!",
    href: "/docs/custom-commands",
    icon: CommandLineIcon,
    premium: true,
  },
  {
    name: "AI Assistant",
    description:
      "Use our powerful AI assistant to quickly draft new messages and boost your creativity!",
    href: "/docs/ai-assistant",
    icon: SparklesIcon,
    premium: true,
  },
];

export default function HomeFeatures(): JSX.Element {
  return (
    <div className="bg-dark-2 px-16">
      <div className="max-w-7xl mx-auto text-white py-20 lg:py-32">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-32 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <div className="text-base font-semibold leading-7 text-white">
                  <div
                    className={clsx(
                      "mb-6 flex h-10 w-10 items-center justify-center rounded-lg",
                      feature.premium ? "bg-orange-400" : "bg-blurple"
                    )}
                  >
                    <feature.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="text-base mb-1">{feature.name}</h2>
                </div>
                <div className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-300">
                  <p className="flex-auto ml-0">{feature.description}</p>
                  <p>
                    <a
                      href={feature.href}
                      className="text-sm font-semibold leading-6 text-indigo-400"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
