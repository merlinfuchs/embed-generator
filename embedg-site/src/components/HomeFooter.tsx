import React from "react";

export default function HomeFooter(): JSX.Element {
  return (
    <div className="bg-dark-1 px-16 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-12">
          <div className="space-y-3">
            <div className="text-lg font-medium">Docs</div>
            <div className="space-y-2 flex flex-col">
              <a href="/docs" className="text-gray-300 hover:text-white">
                Tutorial
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-lg font-medium">Community</div>
            <div className="space-y-2 flex flex-col">
              <a
                href="/source"
                target="_blank"
                className="text-gray-300 hover:text-white"
              >
                GitHub
              </a>
              <a
                href="/discord"
                target="_blank"
                className="text-gray-300 hover:text-white"
              >
                Discord
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-lg font-medium">Legal</div>
            <div className="space-y-2 flex flex-col">
              <a href="/terms" className="text-gray-300 hover:text-white">
                Terms of Service
              </a>
              <a href="/privacy" className="text-gray-300 hover:text-white">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 pb-6">{`Copyright © ${new Date().getFullYear()} Merlin Fuchs & Contributors | Not affiliated with or endorsed by Discord Inc.`}</div>
      </div>
    </div>
  );
}
