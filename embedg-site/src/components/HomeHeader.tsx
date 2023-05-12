import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function HomeHeader(): JSX.Element {
  return (
    <div className="bg-blurple px-5">
      <div className="bg-blurple flex items-center justify-between py-4 max-w-7xl mx-auto">
        <div className="items-center flex space-x-4">
          <img src="/img/logo.svg" alt="" className="rounded-full" />
          <div className="font-bold text-xl hidden lg:block text-gray-200 tracking-tight">
            Embed Generator
          </div>
        </div>
        <div className="items-center flex space-x-5 md:space-x-8">
          <div className="space-x-3 flex items-center">
            <a
              className="hover:text-white text-gray-300 hidden md:block"
              href="/source"
            >
              Source Code
            </a>
            <div className="h-1 w-1 bg-gray-400 rounded-full hidden md:block"></div>
            <a
              className="hover:text-white text-gray-300 hidden sm:block"
              href="/discord"
            >
              Discord Server
            </a>
            <div className="h-1 w-1 bg-gray-400 rounded-full hidden sm:block"></div>
            <a className="hover:text-white text-gray-300" href="/docs">
              Documentation
            </a>
          </div>
          <a
            className="px-4 py-2 text-lg rounded-md border-solid border-2 border-gray-300 flex items-center text-gray-200 space-x-3 hover:text-white hover:border-white hover:bg-white/20 transition-colors  hover:no-underline"
            href="/app"
          >
            <SparklesIcon className="h-5 w-5" />
            <div className="text-white">Open App</div>
          </a>
        </div>
      </div>
    </div>
  );
}
