import React from "react";

import {
  CloudIcon,
  CursorArrowRippleIcon,
  TagIcon,
} from "@heroicons/react/24/solid";

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
    icon: TagIcon,
  },
  {
    name: "Interactive Components",
    description:
      "Add interactivity to your messages with buttons and select menus. You can hand out roles or send custom responses to your users!",
    href: "/docs/interactive-components",
    icon: CursorArrowRippleIcon,
  },
];

export default function HomeFeatures(): JSX.Element {
  return (
    <div className="bg-dark-2 px-16">
      <div className="max-w-7xl mx-auto text-white py-20 lg:py-32">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <div className="text-base font-semibold leading-7 text-white">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blurple">
                    <feature.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  {feature.name}
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
