import {
  ClockIcon,
  CodeBracketSquareIcon,
  PhotoIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function ToolsView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20">
        <div className="mb-10">
          <h1 className="text-white font-medium mb-3 flex items-center space-x-2 text-2xl">
            Utility Tools
          </h1>
          <div className="text-gray-400 font-light text-sm">
            These tools are designed to help you with various tasks related to
            Discord. They are not directly related to embeds, but some can be
            used to help you create embeds.
          </div>
        </div>
        <div className="space-y-5">
          <Link
            className="p-5 bg-dark-3 rounded-md flex cursor-pointer space-x-5 transform hover:scale-101"
            to="/tools/colored-text"
          >
            <div className="flex-none h-12 w-12 md:h-20 md:w-20 flex items-center justify-center bg-dark-2 rounded-full">
              <SwatchIcon className="h-8 w-8 md:h-12 md:w-12 text-blurple" />
            </div>
            <div>
              <div className="text-white font-medium mb-3 text-xl transition-transform">
                <span className="text-blurple">Colored</span>{" "}
                <span>Text Generator</span>
              </div>
              <div className="text-gray-400 font-light text-sm">
                Discord supports colored text via ANSI color codes in code
                blocks. This tool makes it very simple to generate colored text
                that you can then use in your Discord message.
              </div>
            </div>
          </Link>
          <Link
            className="p-5 bg-dark-3 rounded-md flex cursor-pointer space-x-5 transform hover:scale-101"
            to="/tools/embed-links"
          >
            <div className="flex-none h-12 w-12 md:h-20 md:w-20 flex items-center justify-center bg-dark-2 rounded-full">
              <PhotoIcon className="h-8 w-8 md:h-12 md:w-12 text-blurple" />
            </div>
            <div>
              <div className="text-white font-medium mb-3 text-xl transition-transform">
                Embed Links
              </div>
              <div className="text-gray-400 font-light text-sm">
                Embed links are a way to share rich embeds with others without
                needing to send the actual embed. This tool lets you easily
                generate embed links for your embeds.
              </div>
            </div>
          </Link>
          <Link
            className="p-5 bg-dark-3 rounded-md flex cursor-pointer space-x-5 transform hover:scale-101"
            to="/tools/webhook-info"
          >
            <div className="flex-none h-12 w-12 md:h-20 md:w-20 flex items-center justify-center bg-dark-2 rounded-full">
              <CodeBracketSquareIcon className="h-8 w-8 md:h-12 md:w-12 text-blurple" />
            </div>
            <div>
              <div className="text-white font-medium mb-3 text-xl transition-transform">
                Webhook Info
              </div>
              <div className="text-gray-400 font-light text-sm">
                Discord webhooks are a great way to send messages to Discord
                channels without a bot. This tool lets you easily inspect and
                get information about a webhook.
              </div>
            </div>
          </Link>
          {/* 
        <Link
            className="p-5 bg-dark-3 rounded-md flex cursor-pointer space-x-5 transform hover:scale-101"
            to="/tools/timestamps"
          >
            <div className="flex-none h-12 w-12 md:h-20 md:w-20 flex items-center justify-center bg-dark-2 rounded-full">
              <ClockIcon className="h-8 w-8 md:h-12 md:w-12 text-blurple" />
            </div>
            <div>
              <div className="text-white font-medium mb-3 text-xl transition-transform">
                Timestamp Formatter
              </div>
              <div className="text-gray-400 font-light text-sm">
                Discord supports putting timestamps in messages which respect
                timezones and even relative times like "3 hours ago". This tool
                lets you easily generate timestamps for your messages.
              </div>
            </div>
          </Link>
          */}
        </div>
      </div>
    </div>
  );
}
