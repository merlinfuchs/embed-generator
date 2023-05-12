import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function HomeHeader(): JSX.Element {
  return (
    <div className="bg-blurple">
      <div className="bg-blurple flex items-center justify-between px-5 py-4 max-w-6xl mx-auto">
        <div className="items-center flex space-x-4">
          <img src="/img/logo.svg" alt="" className="rounded-full" />
          <div className="font-bold text-xl hidden lg:block text-gray-200 tracking-tight">
            Embed Generator
          </div>
        </div>
        <div className="items-center flex space-x-8">
          <div className="space-x-3 flex items-center text-gray-300">
            <a className="hover:text-white" href="/source">
              Source Code
            </a>
            <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
            <a className="hover:text-white" href="/docs">
              Documentation
            </a>
            <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
            <a className="hover:text-white" href="/discord">
              Discord Server
            </a>
          </div>
          <a
            className="px-4 py-2 text-lg rounded-md border-2 border-gray-300 flex items-center text-gray-200 space-x-3 hover:text-white hover:border-white hover:bg-white/20 transition-colors"
            href="/app"
          >
            <SparklesIcon className="h-5 w-5" />
            <div>Open App</div>
          </a>
        </div>
      </div>
    </div>
  );
}
